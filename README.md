# Req-Gath-Sys

A VS Code extension that guides teams through a 6-phase project requirements pipeline
(Charter → PRD → System Design → Dev → QA → Post Dev) with gate-based phase unlocking and
an AI assistant that fills the requirement forms for you.

## Architecture

Two layers, one runtime (Node — the VS Code extension host). There is no separate backend
process to install or bundle.

1. **Webview (React + Vite)** — `src/`: forms, pages, chat panel.
2. **TS extension host** — `extension/`: form persistence, AI prompts, LLM calls, code indexer, PDF export.

The webview communicates with the extension host over `postMessage`; the extension host calls
plain TypeScript functions directly. See [`ARCHITECTURE.md`](ARCHITECTURE.md) for diagrams and detail.

All AI work uses an OpenAI-compatible provider (DeepSeek by default; Kimi or a local Ollama-style
endpoint optional) via the `openai` npm SDK.

## Getting started

```bash
npm install
npm run build
```

Then open this folder in VS Code, press `F5` to launch the Extension Development Host, and run
**"Req-Gath-Sys: Open Pipeline"** from the command palette.

## Configuring the AI key

Provide an OpenAI-compatible API key either way:

- **SecretStorage (recommended):** run **"Req-Gath-Sys: Configure API Key"** from the command palette.
- **Environment variable:** `export DEEPSEEK_API_KEY="sk-..."` (or `MOONSHOT_API_KEY` for Kimi)
  before launching VS Code.

Select the active provider/model in `.req-gath-sys/config.json`:

```json
{ "llm": { "provider": "deepseek", "model": null } }
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run build` | Build extension bundle + webview |
| `npm run build:extension` | esbuild → `out/extension.cjs` |
| `npm run build:webview` | vite → `dist/` |
| `npm run dev` | Vite dev server (webview only) |
| `npm run lint` | ESLint over the project |

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the layer playbook and conventions.
