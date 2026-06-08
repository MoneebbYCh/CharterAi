# Graph Report - .  (2026-06-01)

## Corpus Check
- Corpus is ~25,410 words - fits in a single context window. You may not need a graph.

## Summary
- 91 nodes · 41 edges · 62 communities (6 shown, 56 thin omitted)
- Extraction: 56% EXTRACTED · 44% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Build & Lint Tooling|Build & Lint Tooling]]
- [[_COMMUNITY_Social Media Icons|Social Media Icons]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_HTML Entry & Assets|HTML Entry & Assets]]
- [[_COMMUNITY_Favicon Branding|Favicon Branding]]
- [[_COMMUNITY_React Brand Asset|React Brand Asset]]
- [[_COMMUNITY_Vite Brand Asset|Vite Brand Asset]]
- [[_COMMUNITY_AutoResizeTextarea|AutoResizeTextarea]]
- [[_COMMUNITY_FieldHint Component|FieldHint Component]]
- [[_COMMUNITY_PreSystemView|PreSystemView]]
- [[_COMMUNITY_Validation Hook|Validation Hook]]
- [[_COMMUNITY_Validation Check|Validation Check]]
- [[_COMMUNITY_Required Check|Required Check]]
- [[_COMMUNITY_Field Styling|Field Styling]]
- [[_COMMUNITY_Form Data Init|Form Data Init]]
- [[_COMMUNITY_Option Types|Option Types]]
- [[_COMMUNITY_Default Options|Default Options]]
- [[_COMMUNITY_Choice Options|Choice Options]]
- [[_COMMUNITY_Phase Model|Phase Model]]
- [[_COMMUNITY_Phase Lookup|Phase Lookup]]
- [[_COMMUNITY_Custom Options|Custom Options]]
- [[_COMMUNITY_Form State Hook|Form State Hook]]
- [[_COMMUNITY_Form Reducer|Form Reducer]]
- [[_COMMUNITY_Form Validation|Form Validation]]
- [[_COMMUNITY_Form Submit|Form Submit]]
- [[_COMMUNITY_PDF Export|PDF Export]]
- [[_COMMUNITY_Validation Logic|Validation Logic]]
- [[_COMMUNITY_Layout Components|Layout Components]]
- [[_COMMUNITY_EditableSelect|EditableSelect]]
- [[_COMMUNITY_EditableChoiceGroup|EditableChoiceGroup]]
- [[_COMMUNITY_Section Form Fields|Section Form Fields]]
- [[_COMMUNITY_Home Page|Home Page]]
- [[_COMMUNITY_Phase Placeholder|Phase Placeholder]]
- [[_COMMUNITY_Pre-System Design|Pre-System Design]]
- [[_COMMUNITY_Pipeline Chrome|Pipeline Chrome]]
- [[_COMMUNITY_Phase Overview|Phase Overview]]
- [[_COMMUNITY_Phase Sidebar|Phase Sidebar]]
- [[_COMMUNITY_Section 1-3|Section 1-3]]
- [[_COMMUNITY_Section 4-8|Section 4-8]]
- [[_COMMUNITY_Sidebar Component|Sidebar Component]]
- [[_COMMUNITY_App Component|App Component]]
- [[_COMMUNITY_Phase Data|Phase Data]]
- [[_COMMUNITY_Section 1 Data|Section 1 Data]]
- [[_COMMUNITY_Section 2 Data|Section 2 Data]]
- [[_COMMUNITY_Section 3 Data|Section 3 Data]]
- [[_COMMUNITY_Section 4 Data|Section 4 Data]]
- [[_COMMUNITY_Section 5 Data|Section 5 Data]]
- [[_COMMUNITY_Section 6 Data|Section 6 Data]]
- [[_COMMUNITY_Section 7 Data|Section 7 Data]]
- [[_COMMUNITY_Section 8 Data|Section 8 Data]]
- [[_COMMUNITY_Option Defaults|Option Defaults]]
- [[_COMMUNITY_Form Defaults|Form Defaults]]
- [[_COMMUNITY_Form Types|Form Types]]
- [[_COMMUNITY_Package Config|Package Config]]
- [[_COMMUNITY_App TypeScript|App TypeScript]]
- [[_COMMUNITY_Node Config|Node Config]]
- [[_COMMUNITY_Vite Config|Vite Config]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Vite Config Module|Vite Config Module]]
- [[_COMMUNITY_Home Dashboard|Home Dashboard]]
- [[_COMMUNITY_Hero Image|Hero Image]]
- [[_COMMUNITY_Dev Server Hosting|Dev Server Hosting]]

