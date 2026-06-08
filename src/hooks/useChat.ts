import { useState, useCallback, useRef } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: number
}

let msgId = 0
function nextId(): string { return `chat-${++msgId}` }

const WELCOME: ChatMessage = {
  id: nextId(),
  role: 'assistant',
  text: 'Hello! I\'m your Req-Gath-Sys assistant. Ask me anything about your project, codebase, or pipeline phases — backend integration coming soon!',
  timestamp: Date.now(),
}

export function useChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [isTyping, setIsTyping] = useState(false)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    if (typingTimer.current) clearTimeout(typingTimer.current)

    typingTimer.current = setTimeout(() => {
      const reply: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        text: `Echo: "${trimmed}"\n\nBackend chat integration is next on the roadmap! I'll be able to answer questions about your project, code index, and pipeline phases.`,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, reply])
      setIsTyping(false)
    }, 1200)
  }, [])

  const clearMessages = useCallback(() => {
    if (typingTimer.current) clearTimeout(typingTimer.current)
    setIsTyping(false)
    setMessages([WELCOME])
  }, [])

  return {
    isOpen,
    toggleOpen,
    close,
    messages,
    sendMessage,
    clearMessages,
    isTyping,
  }
}
