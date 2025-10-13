import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

const ChatInput: React.FC = () => {
  const [input, setInput] = useState('');
  const { sendMessage, isLoading } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
    
    // Reset textarea høyde etter sending
    if (textareaRef.current) {
      textareaRef.current.style.height = '52px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea - dynamisk høyde basert på innhold
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset høyde for å få riktig scrollHeight
      textarea.style.height = 'auto';
      
      // Beregn ny høyde basert på innhold
      const newHeight = Math.min(
        Math.max(textarea.scrollHeight, 52), // Minimum høyde (52px = ca 1 linje)
        200 // Maksimum høyde (200px = ca 7-8 linjer)
      );
      
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skriv en melding..."
            disabled={isLoading}
            className="w-full resize-none rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              minHeight: '52px', 
              maxHeight: '200px',
              border: '1px solid rgb(var(--border))',
              backgroundColor: 'rgb(var(--background))',
              color: 'rgb(var(--foreground))',
              transition: 'height 0.1s ease-out'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgb(var(--orange-primary))';
              e.target.style.boxShadow = '0 0 0 2px rgba(249, 115, 22, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgb(var(--border))';
              e.target.style.boxShadow = 'none';
            }}
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 rounded-md p-2 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            style={{ 
              backgroundColor: 'rgb(var(--orange-primary))',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(var(--orange-600))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(var(--orange-primary))';
            }}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
      <div className="mt-2 text-xs text-center" style={{ color: 'rgb(var(--muted-foreground))' }}>
        Trykk Enter for å sende, Shift+Enter for ny linje
      </div>
    </form>
  );
};

export default ChatInput;