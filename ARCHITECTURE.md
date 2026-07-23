# Req-Gath-Sys Architecture

Req-Gath-Sys is a VS Code extension that guides teams through a 6-phase requirements pipeline
(Charter → PRD → System Design → Dev → QA → Post Dev). It is built in two layers:

1. **Webview (React + Vite)** — the UI: forms, pages, chat panel.
2. **TS extension host** — everything non-UI: form persistence, AI prompts, LLM calls, code indexer, PDF export.

The webview talks to the extension host via `postMessage`. The extension host runs entirely on Node
(the extension host's own runtime) — there is no separate backend process to spawn or bundle.
All AI work uses an OpenAI-compatible provider (DeepSeek by default, Kimi/local optional) — not Copilot.

```mermaid
---
title: Req-Gath-Sys System Architecture
---
graph TB
  subgraph WEBVIEW["Webview (React + Vite)"]
    APP["src/App.tsx<br/>CRTMonitor + routing"]
    VIEW["src/hooks/useViewState.ts<br/>page/section navigation"]

    subgraph PAGES["Pages"]
      HOME["HomePage<br/>knowledge graph + phase list"]
      CHARTER["ProjectCharterPage<br/>8-section charter form"]
      PRD["PrdCreationPage<br/>8-section PRD form"]
      PLACEHOLDER["PhasePlaceholderPage"]
    end

    subgraph FORMS["Form Hooks"]
      UF["useFormState.ts<br/>charter CRUD + auto-save"]
      UP["usePrdFormState.ts<br/>PRD CRUD + auto-save"]
      UC["useCodeIndex.ts<br/>index build + progress"]
    end

    subgraph CHATUI["Chat"]
      UCHAT["useChat.ts<br/>IPC chatMessage/chatResponse"]
      PANEL["ChatPanel.tsx<br/>sliding panel"]
      TOGGLE["ChatToggleButton.tsx<br/>floating toggle"]
    end

    VAPI["src/utils/vscodeApi.ts<br/>acquireVsCodeApi() wrapper"]
  end

  subgraph VSCODE["VS Code Extension Host (TS)"]
    EXT["extension/extension.ts<br/>activate() + WebviewPanel + message router"]
    PROTO["extension/protocol.ts<br/>IPC message types"]
    FSTATE["extension/formStateManager.ts<br/>.req-gath-sys/*.json CRUD"]
    CI["extension/codeIndexer.ts<br/>madar fork + TS Compiler AST"]
    PDF["extension/pdfExportHandler.ts<br/>VS Code save dialog"]
    AKM["extension/apiKeyManager.ts<br/>SecretStorage (optional)"]

    subgraph AI["extension/ai/"]
      AGENT["agent.ts<br/>prompt + parse + deepMerge + processChat"]
      LLM["llmClient.ts<br/>provider registry + openai SDK"]
      GUIDES["fieldGuides.ts<br/>AI field schemas"]
      CTX["codeContext.ts<br/>summarize code-index.json"]
    end
  end

  subgraph DISK["Workspace Disk"]
    STATE[".req-gath-sys/<br/>charter.json / prd.json /<br/>custom-options.json / config.json"]
    GRAPH["out/graph.json<br/>(madar)"]
  end

  APP --> VIEW
  APP --> HOME
  APP --> CHARTER
  APP --> PRD
  APP --> PLACEHOLDER
  APP --> UCHAT
  APP --> PANEL
  APP --> TOGGLE
  CHARTER --> UF
  PRD --> UP
  HOME --> UC
  UF --> VAPI
  UP --> VAPI
  UCHAT --> VAPI
  UC --> VAPI

  VAPI -->|"postMessage"| EXT
  EXT --> PROTO
  EXT --> FSTATE
  EXT --> CI
  EXT --> PDF
  EXT --> AKM
  EXT --> AGENT
  AGENT --> GUIDES
  AGENT --> CTX
  AGENT --> LLM
  AGENT --> FSTATE
  FSTATE --> STATE
  CI --> GRAPH
  LLM -->|"HTTPS"| PROVIDER["DeepSeek / Kimi / local"]
```

## Data Flow (AI chat + form fill)

```mermaid
sequenceDiagram
  participant U as User
  participant W as Webview
  participant E as Extension (extension.ts)
  participant A as ai/agent.ts
  participant LM as LLM (OpenAI-compatible)
  participant FS as .req-gath-sys/

  U->>W: type message in ChatPanel
  W->>W: useChat.sendMessage()
  W->>E: postMessage({ type:'chatMessage', text, phase })
  E->>E: getApiKey() (SecretStorage, may be empty)
  E->>A: processChat({ text, phase, workspaceRoot, apiKey })
  A->>A: buildMessages() (field guide + current form JSON)
  A->>LM: chat.completions.create(json_object)
  LM-->>A: { message, updates }
  A->>A: parseResponse() + deepMerge()
  alt has form updates
    A->>FS: save charter/prd/form JSON
    A-->>E: { message, form_updated:true, reload }
    E->>W: postMessage({ type:'loadCharter'|'loadPrd'|'loadForm' })
  else no updates
    A-->>E: { message, form_updated:false, reload:null }
  end
  E->>W: postMessage({ type:'chatResponse', text })
  W->>W: append assistant message
  W-->>U: render reply
```

## Form CRUD Flow

```mermaid
sequenceDiagram
  participant W as Webview (useFormState)
  participant E as Extension (extension.ts)
  participant FSM as formStateManager.ts
  participant FS as .req-gath-sys/

  Note over W: edit → debounced 500ms
  W->>E: postMessage({ type:'saveCharter', data })
  E->>FSM: saveCharter(workspaceRoot, data)
  FSM->>FS: write charter.json
  Note over W: on mount
  W->>E: postMessage({ type:'loadCharter' })
  E->>FSM: loadCharter(workspaceRoot)
  FSM->>FS: read charter.json
  FSM-->>E: data
  E->>W: postMessage({ type:'loadCharter', data })
```

## Extension message actions

Routed in `extension/extension.ts` (`handleMessage`):

| Message type | Purpose |
|--------------|---------|
| `initializeWorkspace` (command) | Create `.req-gath-sys/` + default `config.json` |
| `loadCharter` / `saveCharter` | Charter JSON CRUD |
| `loadPrd` / `savePrd` | PRD JSON CRUD (load also returns charter for context) |
| `loadForm` / `saveForm` | Generic per-phase JSON CRUD (e.g. system-design) |
| `loadCustomOptions` / `saveCustomOptions` | Editable dropdown options |
| `exportPdf` / `exportPdfAs` | Write PDF (webview renders the buffer with jsPDF) |
| `indexCodebase` / `loadCodeIndex` | Build / load the madar + AST code index |
| `chatMessage` | Full AI flow: build prompt → LLM → parse → merge → save |

IPC message types are camelCase (`loadCharter`). The extension host calls plain TS functions directly —
there is no cross-process protocol or serialization layer.

## LLM providers

Configured in `extension/ai/llmClient.ts` (`PROVIDERS` registry). All are OpenAI-compatible, so switching
is a one-line change per provider.

| Provider | base_url | Default model | API key env |
|----------|----------|---------------|-------------|
| `deepseek` (default) | `https://api.deepseek.com` | `deepseek-v4-flash` | `DEEPSEEK_API_KEY` |
| `kimi` | `https://api.moonshot.ai/v1` | `kimi-k2.6` | `MOONSHOT_API_KEY` |
| `local` | `http://localhost:11434/v1` | `llama3.2` | (none) |

- Active provider/model: `.req-gath-sys/config.json` → `{ "llm": { "provider": "deepseek", "model": null } }`.
- API key resolution order: SecretStorage (passed by the extension) → provider env var → generic `REQ_GATH_SYS_API_KEY` / `LLM_API_KEY`.

## Build Pipeline

```mermaid
graph LR
  SRC_EXT["extension/**/*.ts"] --> ESBUILD["esbuild --bundle --external:vscode"] --> EXT_OUT["out/extension.cjs"]
  SRC_WEB["src/**/*.{ts,tsx,css}"] --> VITE["vite build"] --> WEB_OUT["dist/index.html + assets"]
  EXT_OUT --> RUN["VS Code Extension Host"]
  WEB_OUT --> RUN
```

| Command | What it does |
|---------|--------------|
| `npm run build` | Build extension bundle + webview |
| `npm run build:extension` | esbuild → `out/extension.cjs` (bundles `openai`) |
| `npm run build:webview` | vite → `dist/` |
| `npm run dev` | Vite dev server (webview only) |

## Layer ownership

| Concern | Layer | Notes |
|---------|-------|-------|
| Forms, pages, chat UI, validation display | Webview (`src/`) | React |
| IPC routing, VS Code APIs | Extension (`extension/`) | `extension.ts` stays a thin router |
| Form persistence, AI prompts, LLM calls, code index, PDF | Extension (`extension/`, `extension/ai/`) | Main logic |
| Build artifacts | `out/`, `dist/` | Never edit; rebuild |

## Status

| Component | Status |
|-----------|--------|
| Extension form CRUD (TS `formStateManager`) | Done |
| Webview routing + Charter/PRD forms | Done |
| Chat UI (panel + toggle) | Done |
| Chat flow (Webview → Extension → `ai/agent.ts`) | Done |
| AI orchestration (`extension/ai/`) | Done — OpenAI-compatible (DeepSeek/Kimi/local) |
| AI form-filling (JSON mode + dot-path merge) | Done |
| Code indexer (madar + AST) | Done |
| PDF export | Done |
| Code-index context in chat | Partial — reads `code-index.json` when present |
| System Design phase (Phase 3) | Scaffolded (form + AI + chat) |
| Dev/QA/Post-Dev phases | Placeholder |
| Custom doc mode (BlockNote) | Future |
| MCP tools | Future |
