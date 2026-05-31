export const OPTION_DEFAULTS = {
  hml: ['H', 'M', 'L'],
  raci: ['R', 'A', 'C', 'I'],
  assumptionClass: ['KNOWN', 'UNKNOWN', 'RISKY'],
  questionStatus: ['Open', 'In Progress', 'Resolved', 'Blocked'],
  projectType: [
    { value: 'client-services', label: 'Client Services — Billable engagement with an external client' },
    { value: 'internal-product', label: 'Internal Product — Development work on internal platform or tooling' },
  ],
  priority: [
    { value: 'P0', label: 'P0 — Critical / Business-blocking (requires immediate start)' },
    { value: 'P1', label: 'P1 — High priority (this sprint or next)' },
    { value: 'P2', label: 'P2 — Normal (scheduled in roadmap)' },
    { value: 'P3', label: 'P3 — Low / Nice-to-have (backlog)' },
  ],
  roadmapStatus: [
    { value: 'on-roadmap', label: 'On existing roadmap' },
    { value: 'proposing', label: 'Proposing addition to roadmap' },
    { value: 'hotfix', label: 'Hotfix / unplanned' },
    { value: 'spike', label: 'Research / exploratory spike' },
  ],
  appetite: [
    { value: 'small', label: 'Small — 1–2 weeks' },
    { value: 'medium', label: 'Medium — 3–4 weeks' },
    { value: 'large', label: 'Large — 6+ weeks' },
    { value: 'spike', label: 'Spike — 1–3 days exploration only' },
  ],
  gateDecision: [
    { value: 'approved', label: '✅ APPROVED — Proceed to System Design' },
    { value: 'needs-revision', label: '🔄 NEEDS REVISION — Return with comments' },
    { value: 'rejected', label: '❌ REJECTED — Project not viable at this time' },
  ],
} as const

export type OptionKey = keyof typeof OPTION_DEFAULTS

export function getDefaultStringOptions(key: 'hml' | 'raci' | 'assumptionClass' | 'questionStatus'): string[] {
  return [...OPTION_DEFAULTS[key]]
}

export function getDefaultChoiceOptions(
  key: 'projectType' | 'priority' | 'roadmapStatus' | 'appetite' | 'gateDecision',
): { value: string; label: string }[] {
  return OPTION_DEFAULTS[key].map((o) => ({ ...o }))
}
