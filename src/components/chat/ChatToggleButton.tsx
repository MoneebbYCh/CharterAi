interface ChatToggleButtonProps {
  isOpen: boolean
  onClick: () => void
}

export function ChatToggleButton({ isOpen, onClick }: ChatToggleButtonProps) {
  return (
    <button
      type="button"
      className={`chat-toggle ${isOpen ? 'chat-toggle--active' : ''}`}
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      title="Toggle Chat"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M6 18 L11 14 L16 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
