import { useState, useCallback, useRef, useEffect } from 'react'
import { getVscodeApi } from '../utils/vscodeApi'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: number
}

const vscode = getVscodeApi()

let msgId = 0
function nextId(): string {
  return `chat-${++msgId}`
}

const WELCOME: ChatMessage = {
  id: nextId(),
  role: 'assistant',
  text: "Hello! I'm your Req-Gath-Sys AI assistant. I can help fill in project charter and PRD forms — just ask!",
  timestamp: Date.now(),
}

const TIMEOUT_MS = 25_000

export function useChat(phase: string) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const clearTimeout_ = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data
      if (msg.type === 'chatResponse') {
        clearTimeout_()
        setIsTyping(false)
        const reply: ChatMessage = {
          id: nextId(),
          role: 'assistant',
          text: msg.text,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, reply])
      }
    }
    window.addEventListener('message', handler)
    return () => {
      window.removeEventListener('message', handler)
      clearTimeout_()
    }
  }, [clearTimeout_])

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        text: trimmed,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, userMsg])

      if (!vscode) {
        const fallback: ChatMessage = {
          id: nextId(),
          role: 'assistant',
          text: 'AI assistant is only available when running inside VS Code with GitHub Copilot enabled.',
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, fallback])
        return
      }

      setIsTyping(true)
      vscode.postMessage({ type: 'chatMessage', text: trimmed, phase })

      clearTimeout_()
      timeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        const timeoutMsg: ChatMessage = {
          id: nextId(),
          role: 'assistant',
          text: 'No response received. Try again — check that GitHub Copilot is signed in and your workspace has a .req-gath-sys directory initialized.',
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, timeoutMsg])
      }, TIMEOUT_MS)
    },
    [phase, clearTimeout_]
  )

  const clearMessages = useCallback(() => {
    clearTimeout_()
    setIsTyping(false)
    setMessages([WELCOME])
  }, [clearTimeout_])

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
