import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../../hooks/useChat'
import { ChatMarkdown } from './ChatMarkdown'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  messages: ChatMessage[]
  onSend: (text: string) => void
  onClear: () => void
  isTyping: boolean
  /** Interim status while the assistant works (e.g. updating code index). */
  statusText?: string | null
}

export function ChatPanel({
  isOpen,
  onClose,
  messages,
  onSend,
  onClear,
  isTyping,
  statusText,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, isTyping, statusText])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    onSend(input)
    setInput('')
  }

  return (
    <div
      className={`chat-panel ${isOpen ? 'chat-panel--open' : ''}`}
      role="complementary"
      aria-label="Chat"
    >
      <div className="chat-titlebar">
        <div className="chat-titlebar-stripes" />
        <span className="chat-titlebar-text">Chat</span>
        <div className="chat-titlebar-actions">
          <button
            type="button"
            className="chat-titlebar-btn"
            onClick={onClose}
            aria-label="Close chat panel"
          >
            ✕
          </button>
        </div>
      </div>

      <div ref={listRef} className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble chat-bubble--${msg.role}`}>
            <div className="chat-bubble-label">
              {msg.role === 'user' ? 'You' : 'Assistant'}
            </div>
            {msg.role === 'assistant' ? (
              <div className="chat-bubble-text">
                <ChatMarkdown text={msg.text} />
              </div>
            ) : (
              <div className="chat-bubble-text chat-bubble-text--plain">{msg.text}</div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="chat-bubble chat-bubble--assistant">
            <div className="chat-bubble-label">Assistant</div>
            {statusText ? (
              <div className="chat-bubble-text chat-status-text">{statusText}</div>
            ) : (
              <div className="chat-typing-dots">
                <span className="chat-dot" />
                <span className="chat-dot" />
                <span className="chat-dot" />
              </div>
            )}
          </div>
        )}
      </div>

      <form className="chat-inputbar" onSubmit={handleSubmit}>
        <div className="chat-input-wrap">
          <input
            ref={inputRef}
            className="chat-input"
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
          />
        </div>
        <div className="chat-input-actions">
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
          >
            Send
          </button>
          <button
            type="button"
            className="chat-clear-btn"
            onClick={onClear}
            title="Clear conversation"
            aria-label="Clear conversation"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  )
}
