import type { BlockNoteBlock } from '../types/document'
import { DocumentCanvas } from './canvas/DocumentCanvas'

const NOOP = () => {}

interface TemplateCanvasPreviewProps {
  blocks: BlockNoteBlock[]
  /** Remount when template or variant changes. */
  editorKey: string
  variant?: 'full' | 'thumb'
  className?: string
}

const THUMB_BLOCK_LIMIT = 18

/** Read-only BlockNote preview — same renderer as the live canvas. */
export function TemplateCanvasPreview({
  blocks,
  editorKey,
  variant = 'full',
  className = '',
}: TemplateCanvasPreviewProps) {
  const previewBlocks = variant === 'thumb' ? blocks.slice(0, THUMB_BLOCK_LIMIT) : blocks
  const variantClass =
    variant === 'thumb' ? 'template-canvas-preview--thumb' : 'template-canvas-preview--full'

  return (
    <div className={`template-canvas-preview ${variantClass} ${className}`.trim()}>
      <DocumentCanvas
        initialBlocks={previewBlocks}
        onChange={NOOP}
        externalRevision={0}
        externalBlocks={null}
        editorKey={editorKey}
        readOnly
      />
    </div>
  )
}
