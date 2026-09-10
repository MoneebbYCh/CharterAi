import { BlockNoteSchema, defaultBlockSpecs, defaultStyleSpecs, filterSuggestionItems } from '@blocknote/core'
import { createDiagram } from './blocks/Diagram'
import {
  backgroundColorStyle,
  fontFamilyStyle,
  fontSizeStyle,
  textColorStyle,
} from './textStyles'

export const canvasSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    diagram: createDiagram(),
  },
  styleSpecs: {
    ...defaultStyleSpecs,
    textColor: textColorStyle,
    backgroundColor: backgroundColorStyle,
    fontSize: fontSizeStyle,
    fontFamily: fontFamilyStyle,
  },
})

export { filterSuggestionItems }
export {
  CANVAS_INSERT_ITEMS,
  getCanvasSlashMenuItems,
  focusCanvasBlock,
  removeCanvasBlockById,
  insertTable,
  emptyTableBlock,
  type CanvasEditor,
  type CanvasInsertItem,
} from './canvasInsert'
