# Req-Gath-Sys Architecture

```mermaid
---
title: Req-Gath-Sys System Architecture
---
graph TB
  subgraph VSCODE["VS Code Extension Host"]
    EXT["extension/extension.ts<br/>activate() → commands + WebviewPanel + IPC"]
    FSM["extension/formStateManager.ts<br/>load/save .req-gath-sys/{charter,prd,custom-options}.json"]
    CHAT["extension/chatAgent.ts<br/>processChatMessage() → vscode.lm API"]
    CI["extension/codeIndexer.ts<br/>madar fork + TS Compiler AST"]
    PDF["extension/pdfExportHandler.ts"]
    PROTO["extension/protocol.ts<br/>ExtensionToWebviewMessage | WebviewToExtensionMessage"]

    EXT --> FSM
    EXT --> CHAT
    EXT --> CI
    EXT --> PDF
    EXT --> PROTO
    CHAT --> FSM
  end

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

    UI["src/components/layout/CRTMonitor.tsx"]
    TYPES["src/types/{form,prdForm}.ts"]
    DATA["src/data/{phases,formDefaults}.ts"]
    VAPI["src/utils/vscodeApi.ts<br/>acquireVsCodeApi() wrapper"]
    PDFEX["src/utils/pdfExport.ts"]
  end

  APP --> VIEW
  APP --> HOME
  APP --> CHARTER
  APP --> PRD
  APP --> PLACEHOLDER
  APP --> UI
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

  UF --> TYPES
  UP --> TYPES
  HOME --> TYPES

  UF --> DATA
  UP --> DATA

  subgraph BUILD["Build"]
    ESBUILD["esbuild → out/extension.cjs"]
    VITE["vite build → dist/"]
    DEV["npm run dev<br/>vite dev server"]
  end

  ESBUILD -.-> VSCODE
  VITE -.-> WEBVIEW
  DEV -.-> WEBVIEW
```

## Data Flow

```mermaid
sequenceDiagram
  participant U as User
  participant W as Webview
  participant E as Extension
  participant FS as File System
  participant LM as VS Code LM API

  U->>W: type message
  W->>W: useChat.sendMessage()
  W->>E: postMessage({ type:'chatMessage', text, phase })
  E->>E: load form data (charter/prd)
  E->>LM: model.sendRequest(prompt + formData)
  LM-->>E: response.text stream
  E->>E: parseResponse → { message, updates }
  alt has form updates
    E->>FS: save updated form data
    FS-->>E: ok
    E->>W: postMessage({ type:'loadCharter/loadPrd' })
  end
  E->>W: postMessage({ type:'chatResponse', text })
  W->>W: append assistant message
  W-->>U: render reply
```

## Build Pipeline

```mermaid
graph LR
  SRC_EXT["extension/*.ts"] --> ESBUILD["esbuild --bundle --external:vscode"] --> EXT_OUT["out/extension.cjs"]
  SRC_WEB["src/**/*.{ts,tsx,css}"] --> VITE["vite build"] --> WEB_OUT["dist/index.html + assets"]
  EXT_OUT --> RUN["VS Code Extension Host"]
  WEB_OUT --> RUN
```

## Status

| Component | Status |
|-----------|--------|
| Extension IPC + form CRUD | ✅ |
| Webview routing + forms | ✅ |
| Chat UI (panel + toggle) | ✅ |
| Chat IPC (W→E → E→W) | ✅ |
| AI agent (chatAgent.ts) | ✅ calls VS Code LM API |
| Code indexer (madar + AST) | ✅ |
| PDF export | ✅ |
| **Form-filling via AI** | ❌ agent returns text, JSON parsing unreliable |
| Custom doc mode (BlockNote) | ❌ future |
| MCP tools | ❌ future |
