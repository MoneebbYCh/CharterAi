import type { SectionSpec } from '../types/templateManifest'

/** Split one manifest guidance entry into readable lines. */
export function expandGuidanceEntry(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  // arc42 labels often run together: "Contents ... Motivation ... Form ..."
  // Do not match "form" inside phrases like "Suggested form:".
  const labeled = trimmed.split(
    /\s+(?=(?:Contents|Content|Motivation|Further Information|Remark|Structure)\b)/i,
  )
  if (labeled.length > 1) {
    return labeled.map((part) => part.trim()).filter(Boolean)
  }

  // Inline dash lists: "include - foo - bar"
  if (/\s-\s/.test(trimmed)) {
    const parts = trimmed.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean)
    if (parts.length > 1) return parts
  }

  // Long prose → sentence chunks
  if (trimmed.length > 260) {
    const sentences = trimmed
      .split(/(?<=[.!?])\s+(?=[A-Z"([])/)
      .map((part) => part.trim())
      .filter(Boolean)
    if (sentences.length > 1) return sentences
  }

  return [trimmed]
}

/** Flatten section guidance into display lines (bullets / quotes). */
export function sectionGuidanceLines(section: SectionSpec): string[] {
  const lines: string[] = []
  for (const entry of section.guidance) {
    lines.push(...expandGuidanceEntry(entry))
  }
  if (section.furtherInfoUrl) {
    lines.push(`Reference: ${section.furtherInfoUrl}`)
  }
  if (section.repeatable) {
    lines.push('Repeat this section for each instance you need.')
  }
  return lines
}

export function isAsciiTableLine(text: string): boolean {
  return /\+[-=+]+\+/.test(text) || /^\|.*\|$/.test(text.trim())
}
