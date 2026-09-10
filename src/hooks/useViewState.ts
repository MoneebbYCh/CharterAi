import { useState, useCallback, useMemo } from 'react'
import { getDocumentType, isDocumentTypeId } from '../data/documentTypes'
import type { SectionSpec } from '../data/types/templateManifest'
import type { MarketplaceCategory } from '../data/templates/types'

/** Prefill for the template builder confirm / create screen. */
export type TemplateBuilderPrefill = {
  /** Always from a canvas extract (create-custom drafts use the same path). */
  source: 'canvas'
  name?: string
  icon?: string
  sections: SectionSpec[]
  /** False when extract found no headings (manual section entry). */
  hadHeadings: boolean
  /** Return here on Cancel when launched from a document. */
  returnPhaseId?: string
  /** Re-open the draft canvas in template-authoring mode. */
  returnAuthoringTemplate?: boolean
}

/** `page` is 'home', 'profile', 'templates', 'template-builder', or any document-type id. */
export type ViewPage = 'home' | 'profile' | 'templates' | 'template-builder' | (string & {})
export type View = {
  page: ViewPage
  /** When opening a new doc from the marketplace, apply this catalog template once ready. */
  seedFromMarketplaceId?: string
  /** When opening the template builder to edit an existing custom manifest. */
  editTemplateId?: string
  /** Draft outline from canvas extract. */
  templateBuilderPrefill?: TemplateBuilderPrefill
  /**
   * Blank canvas opened from Templates → Create custom.
   * Shows “Continue to template” (extract → review). Not set on normal docs.
   */
  authoringTemplate?: boolean
  /** After saving a custom template, open gallery focused on it. */
  highlightTemplateId?: string
  /** Optional initial gallery category filter. */
  templatesCategory?: MarketplaceCategory
}

const NON_DOC_PAGES = new Set(['home', 'profile', 'templates', 'template-builder'])

export function useViewState() {
  const [view, setView] = useState<View>({ page: 'home' })

  const navigate = useCallback((v: View) => {
    setView(v)
  }, [])

  const phaseInfo = useMemo(() => {
    if (NON_DOC_PAGES.has(view.page)) return null
    if (!isDocumentTypeId(view.page)) return null
    return getDocumentType(view.page) ?? null
  }, [view])

  const goHome = useCallback(() => {
    setView({ page: 'home' })
  }, [])

  return { view, navigate, goHome, phaseInfo }
}

export type ViewState = ReturnType<typeof useViewState>
