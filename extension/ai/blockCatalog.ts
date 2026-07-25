/**
 * Shared catalog text for the Charter canvas LLM.
 * Keep in sync with src/components/canvas/blocks/*.
 *
 * Framing: a charter formally authorizes a project (PMI PMBOK).
 * Before it: an idea. After it: a sanctioned project with owner, boundary, and success criteria.
 */
export const CANVAS_BLOCK_CATALOG = `CUSTOM BLOCKS (prefer these over unstructured bullets):

1) callout — authorization / note rail
   { "type": "callout", "props": { "variant": "info"|"warn"|"success"|"error", "title": "Short title" }, "content": "Body text" }
   Use for purpose one-liner, constraints callouts, approval status.

2) kpiGrid — objectives & success criteria (measurable)
   { "type": "kpiGrid", "props": { "items": [ { "metric": "Processing time", "target": "−30%", "method": "Ticket open→close p50" } ] } }
   Never vague goals like "improve efficiency." Targets must be checkable later.

3) scopeBounds — high-level scope WITH explicit exclusions
   { "type": "scopeBounds", "props": { "inScope": ["…"], "outOfScope": ["…"] } }
   Out-of-scope is mandatory — fuzzy scope is where creep starts.

4) stakeholderTable — sponsor, PM, major stakeholders + authority/concern
   { "type": "stakeholderTable", "props": { "rows": [ { "nameRole": "Jane / Sponsor", "interest": "H", "influence": "H", "concern": "Budget gate" } ] } }
   interest/influence: H|M|L.

5) riskList — high-level risks (not a full risk register)
   { "type": "riskList", "props": { "rows": [ { "risk": "Vendor delay", "likelihood": "M", "impact": "H", "mitigation": "Dual source" } ] } }
   likelihood/impact: H|M|L.

Also allowed: heading, paragraph, bulletListItem, numberedListItem, checkListItem.
Do NOT invent other custom types.
When content fits a custom block, ALWAYS use it instead of bullets.`
