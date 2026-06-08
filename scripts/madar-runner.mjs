/**
 * Bridge script that runs madar's generateGraph in native ESM.
 * Invoked via child_process.fork() from the VS Code extension.
 *
 * Usage: node scripts/madar-runner.mjs <workspace-root>
 *
 * Outputs: JSON to stdout with { success: true, graphPath, result }
 *          or { success: false, error: string }
 * Progress: JSON lines written to stderr with { step, message, current?, total? }
 */

import { generateGraph } from '../node_modules/@lubab/madar/dist/src/infrastructure/generate.js'
import { resolve } from 'path'

const workspaceRoot = resolve(process.argv[2] || process.cwd())

function emitProgress(step, message, current, total) {
  process.stderr.write(JSON.stringify({ step, message, current, total }) + '\n')
}

async function main() {
  const result = generateGraph(workspaceRoot, {
    noHtml: true,
    onProgress: (p) => emitProgress(p.step, p.message, p.current, p.total),
  })

  const graphPath = result.graphPath

  const output = {
    success: true,
    graphPath,
    result: {
      totalFiles: result.totalFiles,
      codeFiles: result.codeFiles,
      nonCodeFiles: result.nonCodeFiles,
      nodeCount: result.nodeCount,
      edgeCount: result.edgeCount,
      communityCount: result.communityCount,
      changedFiles: result.changedFiles,
      warning: result.warning,
      notes: result.notes,
    },
  }

  process.stdout.write(JSON.stringify(output) + '\n')
}

main().catch((err) => {
  process.stderr.write(JSON.stringify({ step: 'error', message: err.message }) + '\n')
  process.stdout.write(JSON.stringify({ success: false, error: err.message }) + '\n')
  process.exit(1)
})
