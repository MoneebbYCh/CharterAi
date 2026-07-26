import { PhaseCanvasPage } from './PhaseCanvasPage'
import type { View } from '../hooks/useViewState'

interface ProjectCharterPageProps {
  onNavigate: (view: View) => void
  goHome: () => void
}

/** @deprecated Use PhaseCanvasPage with phaseId="project-charter" */
export function ProjectCharterPage(props: ProjectCharterPageProps) {
  return <PhaseCanvasPage phaseId="project-charter" {...props} />
}
