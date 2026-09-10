import type { MarketplaceTemplate } from '../types'
import { bullet, code, guide, h, numbered, p, table } from '../blocks'

export const README_TEMPLATE: MarketplaceTemplate = {
  id: 'mp-readme',
  name: 'README',
  category: 'Docs',
  standard: 'standard-readme',
  tagline: 'standard-readme–aligned project README — looks finished empty.',
  description:
    'The README is often the first thing anyone reads before deciding whether to use or contribute to a project. standard-readme is an open source specification that fixes the order and required sections of a README, including description, install, usage, API, contributing, and license, so readers know where to find what they need in any repo. A consistent structure means people find the install command quickly instead of scrolling through unstructured text.',
  curated: true,
  icon: 'menu_book',
  suggestedDocName: 'README',
  keywords: ['readme', 'standard-readme', 'github', 'docs'],
  build: () => [
    h(1, 'your-package'),
    p('One-line description of what this project does and who it is for.'),
    p(
      '![Build](https://img.shields.io/badge/build-passing-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Version](https://img.shields.io/badge/version-0.1.0-informational)',
    ),
    h(2, 'Table of contents'),
    bullet('Background'),
    bullet('Install'),
    bullet('Usage'),
    bullet('Configuration'),
    bullet('API'),
    bullet('Contributing'),
    bullet('License'),
    h(2, 'Background'),
    guide('Why this exists — problem space, intended audience, and what “done” looks like for a reader.'),
    p(
      'Teams were copying the same setup steps across repos. This package packages the happy path so a new contributor can go from clone to first successful run in under ten minutes.',
    ),
    h(2, 'Install'),
    guide('List prerequisites, then show the exact install command in a fenced code block.'),
    p('Requires Node.js 20+ and npm 10+.'),
    code('bash', 'npm install your-package'),
    p('Verify the install:'),
    code('bash', 'npx your-package --version'),
    h(2, 'Usage'),
    guide('Smallest useful example — copy-pasteable, with expected output if helpful.'),
    code(
      'ts',
      `import { run } from 'your-package'\n\nawait run({\n  projectRoot: process.cwd(),\n  dryRun: true,\n})\n`,
    ),
    h(2, 'Configuration'),
    guide('Env vars / flags — purpose and default. Prefer a table once you have more than two.'),
    table(
      ['Name', 'Purpose', 'Default'],
      [
        ['YOUR_PACKAGE_TOKEN', 'API token for remote calls', '(required)'],
        ['YOUR_PACKAGE_LOG', 'Log level: error | warn | info | debug', 'info'],
      ],
    ),
    h(2, 'API'),
    guide('Optional overview of the public surface, or link out to full API docs.'),
    table(
      ['Export', 'Kind', 'Notes'],
      [
        ['run(options)', 'function', 'Primary entry — see Usage'],
        ['PackageOptions', 'type', 'Shared options bag'],
      ],
    ),
    h(2, 'Contributing'),
    guide('How to report issues, propose changes, and run local checks.'),
    numbered('Fork and create a feature branch'),
    numbered('npm test && npm run lint'),
    numbered('Open a PR with a short “why” in the description'),
    h(2, 'License'),
    p('MIT © Your Org — see LICENSE for the full text.'),
  ],
}
