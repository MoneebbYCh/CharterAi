import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PHASES } from './data/phases'
import { HomePage } from './pages/HomePage'
import { PhasePlaceholderPage } from './pages/PhasePlaceholderPage'
import { PreSystemDesignPage } from './pages/PreSystemDesignPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pre-system-design" element={<PreSystemDesignPage />} />
        {PHASES.filter((p) => !p.active).map((phase) => (
          <Route
            key={phase.id}
            path={phase.path}
            element={<PhasePlaceholderPage phase={phase} />}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
