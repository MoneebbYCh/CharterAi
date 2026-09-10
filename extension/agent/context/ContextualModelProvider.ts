import type { Finding, ProjectFact } from '../contracts/Finding'
import type { ModelProvider } from '../model/ModelProvider'
import type { ModelEvent, ModelRequest } from '../model/ModelTypes'
import type { AgentSession } from '../session'
import { buildDocumentKnowledgePack } from '../knowledge/KnowledgePromptBuilder'
import { buildContext } from './ContextBuilder'

export interface ContextStateSource {
  session(): AgentSession | undefined
  findings(): Finding[]
  facts(): ProjectFact[]
  evidence(): EvidenceRecord[]
  /** Stable workspace/project instructions supplied by the host. */
  projectInstructions?(): string[]
}

/**
 * The single model boundary for runtime context. Wrapping the provider means
 * planner, tool loops and every worker receive the exact same bounded,
 * provenance-aware session context without each caller rebuilding prompts.
 */
export class ContextualModelProvider implements ModelProvider {
  constructor(
    private readonly delegate: ModelProvider,
    private readonly source: ContextStateSource,
    private readonly budget = 24_000,
  ) {}

  stream(request: ModelRequest, signal: AbortSignal): AsyncIterable<ModelEvent> {
    return this.delegate.stream(this.withContext(request), signal)
  }

  private withContext(request: ModelRequest): ModelRequest {
    const session = this.source.session()
    const pack = buildDocumentKnowledgePack({
      facts: this.source.facts(),
      findings: this.source.findings(),
      evidence: this.source.evidence(),
      tokenBudget: Math.floor(this.budget * 0.6),
      documentTitle: request.context?.task?.title,
    })
    const knowledgeFindings = [
      ...pack.layers.knowledgeGaps,
      ...pack.layers.surveySummary,
      ...pack.layers.priorAnalysis,
      ...pack.layers.facts,
      ...pack.layers.findings,
    ]
    const recentTurns = (session?.turns ?? []).slice(-6).map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
    const objective = request.messages.filter((message) => message.role === 'user').at(-1)?.content ?? ''
    const task = request.context?.task
    const taskState = task
      ? [
          'Current task state:',
          task.taskId ? `- Task: ${task.taskId}` : '',
          task.nodeId ? `- Node: ${task.nodeId}${task.title ? ` (${task.title})` : ''}` : task.title ? `- Task title: ${task.title}` : '',
          task.status ? `- Status: ${task.status}` : '',
          task.objective ? `- Node objective: ${task.objective}` : '',
          task.dependencies?.length ? `- Dependencies: ${task.dependencies.join(', ')}` : '',
        ].filter(Boolean).join('\n')
      : ''
    const blocks = buildContext({
      system: request.system,
      objective: `Current objective:\n${objective}`,
      roleSpec: taskState,
      instructions: [...(this.source.projectInstructions?.() ?? []), ...(request.context?.instructions ?? [])],
      findings: knowledgeFindings,
      evidenceExcerpts: pack.layers.evidenceExcerpts,
      conversation: [session?.conversationSummary ? `Prior session summary:\n${session.conversationSummary}` : '', ...recentTurns],
    }, this.budget)
    // `context` is runtime metadata only. Do not allow wrapped provider
    // implementations to accidentally serialize it to an external API.
    const { context: _context, ...providerRequest } = request
    return { ...providerRequest, system: blocks.join('\n\n') }
  }
}
