import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import ChatMessage from '../ChatMessage';
import ChatInput from '../ChatInput';
import ConnectionStatus from '../ConnectionStatus';
// import { crmService } from '../../utils/supabase';
import { 
  Loader2, 
  UserPlus, 
  ClipboardList, 
 
  AlertTriangle,
  ExternalLink 
} from 'lucide-react';

const EnhancedChatArea: React.FC = () => {
  const { getMessagesForAgent, activeAgentId, agents, isLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showCrmActions, setShowCrmActions] = useState(false);
  const [leadData, setLeadData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });
  
  const currentAgent = agents.find(agent => agent.id === activeAgentId);
  const messages = getMessagesForAgent(activeAgentId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if conversation should be escalated to CRM
  useEffect(() => {
    const shouldShowCrmActions = messages.length >= 3 && 
      messages.some(msg => 
        msg.role === 'user' && 
        (msg.content.includes('@') || // Email mentioned
         msg.content.includes('kontakt') || 
         msg.content.includes('tilbud') ||
         msg.content.includes('pris'))
      );
    
    setShowCrmActions(shouldShowCrmActions);
  }, [messages]);

  const handleCreateLead = async () => {
    try {
      // TODO: Implement with blog service when needed
      alert('Lead-funksjonalitet kommer snart!');
      setShowCrmActions(false);
    } catch (error) {
      console.error('Failed to create lead:', error);
      alert('Feil ved opprettelse av lead');
    }
  };

  const handleCreateTask = async () => {
    try {
      // TODO: Implement task creation when needed
      alert('Oppgave-funksjonalitet kommer snart!');
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Feil ved opprettelse av oppgave');
    }
  };



  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b bg-white px-6 py-4" style={{ borderColor: 'rgb(var(--border))' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentAgent?.color || 'bg-gray-500'}`}>
              {currentAgent?.icon || '🤖'}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {currentAgent?.name || 'AI Agent'}
              </h1>
              <p className="text-sm text-black">
                {currentAgent?.description || 'AI-assistent'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            {messages.length > 0 && (
              <button
                onClick={() => setShowCrmActions(!showCrmActions)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
              >
                CRM Handlinger
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CRM Actions Panel */}
      {showCrmActions && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">
                Denne samtalen kan være interessant for CRM
              </span>
            </div>
            <button
              onClick={() => setShowCrmActions(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          </div>
          
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-md border">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <UserPlus size={14} />
                Opprett Lead
              </h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Navn"
                  value={leadData.name}
                  onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="email"
                  placeholder="E-post"
                  value={leadData.email}
                  onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <button
                  onClick={handleCreateLead}
                  className="w-full px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Opprett Lead
                </button>
              </div>
            </div>

            <div className="bg-white p-3 rounded-md border">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <ClipboardList size={14} />
                Opprett Oppgave
              </h4>
              <p className="text-xs text-black mb-2">
                Lag en oppfølgingsoppgave basert på denne samtalen
              </p>
              <button
                onClick={handleCreateTask}
                className="w-full px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Opprett Oppgave
              </button>
            </div>


          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${currentAgent?.color || 'bg-gray-500'}`}>
                {currentAgent?.icon || '🤖'}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Hei! Jeg er {currentAgent?.name || 'AI-agenten'} din
              </h3>
              <p className="text-black max-w-md mx-auto mb-4">
                {currentAgent?.description || 'Jeg er her for å hjelpe deg. Still meg et spørsmål eller be om hjelp!'}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="font-medium text-blue-900 mb-2">💡 Tips:</h4>
                <ul className="text-sm text-blue-800 text-left space-y-1">
                  <li>• Jeg kan automatisk foreslå CRM-handlinger</li>
                  <li>• Komplekse oppgaver kan eskaleres til CRM</li>
                  <li>• All chat-historikk kan kobles til leads</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-black">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">{currentAgent?.name} tenker...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Chat Input */}
      <ChatInput />
    </div>
  );
};

export default EnhancedChatArea;