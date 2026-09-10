import { useMemo, useState } from 'react'
import type { TemplateBuilderPrefill, View } from '../hooks/useViewState'
import { BrandMark } from '../components/BrandMark'
import { TemplateCanvasPreview } from '../components/TemplateCanvasPreview'
import { SectionEditor } from '../components/templateBuilder/SectionEditor'
import {
  BUILDER_CATEGORIES,
  BUILDER_ICONS,
  emptySectionDraft,
  sectionDraftToSpec,
  sectionSpecToDraft,
  type BuilderMetaDraft,
  type BuilderSectionDraft,
} from '../components/templateBuilder/types'
import { compileManifestToBlocks } from '../data/templates/compileManifest'
import {
  getUserManifest,
  saveUserManifest,
  updateUserManifest,
} from '../data/templates/userManifestStore'
import type { TemplateManifest } from '../data/types/templateManifest'

interface TemplateBuilderPageProps {
  onNavigate: (view: View) => void
  goHome: () => void
  editTemplateId?: string
  prefill?: TemplateBuilderPrefill
}

function loadInitial(
  editTemplateId?: string,
  prefill?: TemplateBuilderPrefill,
): {
  meta: BuilderMetaDraft
  sections: BuilderSectionDraft[]
  fromCanvas: boolean
  hadHeadings: boolean
  returnPhaseId?: string
  returnAuthoringTemplate?: boolean
} {
  if (editTemplateId) {
    const stored = getUserManifest(editTemplateId)
    if (stored) {
      return {
        meta: {
          name: stored.name,
          description: stored.description ?? '',
          icon: stored.icon,
          suggestedDocName: stored.suggestedDocName,
          category: stored.category,
        },
        sections:
          stored.manifest.sections.length > 0
            ? [...stored.manifest.sections]
                .sort((a, b) => a.order - b.order)
                .map(sectionSpecToDraft)
            : [emptySectionDraft(0)],
        fromCanvas: false,
        hadHeadings: true,
      }
    }
  }

  if (prefill?.source === 'canvas') {
    const sections =
      prefill.sections.length > 0
        ? prefill.sections.map(sectionSpecToDraft)
        : [emptySectionDraft(0)]
    const name = prefill.name?.trim() || ''
    return {
      meta: {
        name,
        description: '',
        icon: prefill.icon?.trim() || 'edit_note',
        suggestedDocName: name,
        category: 'Engineering',
      },
      sections,
      fromCanvas: true,
      hadHeadings: prefill.hadHeadings && prefill.sections.length > 0,
      returnPhaseId: prefill.returnPhaseId,
      returnAuthoringTemplate: prefill.returnAuthoringTemplate,
    }
  }

  return {
    meta: {
      name: '',
      description: '',
      icon: 'edit_note',
      suggestedDocName: '',
      category: 'Engineering',
    },
    sections: [emptySectionDraft(0)],
    fromCanvas: false,
    hadHeadings: true,
  }
}