## God Nodes (most connected - your core abstractions)
1. `React` - 6 edges
2. `index.html (Entry Point)` - 6 edges
3. `Icons SVG Sprite Sheet` - 6 edges
4. `Social Icon` - 6 edges
5. `Vite` - 5 edges
6. `TypeScript` - 4 edges
7. `/src/main.tsx` - 4 edges
8. `@vitejs/plugin-react` - 3 edges
9. `@vitejs/plugin-react-swc` - 3 edges
10. `TypeScript ESLint (tseslint)` - 2 edges

## Surprising Connections (you probably didn't know these)
- `/src/main.tsx` --conceptually_related_to--> `React`  [INFERRED]
  index.html → README.md
- `/src/main.tsx` --conceptually_related_to--> `TypeScript`  [INFERRED]
  index.html → README.md
- `/src/main.tsx` --conceptually_related_to--> `Vite`  [INFERRED]
  index.html → README.md

## Import Cycles
- None detected.

## Communities (62 total, 56 thin omitted)

### Community 0 - "Build & Lint Tooling"
Cohesion: 0.25
Nodes (8): eslint-plugin-react-dom, eslint-plugin-react-x, Oxc, React, React Compiler, SWC, @vitejs/plugin-react, @vitejs/plugin-react-swc

### Community 1 - "Social Media Icons"
Cohesion: 0.52
Nodes (7): Bluesky Icon, Discord Icon, Documentation Icon, GitHub Icon, Icons SVG Sprite Sheet, Social Icon, X (Twitter) Icon

### Community 2 - "TypeScript Configuration"
Cohesion: 0.38
Nodes (7): /src/main.tsx, ESLint, tsconfig.app.json, tsconfig.node.json, TypeScript ESLint (tseslint), TypeScript, Vite

### Community 3 - "HTML Entry & Assets"
Cohesion: 0.33
Nodes (6): AI Project Pipeline, /favicon.svg, index.html (Entry Point), JetBrains Mono Font, Material Symbols Icons, Public Sans Font

### Community 4 - "Favicon Branding"
Cohesion: 1.00
Nodes (3): Favicon SVG Image, Purple Indigo Stylized Icon, Req-Gath-Sys Project

### Community 5 - "React Brand Asset"
Cohesion: 0.67
Nodes (3): Brand Icon Asset, React Framework, React Logo

## Knowledge Gaps
- **70 isolated node(s):** `AutoResizeTextarea`, `FieldHint`, `PreSystemView`, `useShowValidation`, `isEmpty` (+65 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **56 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `/src/main.tsx` connect `TypeScript Configuration` to `Build & Lint Tooling`, `HTML Entry & Assets`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `index.html (Entry Point)` connect `HTML Entry & Assets` to `TypeScript Configuration`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `React` connect `Build & Lint Tooling` to `TypeScript Configuration`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `React` (e.g. with `/src/main.tsx` and `eslint-plugin-react-dom`) actually correct?**
  _`React` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `Vite` (e.g. with `/src/main.tsx` and `tsconfig.app.json`) actually correct?**
  _`Vite` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AutoResizeTextarea`, `FieldHint`, `PreSystemView` to the rest of the system?**
  _70 weakly-connected nodes found - possible documentation gaps or missing edges._