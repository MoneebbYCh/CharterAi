import { useEffect, useState } from 'react'
import { BlockEditDialog } from './BlockEditDialog'
import { MermaidRenderer } from './MermaidRenderer'

interface MermaidEditorDialogProps {
  open: boolean
  dialogTitle: string
  initialCode: string
  initialTitle?: string
  saveLabel?: string
  onClose: () => void
  onSave: (next: { code: string; title: string }) => void
}

/** Split editor: Mermaid source on the left, live render on the right. */
export function MermaidEditorDialog({
  open,
  dialogTitle,
  initialCode,
  initialTitle = '',
  saveLabel = 'Save',
  onClose,
  onSave,
}: MermaidEditorDialogProps) {
  const [draftCode, setDraftCode] = useState(initialCode)
  const [draftTitle, setDraftTitle] = useState(initialTitle)
  const [previewCode, setPreviewCode] = useState(initialCode)

  useEffect(() => {
    if (!open) return
    setDraftCode(initialCode)
    setDraftTitle(initialTitle)
    setPreviewCode(initialCode)
  }, [open, initialCode, initialTitle])

  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => setPreviewCode(draftCode), 180)
    return () => window.clearTimeout(id)
  }, [draftCode, open])

  return (
    <BlockEditDialog
      open={open}
      title={dialogTitle}
      wide
      className="rg-edit-dialog--mermaid"
      saveLabel={saveLabel}
      onClose={onClose}
      onSave={() => onSave({ code: draftCode, title: draftTitle.trim() })}
    >
      <label className="rg-edit-field">
        <span>Title</span>
        <input
          type="text"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder="Diagram title"
        />
      </label>

      <div className="rg-mermaid-editor">
        <label className="rg-mermaid-editor-pane">
          <span className="rg-mermaid-editor-pane-label">Mermaid code</span>
          <textarea
            className="rg-edit-code rg-mermaid-editor-code"
            value={draftCode}
            onChange={(e) => setDraftCode(e.target.value)}
            spellCheck={false}
            aria-label="Mermaid source"
          />
        </label>
        <div className="rg-mermaid-editor-pane">
          <span className="rg-mermaid-editor-pane-label">Preview</span>
          <div className="rg-mermaid-editor-preview">
            <MermaidRenderer code={previewCode} />
          </div>
        </div>
      </div>
    </BlockEditDialog>
  )
}
