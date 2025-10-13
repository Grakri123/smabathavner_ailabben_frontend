import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ConnectionStatus from './ConnectionStatus';
import { Loader2 } from 'lucide-react';

const ChatArea: React.FC = () => {
  const { getMessagesForAgent, activeAgentId, agents, isLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentAgent = agents.find(agent => agent.id === activeAgentId);
  const messages = getMessagesForAgent(activeAgentId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages Area - directly on background */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-black mb-4">
              Hei! Jeg er {currentAgent?.name || 'AI-agenten'} din
            </h1>
            <p className="text-xl text-black max-w-2xl mx-auto">
              {currentAgent?.description || 'Jeg er her for å hjelpe deg. Still meg et spørsmål eller be om hjelp!'}
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-black">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">{currentAgent?.name} tenker...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input Container - only input has container */}
      <div className="px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl shadow-lg p-4" style={{ backgroundColor: 'rgb(var(--background))', border: '1px solid rgb(var(--border))' }}>
            <ChatInput />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;