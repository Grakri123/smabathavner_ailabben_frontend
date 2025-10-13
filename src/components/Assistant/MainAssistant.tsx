import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import ChatMessage from '../ChatMessage';



const MainAssistant: React.FC = () => {
  const { sendMessage, getMessagesForAgent, isLoading, activeAgentId } = useChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const messages = getMessagesForAgent(activeAgentId);

  // Auto-scroll til bunnen når nye meldinger kommer
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-fokus på input når komponenten lastes og etter sending
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    // Fokus når komponenten lastes
    focusInput();
    
    // Fokus når messages endres (ny melding sendt/mottatt)
    const timeoutId = setTimeout(focusInput, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Fokus når loading stopper
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const message = input;
    setInput('');
    
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };



  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-8">
              <h1 className="logo-text text-6xl sm:text-7xl font-black mb-6" style={{ 
                fontWeight: '950', 
                textShadow: '0 0 1px currentColor', 
                color: 'rgb(var(--foreground))' 
              }}>
                AI LABBEN
              </h1>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'rgb(var(--foreground))' }}>
              Hei! Jeg er AI Labben sin chatbot
            </h2>
            <p className="text-xl max-w-2xl mx-auto mb-6" style={{ color: 'rgb(var(--foreground))' }}>
              Spør meg om hva som helst og jeg vil hjelpe deg!
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border" 
                    style={{ 
                      backgroundColor: 'rgb(var(--message-background))', 
                      borderColor: 'rgb(var(--message-border))',
                      color: 'rgb(var(--foreground))'
                    }}>
                    <Bot size={16} />
                  </div>
                  <div className="flex-1 min-w-0 max-w-[80%]">
                    <div className="rounded-lg px-4 py-3 shadow-sm" 
                      style={{ 
                        backgroundColor: 'rgb(var(--message-background))', 
                        border: '1px solid rgb(var(--message-border))' 
                      }}>
                      <div className="flex items-center gap-1">
                        <div className="typing-animation">
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input Container */}
      <div className="px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl shadow-lg p-4" 
            style={{ 
              backgroundColor: 'rgb(var(--card))', 
              border: '1px solid rgb(var(--border))' 
            }}>
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Spør AI Labben om hva som helst..."
                className="flex-1 resize-none border-0 focus:ring-0 focus:outline-none bg-transparent"
                style={{ 
                  minHeight: '24px', 
                  maxHeight: '120px',
                  color: 'rgb(var(--foreground))'
                }}
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: input.trim() && !isLoading ? 'rgb(var(--orange-primary))' : 'transparent',
                  color: input.trim() && !isLoading ? 'white' : 'rgb(var(--muted-foreground))'
                }}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainAssistant;
