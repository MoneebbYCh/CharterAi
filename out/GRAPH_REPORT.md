# Graph Report - c:\\Projects\\Req-Gath-Sys  (2026-06-08)

## Corpus Check
- Corpus is ~30,684 words - fits in a single context window. You may not need a graph.

## Summary
- 370 nodes · 912 edges · 63 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Structure Signals
- Entity graph basis: 314 non-file, non-concept node(s)
- Weakly connected components: 93
- Singleton components: 79
- Isolated nodes: 79
- Largest component: 134 node(s) (43% of the entity graph basis)
- Low-cohesion communities: 0
- Largest low-cohesion community: none on the entity graph basis

## Workspace Bridges
1. `App\(\)` - connects `Components Chat Panel — Chat`, `Components Chat Toggle Button`, `Components Crt Monitor`, `Components Form Fields`, `Hooks Use Chat`, `Hooks Use View State`, `Pages Home Page`, `Pages Phase Placeholder Page`, `Pages Prd Creation Page`; home: `Src App`; degree 10; score 718.54
  source files: `c:/Projects/Req-Gath-Sys/src/App.tsx`, `c:/Projects/Req-Gath-Sys/src/components/chat/ChatPanel.tsx`, `c:/Projects/Req-Gath-Sys/src/components/chat/ChatToggleButton.tsx`, `c:/Projects/Req-Gath-Sys/src/components/layout/CRTMonitor.tsx`, `c:/Projects/Req-Gath-Sys/src/hooks/useChat.ts`, `c:/Projects/Req-Gath-Sys/src/hooks/useViewState.ts`, `c:/Projects/Req-Gath-Sys/src/pages/HomePage.tsx`, `c:/Projects/Req-Gath-Sys/src/pages/PhasePlaceholderPage.tsx`, `c:/Projects/Req-Gath-Sys/src/pages/PrdCreationPage.tsx`, `c:/Projects/Req-Gath-Sys/src/pages/ProjectCharterPage.tsx`
2. `PrdCreationPage\(\)` - connects `Components Form Fields`, `Components Pipeline Chrome`, `Components Pipeline Chrome — Footer`, `Components Prd Section1 4`, `Components Prd Sidebar`, `Hooks Use Prd Form State`, `Src App`, `Utils Prd Validation — Prd`; home: `Pages Prd Creation Page`; degree 19; score 2379.74
  source files: `c:/Projects/Req-Gath-Sys/src/App.tsx`, `c:/Projects/Req-Gath-Sys/src/components/layout/PipelineChrome.tsx`, `c:/Projects/Req-Gath-Sys/src/components/prd-sections/PrdOverview.tsx`, `c:/Projects/Req-Gath-Sys/src/components/prd-sections/PrdSection1-4.tsx`, `c:/Projects/Req-Gath-Sys/src/components/prd-sections/PrdSection5-8.tsx`, `c:/Projects/Req-Gath-Sys/src/components/prd-sections/PrdSidebar.tsx`, `c:/Projects/Req-Gath-Sys/src/hooks/usePrdFormState.ts`, `c:/Projects/Req-Gath-Sys/src/pages/PrdCreationPage.tsx`
3. `CodeIndexer` - connects `Extension Code Indexer — Build`, `Extension Code Indexer — Cache`, `Extension Code Indexer — Classify`, `Extension Code Indexer — Collect`, `Extension Code Indexer — Create`, `Extension Code Indexer — Finish`, `Extension Code Indexer — Index`; home: `Extension Code Indexer — Components`; degree 20; score 7459.67
  source files: `c:/Projects/Req-Gath-Sys/extension/codeIndexer.ts`
