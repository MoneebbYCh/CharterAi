import type { CodeIndex } from './codeIndexer'

export type View =
  | { page: 'home' }
  | { page: 'project-charter'; section?: 'overview' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }
  | { page: 'prd'; section?: 'overview' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }
  | { page: 'placeholder'; phase: string }

export interface CharterStorage {
  STORAGE_KEY: 'ascen-project-charter-v2'
  data: unknown
}

export interface PrdStorage {
  STORAGE_KEY: 'ascen-prd-v1'
  data: unknown
}

export interface CustomOptionsStorage {
  STORAGE_KEY: 'ascen-charter-custom-options-v1'
  strings: Partial<Record<string, string[]>>
  choices: Partial<Record<string, { value: string; label: string }[]>>
}

export type ExtensionToWebviewMessage =
  | { type: 'loadCharter'; data: unknown }
  | { type: 'loadPrd'; data: unknown; charterData: unknown | null }
  | { type: 'loadCustomOptions'; data: CustomOptionsStorage }
  | { type: 'navigateTo'; view: View }
  | { type: 'indexProgress'; phase: string; percent: number }
  | { type: 'loadCodeIndex'; data: CodeIndex | null }
  | { type: 'chatResponse'; text: string }

export type WebviewToExtensionMessage =
  | { type: 'saveCharter'; data: unknown }
  | { type: 'savePrd'; data: unknown }
  | { type: 'saveCustomOptions'; data: CustomOptionsStorage }
  | { type: 'loadCharter' }
  | { type: 'loadPrd' }
  | { type: 'loadCustomOptions' }
  | { type: 'exportPdf'; phase: 'charter' | 'prd'; buffer: ArrayBuffer }
  | { type: 'exportPdfAs'; phase: 'charter' | 'prd'; buffer: ArrayBuffer }
  | { type: 'revealExport'; path: string }
  | { type: 'navigate'; view: View }
  | { type: 'ready' }
  | { type: 'indexCodebase' }
  | { type: 'loadCodeIndex' }
  | { type: 'chatMessage'; text: string; phase: string }
