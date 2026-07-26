import { useEffect, useMemo, useRef } from 'react'
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import type { Block } from '@blocknote/core'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import type { BlockNoteBlock } from '../../types/document'
import {
  canvasSchema,
  filterSuggestionItems,
  getCanvasSlashMenuItems,
  type CanvasEditor,
} from './schema'
import { sanitizeCanvasBlocks } from './sanitizeBlocks'

interface DocumentCanvasProps {
  initialBlocks: BlockNoteBlock[]
  onChange: (blocks: BlockNoteBlock[]) => void
  externalRevision: number
  externalBlocks: BlockNoteBlock[] | null
  /** Remount key when the boundary resets the document. */
  editorKey?: string | number
  /** Expose the live editor for the tools sidebar. */
  onEditorReady?: (editor: CanvasEditor | null) => void
}

function DocumentCanvasInner({
  initialBlocks,
  onChange,
  externalRevision,
  externalBlocks,
  onEditorReady,
}: DocumentCanvasProps) {
  const applyingExternal = useRef(false)
  const lastExternalRevision = useRef(0)

  const initialContent = useMemo(
    () => sanitizeCanvasBlocks(initialBlocks),
    // Only for first mount — editor owns content after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const editor = useCreateBlockNote({
    schema: canvasSchema,
    initialContent,
    placeholders: {
      default: "Type '/' for Scope, KPIs, Diagram…",
      heading: 'Heading',
    },
  })

  useEffect(() => {
    onEditorReady?.(editor as CanvasEditor)
    return () => onEditorReady?.(null)
  }, [editor, onEditorReady])

  useEffect(() => {
    if (!externalBlocks || externalRevision === lastExternalRevision.current) return
    lastExternalRevision.current = externalRevision
    applyingExternal.current = true
    try {
      const next = sanitizeCanvasBlocks(externalBlocks)
      editor.replaceBlocks(editor.document, next)
    } catch (err) {
      console.error('[DocumentCanvas] replaceBlocks failed', err)
      try {
        editor.replaceBlocks(editor.document, [{ type: 'paragraph', content: '' }])
      } catch {
        /* ignore secondary failure — ErrorBoundary will catch render issues */
      }
    } finally {
      queueMicrotask(() => {
        applyingExternal.current = false
      })
    }
  }, [editor, externalBlocks, externalRevision])

  return (
    <div className="bn-canvas-host">
      <BlockNoteView
        editor={editor}
        theme="light"
        slashMenu={false}
        onChange={() => {
          if (applyingExternal.current) return
          onChange(editor.document as unknown as BlockNoteBlock[])
        }}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(
              [
                ...getDefaultReactSlashMenuItems(editor),
                ...getCanvasSlashMenuItems(editor as CanvasEditor),
              ],
              query,
            )
          }
        />
      </BlockNoteView>
    </div>
  )
}

export function DocumentCanvas(props: DocumentCanvasProps) {
  return <DocumentCanvasInner key={props.editorKey ?? 'canvas'} {...props} />
}

export type { Block, CanvasEditor }