export function TemplateBuilderPage({
  onNavigate,
  goHome,
  editTemplateId,
  prefill,
}: TemplateBuilderPageProps) {
  const initial = useMemo(
    () => loadInitial(editTemplateId, prefill),
    [editTemplateId, prefill],
  )
  const [meta, setMeta] = useState<BuilderMetaDraft>(initial.meta)
  const [sections, setSections] = useState<BuilderSectionDraft[]>(initial.sections)
  const [previewRev, setPreviewRev] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const isEdit = Boolean(editTemplateId && getUserManifest(editTemplateId))
  const fromCanvas = initial.fromCanvas
  const hadHeadings = initial.hadHeadings

  const cancelTarget: View = initial.returnPhaseId
    ? {
        page: initial.returnPhaseId,
        authoringTemplate: initial.returnAuthoringTemplate || undefined,
      }
    : { page: 'templates' }

  const titlebarLabel = isEdit
    ? 'Edit Custom Template'
    : fromCanvas
      ? 'Review Template Structure'
      : 'Create Custom Template'

  const headline = isEdit
    ? 'Edit template'
    : fromCanvas
      ? 'Review starting structure'
      : 'Define structure'

  const subtitle = isEdit
    ? 'Change sections, guidance, or starter structure — then save.'
    : fromCanvas
      ? hadHeadings
        ? 'We pulled a starting structure from your headings — review and adjust before saving. This will not stay in sync with the original document.'
        : 'No section headings found on the canvas. Add sections below (and set seed kinds manually if you want starter tables or grids). This will not stay in sync with the original document.'
      : 'Add sections and optional starter structure. Same compile path as curated templates.'

  const manifest: TemplateManifest = useMemo(
    () => ({
      id: editTemplateId || 'draft-preview',
      sections: sections.map((s, i) => sectionDraftToSpec(s, i + 1)),
    }),
    [sections, editTemplateId],
  )

  const previewBlocks = useMemo(
    () =>
      compileManifestToBlocks(manifest, {
        title: meta.name.trim() || 'Untitled template',
        numberTopLevel: false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount via previewRev
    [previewRev],
  )

  const updateSection = (localId: string, next: BuilderSectionDraft) => {
    setSections((list) => list.map((s) => (s.localId === localId ? next : s)))
  }

  const moveSection = (index: number, dir: -1 | 1) => {
    setSections((list) => {
      const target = index + dir
      if (target < 0 || target >= list.length) return list
      const next = [...list]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const handleSave = () => {
    const name = meta.name.trim()
    if (!name) {
      setError('Name is required.')
      return
    }
    const withHeadings = sections.filter((s) => s.heading.trim())
    if (withHeadings.length === 0) {
      setError('Add at least one section with a heading.')
      return
    }

    const payload = {
      name,
      description: meta.description,
      icon: meta.icon,
      suggestedDocName: meta.suggestedDocName.trim() || name,
      category: meta.category,
      manifest: {
        sections: withHeadings.map((s, i) => sectionDraftToSpec(s, i + 1)),
      },
    }

    if (isEdit && editTemplateId) {
      updateUserManifest(editTemplateId, payload)
      onNavigate({
        page: 'templates',
        highlightTemplateId: editTemplateId,
        templatesCategory: 'Saved',
      })
    } else {
      const saved = saveUserManifest(payload)
      onNavigate({
        page: 'templates',
        highlightTemplateId: saved.id,
        templatesCategory: 'Saved',
      })
    }
  }

  return (
    <div className="home-desktop h-screen w-full overflow-hidden flex flex-col dither-bg">
      <div className="home-mac-window flex-1 min-h-0 m-2 md:m-3 border-2 border-on-background bg-white mac-window-shadow flex flex-col">
        <div className="flex items-center gap-2 border-b-2 border-on-background bg-secondary-container px-2 py-1 shrink-0">
          <div className="mac-striped-header flex-1 min-w-0" aria-hidden />
          <span
            className="text-xs font-bold text-on-background px-2 whitespace-nowrap"
            style={{ fontFamily: 'var(--font-label)' }}
          >
            {titlebarLabel}
          </span>
          <div className="mac-striped-header flex-1 min-w-0" aria-hidden />
        </div>

        <div className="flex items-center justify-between gap-3 px-3 py-2 border-b-2 border-on-background bg-surface-container-low shrink-0">
          <button
            type="button"
            onClick={() => onNavigate(cancelTarget)}
            className="border-2 border-on-background bg-white text-on-background font-bold px-3 py-1 text-xs outset-button"
            style={{ fontFamily: 'var(--font-label)' }}
          >
            {initial.returnPhaseId ? '← Back to draft' : '← Templates'}
          </button>
          <button
            type="button"
            onClick={goHome}
            className="text-[11px] text-on-surface-variant underline"
            style={{ fontFamily: 'var(--font-label)' }}
          >
            Desktop
          </button>
        </div>

        <div className="tb-layout">
          <div className="tb-form-pane">
            <div className="tb-form-header">
              <BrandMark size="sm" />
              <div className="min-w-0 flex-1">
                <h1 className="tb-title">{headline}</h1>
                <p className="tb-subtitle">{subtitle}</p>
              </div>
            </div>

            {fromCanvas ? (
              <div className={`tb-banner${hadHeadings ? '' : ' tb-banner--warn'}`} role="status">
                {hadHeadings
                  ? `${sections.length} section${sections.length === 1 ? '' : 's'} detected from headings. Typed blocks (diagrams, tables, KPIs, …) are included as starters — adjust freely before saving.`
                  : 'No usable section headings were detected. Define the outline manually below.'}
              </div>
            ) : null}

            <section className="tb-meta">
              <label className="tb-field">
                <span className="tb-field-label">Name</span>
                <input
                  type="text"
                  className="tb-input"
                  value={meta.name}
                  onChange={(e) => setMeta({ ...meta, name: e.target.value })}
                  placeholder="e.g. Team Design Review"
                />
              </label>
              <label className="tb-field">
                <span className="tb-field-label">Description</span>
                <textarea
                  className="tb-textarea"
                  rows={2}
                  value={meta.description}
                  onChange={(e) => setMeta({ ...meta, description: e.target.value })}
                  placeholder="What is this template for?"
                />
              </label>
              <div className="tb-field-row">
                <label className="tb-field tb-field--grow">
                  <span className="tb-field-label">Suggested document name</span>
                  <input
                    type="text"
                    className="tb-input"
                    value={meta.suggestedDocName}
                    onChange={(e) => setMeta({ ...meta, suggestedDocName: e.target.value })}
                    placeholder="Defaults to template name"
                  />
                </label>
                <label className="tb-field">
                  <span className="tb-field-label">Category</span>
                  <select
                    className="tb-input"
                    value={meta.category}
                    onChange={(e) =>
                      setMeta({
                        ...meta,
                        category: e.target.value as BuilderMetaDraft['category'],
                      })
                    }
                  >
                    {BUILDER_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <fieldset className="tb-icon-picker">
                <legend className="tb-field-label">Icon</legend>
                <div className="tb-icon-grid">
                  {BUILDER_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`tb-icon-choice${meta.icon === icon ? ' tb-icon-choice--active' : ''}`}
                      onClick={() => setMeta({ ...meta, icon })}
                      aria-label={icon}
                      aria-pressed={meta.icon === icon}
                    >
                      <span className="material-symbols-outlined" aria-hidden>
                        {icon}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </section>

            <div className="tb-sections-head">
              <h2 className="tb-sections-title">Sections</h2>
              <button
                type="button"
                className="border-2 border-on-background bg-white text-on-background font-bold px-3 py-1 text-xs outset-button"
                style={{ fontFamily: 'var(--font-label)' }}
                onClick={() => setSections((list) => [...list, emptySectionDraft(list.length)])}
              >
                + Add section
              </button>
            </div>

            <div className="tb-sections">
              {sections.map((section, index) => (
                <SectionEditor
                  key={section.localId}
                  section={section}
                  index={index}
                  total={sections.length}
                  onChange={(next) => updateSection(section.localId, next)}
                  onRemove={() =>
                    setSections((list) => list.filter((s) => s.localId !== section.localId))
                  }
                  onMove={(dir) => moveSection(index, dir)}
                />
              ))}
            </div>

            {error ? <p className="tb-error">{error}</p> : null}

            <div className="tb-form-footer">
              <button
                type="button"
                className="border-2 border-on-background bg-white text-on-background font-bold px-4 py-2 text-sm outset-button"
                style={{ fontFamily: 'var(--font-label)' }}
                onClick={() => onNavigate(cancelTarget)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="border-2 border-on-background bg-secondary-container text-on-background font-bold px-4 py-2 text-sm outset-button"
                style={{ fontFamily: 'var(--font-label)' }}
                onClick={() => {
                  setError(null)
                  setPreviewRev((n) => n + 1)
                }}
              >
                Update preview
              </button>
              <button
                type="button"
                className="border-2 border-on-background bg-primary text-on-primary font-bold px-4 py-2 text-sm outset-button"
                style={{ fontFamily: 'var(--font-label)' }}
                onClick={handleSave}
              >
                {isEdit ? 'Save changes' : 'Save template'}
              </button>
            </div>
          </div>

          <aside className="tb-preview-pane">
            <p className="tb-preview-label">Live preview</p>
            <div className="tb-preview-sheet">
              <TemplateCanvasPreview
                blocks={previewBlocks}
                editorKey={`builder-preview-${previewRev}`}
                variant="full"
              />
            </div>
            <p className="tb-hint tb-preview-hint">
              Preview of the compiled template — not a live copy of your document.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