4. `ProjectCharterPage\(\)` - connects `Components Pipeline Chrome`, `Components Pipeline Chrome — Footer`, `Components Use Form State`, `Pages Home Page`, `Pages PDF Export`, `Src App`; home: `Components Form Fields`; degree 24; score 2106.93
  source files: `c:/Projects/Req-Gath-Sys/src/App.tsx`, `c:/Projects/Req-Gath-Sys/src/components/layout/PipelineChrome.tsx`, `c:/Projects/Req-Gath-Sys/src/components/project-charter/PhaseOverview.tsx`, `c:/Projects/Req-Gath-Sys/src/components/project-charter/PhaseSidebar.tsx`, `c:/Projects/Req-Gath-Sys/src/components/sections/Section1-3.tsx`, `c:/Projects/Req-Gath-Sys/src/components/sections/Section4-8.tsx`, `c:/Projects/Req-Gath-Sys/src/hooks/useFormState.ts`, `c:/Projects/Req-Gath-Sys/src/pages/ProjectCharterPage.tsx`, `c:/Projects/Req-Gath-Sys/src/utils/validation.ts`
5. `.buildIndex\(\)` - connects `Extension Code Indexer — Cache`, `Extension Code Indexer — Classify`, `Extension Code Indexer — Collect`, `Extension Code Indexer — Components`, `Extension Code Indexer — Create`, `Extension Code Indexer — Finish`; home: `Extension Code Indexer — Build`; degree 10; score 96.33
  source files: `c:/Projects/Req-Gath-Sys/extension/codeIndexer.ts`
6. `Req-Gath-Sys — Architecture` - connects `Architecture — Data`, `Architecture — Flow`, `Architecture — Index`; home: `Architecture`; degree 9; score 22944
  source files: `c:/Projects/Req-Gath-Sys/ARCHITECTURE.md`

## God Nodes
1. `CharterPdfBuilder` - 26 edges
2. `ProjectCharterPage\(\)` - 26 edges
3. `CodeIndexer` - 22 edges
4. `TextField\(\)` - 22 edges
5. `PrdCreationPage\(\)` - 21 edges
6. `SectionHeader\(\)` - 21 edges
7. `SubSection\(\)` - 21 edges
8. `useShowValidation\(\)` - 18 edges
9. `DynamicTable\(\)` - 17 edges
10. `FormData` - 17 edges

## Surprising Connections
- `/HomePage` --depends\_on--> `page /HomePage`  [EXTRACTED]
  c:/Projects/Req-Gath-Sys/src/pages/HomePage.tsx → c:\\Projects\\Req-Gath-Sys\\src\\pages\\HomePage.tsx  _connects across different repos/directories_
- `/PhasePlaceholderPage` --depends\_on--> `page /PhasePlaceholderPage`  [EXTRACTED]
  c:/Projects/Req-Gath-Sys/src/pages/PhasePlaceholderPage.tsx → c:\\Projects\\Req-Gath-Sys\\src\\pages\\PhasePlaceholderPage.tsx  _connects across different repos/directories_
- `/PrdCreationPage` --depends\_on--> `page /PrdCreationPage`  [EXTRACTED]
  c:/Projects/Req-Gath-Sys/src/pages/PrdCreationPage.tsx → c:\\Projects\\Req-Gath-Sys\\src\\pages\\PrdCreationPage.tsx  _connects across different repos/directories_
- `/ProjectCharterPage` --depends\_on--> `page /ProjectCharterPage`  [EXTRACTED]
  c:/Projects/Req-Gath-Sys/src/pages/ProjectCharterPage.tsx → c:\\Projects\\Req-Gath-Sys\\src\\pages\\ProjectCharterPage.tsx  _connects across different repos/directories_
- `App\(\)` --renders--> `HomePage\(\)`  [EXTRACTED]
  c:/Projects/Req-Gath-Sys/src/App.tsx → c:/Projects/Req-Gath-Sys/src/pages/HomePage.tsx  _bridges separate communities_

## Semantic Anomalies
- **[HIGH] Bridge node** - Req-Gath-Sys — Architecture bridges Architecture and Architecture — Flow, Architecture — Index, Architecture — Data.
  _High betweenness centrality \(22905.000\) across 4 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - CodeIndexer bridges Extension Code Indexer — Components and Extension Code Indexer, Extension Code Indexer — Build, Extension Code Indexer — Index, Extension Code Indexer — Cache, Extension Code Indexer — Finish, Extension Code Indexer — Collect, Extension Code Indexer — Classify, Extension Code Indexer — Create, Extension Form State Manager.
  _High betweenness centrality \(7369.667\) across 10 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - Data Model bridges Architecture — Data and Architecture.
  _High betweenness centrality \(22426.000\) across 2 communities makes this node a likely dependency chokepoint._
