# Req-Gath-Sys — AI-Native Requirements Gathering

## The Problem

Teams spend weeks writing project charters and PRDs. The format fights you — blank templates, scattered feedback, no connection to the actual codebase. Requirements become static documents that live in a drive somewhere, disconnected from the code they describe.

## What It Is

Req-Gath-Sys is a VS Code extension that turns requirements gathering from a document-writing exercise into a code-aware AI-assisted workflow.

```
[write requirements] ←→ [AI fills forms from context] ←→ [linked to codebase]
```

## Current State (MVP)

A working VS Code extension with:

- **8-section project charter + PRD forms** with auto-save, gate reviews, signatures
- **Codebase indexer** — builds a knowledge graph (madar) + TypeScript type/component map
- **AI assistant** — embedded chat panel that loads form data and calls VS Code's built-in LM API (Copilot/Claude) to help fill fields
- **PDF export** — one-click charter/PRD export
- **Retro Mac OS 9 UI** — distinctive, memorable, fast

The chat agent connects to the LM, loads current form data into context, and responds conversationally. Form-filling via structured JSON output is the remaining piece.

## Why VS Code

- Ships to every developer with zero install friction
- Built-in LM API (Copilot) — no API keys, no external services
- Webview UI means React components, not DOM hacking
- Extensions can read the actual codebase — requirements stay linked to code

## The Vision

```
Phase 1 (now)     → AI-assisted forms inside VS Code
Phase 2 (next)    → Structured JSON form-filling + custom doc editor (BlockNote)
Phase 3 (future)  → MCP tools, agent-driven templates, code→requirement traceability
```

Not another docs tool. Requirements that live where the code lives.

## Why Now

Every team with a half-decent SDLC writes charters and PRDs. They paste them into Notion/Confluence/Google Docs and they rot. The gap isn't another editor — it's an editor that knows your code and fills the boilerplate so you focus on the decisions that matter.
