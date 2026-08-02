import { useViewState } from './hooks/useViewState'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { PhaseCanvasPage } from './pages/PhaseCanvasPage'
import { CRTMonitor } from './components/layout/CRTMonitor'
import { isDocumentTypeId, hydrateCustomTypesFromDisk } from './data/documentTypes'
import { getVscodeApi } from './utils/vscodeApi'
import {
  getWorkspaceId,
  setWorkspaceScope,
} from './utils/workspaceScope'
import { useChat } from './hooks/useChat'
import { ChatPanel } from './components/chat/ChatPanel'
import { ChatToggleButton } from './components/chat/ChatToggleButton'
import { useEffect, useState } from 'react'

function App() {
  const vscode = getVscodeApi()
  // Wait until we know which folder we're in (VS Code) so localStorage is scoped first.
  const [scopeReady, setScopeReady] = useState(!vscode)
  const [workspaceKey, setWorkspaceKey] = useState(() => getWorkspaceId() || 'local')
  const [, setDocTypesRev] = useState(0)

  useEffect(() => {
    if (!vscode) return
    const handler = (event: MessageEvent) => {
      const msg = event.data
      if (msg?.type === 'workspaceInfo' && typeof msg.path === 'string') {
        setWorkspaceScope(msg.path)
        setWorkspaceKey(getWorkspaceId() || 'workspace')
        setScopeReady(true)
        // Load doc types for *this* folder after scope is set.
        vscode.postMessage({ type: 'loadDocTypes' })
      }
      if (msg?.type === 'loadDocTypes') {
        if (hydrateCustomTypesFromDisk(msg.data)) {
          setDocTypesRev((n) => n + 1)
        }
      }
    }
    window.addEventListener('message', handler)
    vscode.postMessage({ type: 'loadWorkspaceInfo' })
    return () => window.removeEventListener('message', handler)
  }, [vscode])

  if (!scopeReady) {
    return (
      <CRTMonitor>
        <div className="flex h-screen items-center justify-center text-sm text-on-surface-variant">
          Connecting to workspace…
        </div>
      </CRTMonitor>
    )
  }

  // Remount the whole app tree when the folder changes so chat + docs reset.
  return <AppShell key={workspaceKey} />
}

function AppShell() {
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
    if (isDocumentTypeId(view.page)) {
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
        statusText={chat.statusText}
      />
    </CRTMonitor>
  )
}

export default App