- **[HIGH] Cross-boundary edge** - App\(\) → ChatToggleButton\(\) crosses graph boundaries in an unexpected way.
  _bridges separate communities_
- **[HIGH] Cross-boundary edge** - App\(\) → CRTMonitor\(\) crosses graph boundaries in an unexpected way.
  _bridges separate communities_

## Communities

### Community 0 - "Components Form Fields"
Cohesion (entity basis within full-graph community): 0.07
Nodes (51): AutoResizeTextarea\(\), AutoResizeTextareaProps, EditableChoiceGroup\(\), EditableChoiceGroupProps, EditableSelect\(\), EditableSelectProps, CheckboxGroup\(\), CheckboxGroupProps (+43 more)

### Community 1 - "Utils PDF Export"
Cohesion (entity basis within full-graph community): 0.21
Nodes (30): CharterPdfBuilder, .addPage\(\), .afterTable\(\), .applyRunningHeadersFooters\(\), .beginSection\(\), .beginSubsection\(\), .build\(\), .buildSection1\(\) (+22 more)

### Community 2 - "Extension Form State Manager"
Cohesion (entity basis within full-graph community): 0.25
Nodes (15): handleMessage\(\), deactivate\(\), ensureDir\(\), exportDir\(\), loadCharter\(\), loadCustomOptions\(\), loadPrd\(\), readJson\(\) (+7 more)

### Community 3 - "Components Use Form State"
Cohesion (entity basis within full-graph community): 0.09
Nodes (11): FormData, createInitialFormData\(\), PhaseOverviewProps, PhaseSidebar\(\), PhaseSidebarProps, goNext\(\), SidebarProps, loadFromStorage\(\) (+3 more)

### Community 4 - "Types Prd Form"
Cohesion (entity basis within full-graph community): 0
Nodes (14): DataAccessRow, DataSourceRow, DecisionRow, DependencyRow, FeatureRow, GoalRow, IntegrationRow, MetricRow (+6 more)

### Community 5 - "Pages Home Page"
Cohesion (entity basis within full-graph community): 0.19
Nodes (13): HomePage\(\), HomePageProps, loadSavedProject\(\), StatBox\(\), PhaseOverview\(\), Sidebar\(\), useCodeIndex\(\), handler\(\) (+5 more)

### Community 6 - "Utils Prd Validation"
Cohesion (entity basis within full-graph community): 0.22
Nodes (10): getPrdIncompleteSections1to7\(\), hasCompleteTableRow\(\), isFilled\(\), validatePrdSection1\(\), validatePrdSection2\(\), validatePrdSection3\(\), validatePrdSection4\(\), validatePrdSection5\(\) (+2 more)

### Community 7 - "Utils Validation"
Cohesion (entity basis within full-graph community): 0.22
Nodes (10): hasCompleteTableRow\(\), isFilled\(\), SectionValidation, validateSection1\(\), validateSection2\(\), validateSection3\(\), validateSection4\(\), validateSection5\(\) (+2 more)

### Community 8 - "Hooks Use Custom Options"
Cohesion (entity basis within full-graph community): 0.14
Nodes (8): getDefaultChoiceOptions\(\), getDefaultStringOptions\(\), loadStore\(\), saveStoreToLocal\(\), useChoiceOptions\(\), handler\(\), useStringOptions\(\), handler\(\)

### Community 9 - "Extension Code Indexer"
Cohesion (entity basis within full-graph community): 0
Nodes (8): CommunityEntry, ComponentEntry, extractPropsInterface\(\), FileEntry, IndexProgress, IpcMessageEntry, TypeEntry, TypeProperty

