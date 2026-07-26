import { useViewState } from './hooks/useViewState'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { PhaseCanvasPage } from './pages/PhaseCanvasPage'
import { CRTMonitor } from './components/layout/CRTMonitor'
import { isCanvasPhaseId } from './data/canvasPhases'
import { useChat } from './hooks/useChat'
import { ChatPanel } from './components/chat/ChatPanel'
import { ChatToggleButton } from './components/chat/ChatToggleButton'

function App() {
  const { view, navigate, goHome } = useViewState()
  const chatPhase =
    view.page === 'home' || view.page === 'profile' ? 'project-charter' : view.page
  const chat = useChat(chatPhase)

  const renderPage = () => {
    if (view.page === 'home') {
      return <HomePage onNavigate={navigate} />
    }
    if (view.page === 'profile') {
      return <ProfilePage onNavigate={navigate} goHome={goHome} />
    }
    if (isCanvasPhaseId(view.page)) {
      return <PhaseCanvasPage phaseId={view.page} onNavigate={navigate} goHome={goHome} />
    }
    return <HomePage onNavigate={navigate} />
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
