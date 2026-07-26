# Contributing to Charter Ai

Charter Ai is a VS Code extension with two layers. Before contributing, read
[`ARCHITECTURE.md`](ARCHITECTURE.md) for the full picture. This guide covers setup,
build commands, and where each kind of change belongs.

## Layers at a glance

| Layer | Location | You touch this when… |
|-------|----------|----------------------|
| **Webview UI** (React + Vite) | [`src/`](src/) | Forms, pages, chat panel, validation display |
| **TS extension host** | [`extension/`](extension/) | IPC routing, VS Code APIs, form persistence, AI, code indexer, PDF |
| **Build output** | `out/`, `dist/` | Never edit — always rebuild |

**Golden rule:** Keep [`extension/extension.ts`](extension/extension.ts) a thin router.
Business logic lives in dedicated modules ([`extension/ai/`](extension/), `formStateManager.ts`,
`codeIndexer.ts`). UI lives in `src/`.

## Prerequisites

- Node.js 18+ and npm
- VS Code

No Python is required — the extension host runs everything on Node.

## One-time setup

```bash
npm install
```

## Configuring the AI (LLM key)

The chat/AI features call an OpenAI-compatible provider (DeepSeek by default).
Provide an API key one of two ways:

**Option A — environment variable (simplest for dev):**

```bash
export DEEPSEEK_API_KEY="sk-..."   # or MOONSHOT_API_KEY for Kimi
code .                              # launch VS Code from the same terminal
```

The extension host inherits environment variables from the process that launched
VS Code, so export the key before launching.

**Option B — VS Code SecretStorage (better UX):**

Run the command palette action **"Charter Ai: Configure API Key"**.

Keys resolve in this order: SecretStorage (passed by the extension) →
provider env var → generic `REQ_GATH_SYS_API_KEY` / `LLM_API_KEY`.

Active provider/model lives in `.charter-ai/config.json`:

```json
{ "llm": { "provider": "deepseek", "model": null } }
```

## Build & run

| Command | What it does |
|---------|--------------|
| `npm run build` | Build extension bundle + webview (production) |
| `npm run build:extension` | esbuild → `out/extension.cjs` |
| `npm run build:webview` | vite → `dist/` |
| `npm run dev` | Vite dev server (webview only; extension still needs a rebuild) |
| `npm run lint` | ESLint over the project |

To run the extension: open this folder in VS Code and press `F5` (Extension
Development Host), then run **"Charter Ai: Open Pipeline"** from the command palette.

## Where changes go (playbook)

### Add a field to an existing phase

1. **Type** — `src/types/*Form.ts`
2. **Default** — `src/data/*Defaults.ts`
3. **UI** — the section component in `src/components/*-sections/`
4. **AI schema** — matching entry in [`extension/ai/fieldGuides.ts`](extension/ai/fieldGuides.ts)
5. Optional: validation in `src/utils/*Validation.ts`

The `save*` / `chatMessage` handlers persist arbitrary JSON shapes — no extension
change is needed for a new field.

### Add a new pipeline phase

Follow the **System Design** phase as the reference implementation:

**Webview:** `src/data/phases.ts` (`active: true`) → `src/types/…Form.ts` →
`src/data/…Defaults.ts` → `src/hooks/use…FormState.ts` (use the generic
`loadForm`/`saveForm` IPC messages) → `src/pages/…Page.tsx` + section components +
sidebar + overview → add to `src/App.tsx` and the `View` type in
`src/hooks/useViewState.ts` → `src/utils/…Validation.ts`.

**Extension:** register the phase file in `PHASE_FILES` in
[`extension/formStateManager.ts`](extension/formStateManager.ts), add its guide in
[`extension/ai/fieldGuides.ts`](extension/ai/fieldGuides.ts), and add it to
`FORM_PHASES` in [`extension/ai/agent.ts`](extension/ai/agent.ts).

The generic `loadForm` / `saveForm` messages already handle any phase in
`PHASE_FILES`, so no new handlers are required.

### Add a new message action

1. Add the message type to [`extension/protocol.ts`](extension/protocol.ts)
2. Route it in `handleMessage` in [`extension/extension.ts`](extension/extension.ts),
   calling a function in the appropriate module
3. Consume it in a webview hook (`vscode.postMessage` + `window.addEventListener('message')`)

Never put business logic in `extension.ts` — only route.

### Add a new LLM provider

Only edit the `PROVIDERS` registry in [`extension/ai/llmClient.ts`](extension/ai/llmClient.ts).
No webview changes needed; users select it in `.charter-ai/config.json`.

## Conventions

- **Phase id** is the same string everywhere: `phases.ts` id = `useChat(phase)` =
  `fieldGuides.ts` key = `PHASE_FILES` key = `phase` argument.
- **IPC naming:** camelCase message types (`loadForm`).
- **Dot-path updates** for AI form fill: `"section1.projectName"` (see `deepMerge` in
  `extension/ai/agent.ts`).
- **Workspace root** is always resolved by the extension and passed to the
  persistence/AI functions.
- **Dual persistence:** the webview writes to `localStorage` (cache) and the extension writes
  `.charter-ai/*.json` (source of truth on disk).
- **Don't edit** `out/extension.cjs` or `dist/` — always rebuild.

## Before you open a PR

```bash
npm run lint
npm run build
```