### Community 10 - "Architecture"
Cohesion (entity basis within full-graph community): 0.29
Nodes (7): Component & State Architecture, Harness Diagram — System Architecture, Notable Architectural Decisions, Pipeline Phase Flow, Project File Map, Req-Gath-Sys — Architecture, Technology Stack

### Community 11 - "Hooks Use Prd Form State"
Cohesion (entity basis within full-graph community): 0.2
Nodes (6): PrdFormData, createInitialPrdFormData\(\), loadCharterData\(\), loadFromStorage\(\), usePrdFormState\(\), handler\(\)

### Community 12 - "Utils Prd Validation — Prd"
Cohesion (entity basis within full-graph community): 0.24
Nodes (7): PrdOverview\(\), PrdOverviewProps, getPrdGateStatus\(\), getPrdOverallProgress\(\), isPrdApproved\(\), validatePrdSection8\(\), validatePrdSections1to7\(\)

### Community 13 - "Architecture — Index"
Cohesion (entity basis within full-graph community): 0.29
Nodes (7): Caching Rules \(.req-gath-sys/\), Code Indexing Architecture, Incremental Rebuild, Index IPC Flow, Index Structure \(.req-gath-sys/code-index.json\), Indexing Pipeline, New IPC Messages

### Community 14 - "Extension Code Indexer — Components"
Cohesion (entity basis within full-graph community): 0.43
Nodes (7): CodeIndexer, .buildImportMap\(\), .constructor\(\), .extractComponents\(\), .findChildComponents\(\), .findParentComponents\(\), .minimalFileEntry\(\)

### Community 15 - "Types Form"
Cohesion (entity basis within full-graph community): 0
Nodes (6): AssumptionRow, OpenQuestionRow, PerformanceMetricRow, RiskRow, SignatureRow, StakeholderRow

### Community 16 - "Components Prd Section1 4"
Cohesion (entity basis within full-graph community): 0
Nodes (5): PrdCreationPageProps, PrdSection2\(\), PrdSection3\(\), PrdSection4\(\), Props

### Community 17 - "Pages Prd Creation Page"
Cohesion (entity basis within full-graph community): 0.33
Nodes (6): PrdCreationPage\(\), goNext\(\), goPrev\(\), handleExport\(\), handleSignOff\(\), navigateTo\(\)

### Community 18 - "Architecture — Data"
Cohesion (entity basis within full-graph community): 0.4
Nodes (5): Charter Data \(FormData — src/types/form.ts\), Data Model, File Storage, PRD Data \(PrdFormData — src/types/prdForm.ts\), Shared Row Types

### Community 19 - "Extension Protocol"
Cohesion (entity basis within full-graph community): 0
Nodes (4): CodeIndex, CharterStorage, CustomOptionsStorage, PrdStorage

### Community 20 - "Utils PDF Export — Boolean"
Cohesion (entity basis within full-graph community): 0
Nodes (4): booleanRows\(\), FieldRow, gateDecisionLabel\(\), SectionEntry

### Community 21 - "Components Pipeline Chrome"
Cohesion (entity basis within full-graph community): 0.17
Nodes (4): PipelineFooterProps, PipelineHeader\(\), PipelineHeaderProps, isPhaseUnlocked\(\)

### Community 22 - "Components Prd Sidebar"
Cohesion (entity basis within full-graph community): 0.33
Nodes (4): sectionValidator\(\), PrdSidebar\(\), PrdSidebarProps, getPrdSectionValidator\(\)

### Community 23 - "Components Chat Toggle Button"
Cohesion (entity basis within full-graph community): 0
Nodes (2): ChatToggleButton\(\), ChatToggleButtonProps

### Community 24 - "Architecture — Flow"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): 1. Data Persistence Flow, 2. PDF Export Flow, 3. Custom Options \(Editable Dropdown\) Flow, Key Workflow Diagrams

### Community 25 - "Extension Code Indexer — Build"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): .buildGraphData\(\), .buildIndex\(\), .computeFileHashes\(\), .extractIpcMessages\(\)

### Community 26 - "Extension"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): activate\(\), getHtml\(\), postMessage\(\), workspaceRoot\(\)

