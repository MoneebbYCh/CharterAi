import { useViewState } from './hooks/useViewState'
import { HomePage } from './pages/HomePage'
import { ProjectCharterPage } from './pages/ProjectCharterPage'
import { PrdCreationPage } from './pages/PrdCreationPage'
import { PhasePlaceholderPage } from './pages/PhasePlaceholderPage'
import { CRTMonitor } from './components/layout/CRTMonitor'
import { PHASES } from './data/phases'
import { useChat } from './hooks/useChat'
import { ChatPanel } from './components/chat/ChatPanel'
import { ChatToggleButton } from './components/chat/ChatToggleButton'

function App() {
  const { view, navigate, goHome } = useViewState()
  const chat = useChat()

  const renderPage = () => {
    switch (view.page) {
      case 'home':
        return <HomePage onNavigate={navigate} />
      case 'project-charter':
        return <ProjectCharterPage onNavigate={navigate} goHome={goHome} />
      case 'prd':
        return <PrdCreationPage onNavigate={navigate} goHome={goHome} />
      case 'placeholder': {
        const phase = PHASES.find((p) => p.id === view.phaseId)
        if (!phase) return <HomePage onNavigate={navigate} />
        return <PhasePlaceholderPage phase={phase} onNavigate={navigate} />
      }
      default:
        return <HomePage onNavigate={navigate} />
    }
  }

  return (
    <CRTMonitor>
      {renderPage()}
      <ChatToggleButton isOpen={chat.isOpen} onClick={chat.toggleOpen} />
      <ChatPanel
        isOpen={chat.isOpen}
        onClose={chat.close}
        messages={chat.messages}
        onSend={chat.sendMessage}
        onClear={chat.clearMessages}
        isTyping={chat.isTyping}
      />
    </CRTMonitor>
  )
}

export default App