### Community 27 - "Readme"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 28 - "Src App"
Cohesion (entity basis within full-graph community): 1
Nodes (2): App\(\), renderPage\(\)

### Community 29 - "Components Chat Panel"
Cohesion (entity basis within full-graph community): 0
Nodes (2): ChatPanelProps, ChatMessage

### Community 30 - "Components Crt Monitor"
Cohesion (entity basis within full-graph community): 0
Nodes (2): CRTMonitor\(\), CRTMonitorProps

### Community 31 - "Pages Phase Placeholder Page"
Cohesion (entity basis within full-graph community): 0
Nodes (2): PhasePlaceholderPage\(\), Props

### Community 32 - "Data Phases"
Cohesion (entity basis within full-graph community): 0
Nodes (2): getPhaseById\(\), Phase

### Community 33 - "Hooks Use Chat"
Cohesion (entity basis within full-graph community): 0
Nodes (2): nextId\(\), useChat\(\)

### Community 34 - "Hooks Use Code Index"
Cohesion (entity basis within full-graph community): 0
Nodes (2): CodeIndexSummary, GraphSummary

### Community 35 - "Utils Validation — All"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): isGateReviewComplete\(\), validateSection8\(\), allChecked\(\)

### Community 36 - "Pages Home Page — Page"
Cohesion (entity basis within full-graph community): 1
Nodes (2): page /HomePage, /HomePage

### Community 37 - "Pages Phase Placeholder Page — Page"
Cohesion (entity basis within full-graph community): 1
Nodes (2): page /PhasePlaceholderPage, /PhasePlaceholderPage

### Community 38 - "Pages Prd Creation Page — Page"
Cohesion (entity basis within full-graph community): 1
Nodes (2): page /PrdCreationPage, /PrdCreationPage

### Community 39 - "Pages Project Charter Page"
Cohesion (entity basis within full-graph community): 1
Nodes (2): page /ProjectCharterPage, /ProjectCharterPage

### Community 40 - "Components Chat Panel — Chat"
Cohesion (entity basis within full-graph community): 1
Nodes (2): ChatPanel\(\), handleSubmit\(\)

### Community 41 - "Extension Code Indexer — Cache"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .cacheFilePath\(\), .writeIndex\(\)

### Community 42 - "Extension Code Indexer — Classify"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .classifyFile\(\), .parseFiles\(\)

### Community 43 - "Extension Code Indexer — Collect"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .collectSourceFiles\(\), walk\(\)

### Community 44 - "Extension Code Indexer — Create"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .createTsProgram\(\), .extractTypes\(\)

### Community 45 - "Extension Code Indexer — Index"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .indexFilePath\(\), .loadIndex\(\)

### Community 46 - "Extension Code Indexer — Finish"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .runMadar\(\), finish\(\)

### Community 47 - "Extension Code Indexer — Component"
Cohesion (entity basis within full-graph community): 1
Nodes (2): hasJsxReturn\(\), isReactComponent\(\)

### Community 48 - "Extension Code Indexer — Return"
Cohesion (entity basis within full-graph community): 1
Nodes (2): isReactComponentFromReturn\(\), hasJsxReturn\(\)

### Community 49 - "Utils PDF Export — API"
Cohesion (entity basis within full-graph community): 1
Nodes (2): exportPdfAs\(\), getVscodeApi\(\)

### Community 50 - "Pages PDF Export"
Cohesion (entity basis within full-graph community): 1
Nodes (2): exportToPdf\(\), handleExport\(\)

### Community 51 - "Components Pipeline Chrome — Footer"
Cohesion (entity basis within full-graph community): 1
Nodes (2): gateFooterLabel\(\), PipelineFooter\(\)

### Community 52 - "Components Section4 8"
Cohesion (entity basis within full-graph community): 1
Nodes (2): Props, Section8Props

### Community 53 - "Hooks Use View State"
Cohesion (entity basis within full-graph community): 1
Nodes (1): useViewState\(\)

### Community 54 - "Utils Validation — Table"
Cohesion (entity basis within full-graph community): 1
Nodes (2): hasTableContent\(\), hasTableRow\(\)

### Community 55 - "Assets Vite"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 56 - "Utils Vscode API"
Cohesion (entity basis within full-graph community): 1
Nodes (1): VscodeApi

### Community 57 - "Ascen Ai Project Charter Template DOCX"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 58 - "Eslint Config Js"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 59 - "Favicon SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 60 - "Hero Png"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 61 - "Home Dashboard Png"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 62 - "Icons SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

## Knowledge Gaps
- **166 weakly connected node(s):** `FileEntry`, `TypeProperty`, `TypeEntry`, `ComponentEntry`, `IpcMessageEntry` (+161 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Pages Home Page — Page`** (2 nodes): `page /HomePage`, `/HomePage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pages Phase Placeholder Page — Page`** (2 nodes): `page /PhasePlaceholderPage`, `/PhasePlaceholderPage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pages Prd Creation Page — Page`** (2 nodes): `page /PrdCreationPage`, `/PrdCreationPage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pages Project Charter Page`** (2 nodes): `page /ProjectCharterPage`, `/ProjectCharterPage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Components Chat Panel — Chat`** (2 nodes): `ChatPanel\(\)`, `handleSubmit\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Code Indexer — Cache`** (2 nodes): `.cacheFilePath\(\)`, `.writeIndex\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Code Indexer — Classify`** (2 nodes): `.classifyFile\(\)`, `.parseFiles\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Code Indexer — Collect`** (2 nodes): `.collectSourceFiles\(\)`, `walk\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Code Indexer — Create`** (2 nodes): `.createTsProgram\(\)`, `.extractTypes\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Code Indexer — Index`** (2 nodes): `.indexFilePath\(\)`, `.loadIndex\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Code Indexer — Finish`** (2 nodes): `.runMadar\(\)`, `finish\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Code Indexer — Component`** (2 nodes): `hasJsxReturn\(\)`, `isReactComponent\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extension Code Indexer — Return`** (2 nodes): `isReactComponentFromReturn\(\)`, `hasJsxReturn\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utils PDF Export — API`** (2 nodes): `exportPdfAs\(\)`, `getVscodeApi\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pages PDF Export`** (2 nodes): `exportToPdf\(\)`, `handleExport\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Components Pipeline Chrome — Footer`** (2 nodes): `gateFooterLabel\(\)`, `PipelineFooter\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Components Section4 8`** (2 nodes): `Props`, `Section8Props`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hooks Use View State`** (2 nodes): `useViewState.ts`, `useViewState\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utils Validation — Table`** (2 nodes): `hasTableContent\(\)`, `hasTableRow\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Assets Vite`** (2 nodes): `vite.svg`, `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utils Vscode API`** (2 nodes): `vscodeApi.ts`, `VscodeApi`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ascen Ai Project Charter Template DOCX`** (1 nodes): `Ascen\_AI\_Project\_Charter\_Template.docx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Eslint Config Js`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Favicon SVG`** (1 nodes): `favicon.svg`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hero Png`** (1 nodes): `hero.png`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Home Dashboard Png`** (1 nodes): `home-dashboard.png`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Icons SVG`** (1 nodes): `icons.svg`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does \`Req-Gath-Sys — Architecture\` connect \`Architecture\` to \`Architecture — Flow\`, \`Architecture — Index\`, \`Architecture — Data\`?**
  _High betweenness centrality \(22905.000\) - this node is a cross-community bridge._
- **Why does \`Data Model\` connect \`Architecture — Data\` to \`Architecture\`?**
  _High betweenness centrality \(22426.000\) - this node is a cross-community bridge._
- **Why does \`Notable Architectural Decisions\` connect \`Architecture\` to \`Extension Code Indexer\`?**
  _High betweenness centrality \(18018.000\) - this node is a cross-community bridge._
- **What connects \`FileEntry\`, \`TypeProperty\`, \`TypeEntry\` to the rest of the system?**
  _166 weakly-connected nodes found - possible documentation gaps or missing edges._
