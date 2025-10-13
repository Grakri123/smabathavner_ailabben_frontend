import React, { createContext, useContext, useState, ReactNode } from 'react';
import { n8nApi } from '../utils/n8nApi';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentId: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  n8nEndpoint?: string;
}

// Agent configuration with n8n webhooks
const agents: Agent[] = [
  {
    id: 'main-assistant',
    name: 'Hovedassistent',
    description: 'Smart orkester som koordinerer alle dine AI-agenter',
    icon: '🎯',
    color: 'bg-purple-500',
    n8nEndpoint: '376118ea-b971-4c3a-9b38-564426cb0d41' // n8n AI assistant webhook
  },
  {
    id: 'seo-agent',
    name: 'SEO Agent',
    description: 'Administrer blogginnlegg og SEO-innhold',
    icon: '🔍',
    color: 'bg-green-500',
    n8nEndpoint: undefined // SEO Agent har ikke chat-funksjonalitet
  },
  {
    id: 'chat-agent',
    name: 'Chat Agent',
    description: 'Administrer chat-samtaler og kommunikasjon',
    icon: '💬',
    color: 'bg-blue-500',
    n8nEndpoint: undefined // Chat Agent har ikke chat-funksjonalitet
  },
  {
    id: 'email-agent',
    name: 'Epost Agent',
    description: 'Administrer innkommende e-poster og generer svar-utkast',
    icon: '📧',
    color: 'bg-indigo-500',
    n8nEndpoint: undefined // Email Agent har ikke chat-funksjonalitet
  },
  {
    id: 'database-agent',
    name: 'Database Søk',
    description: 'Søk etter kunder og dokumenter i databasen',
    icon: '🗄️',
    color: 'bg-teal-500',
    n8nEndpoint: undefined // Database Agent har ikke chat-funksjonalitet
  }
];

interface ChatState {
  messages: Message[];
  activeAgentId: string;
  isLoading: boolean;
  agents: Agent[];
}

interface ChatContextType extends ChatState {
  sendMessage: (content: string) => Promise<void>;
  setActiveAgent: (agentId: string) => void;
  clearMessages: () => void;
  getMessagesForAgent: (agentId: string) => Message[];
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    activeAgentId: 'main-assistant',
    isLoading: false,
    agents: agents,
  });

  const sendMessage = async (content: string) => {
    const activeAgent = state.agents.find(agent => agent.id === state.activeAgentId);
    if (!activeAgent?.n8nEndpoint) {
      console.error('No n8n endpoint configured for agent:', state.activeAgentId);
      return;
    }
    
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      agentId: state.activeAgentId
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true
    }));

    // Send message to n8n webhook
    try {
      console.log('ChatStore: Sending message to agent:', { agentId: state.activeAgentId, endpoint: activeAgent.n8nEndpoint });
      
      const response = await n8nApi.sendMessage(activeAgent.n8nEndpoint, content);
      
      console.log('ChatStore: Received response:', response);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        agentId: state.activeAgentId
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false
      }));
      
      console.log('ChatStore: Message sent successfully');
      
    } catch (error) {
      console.error('ChatStore: Error sending message to n8n:', error);
      
      // Add error message to chat with more helpful information
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `❌ **Feil**: ${error instanceof Error ? error.message : 'Kunne ikke koble til AI-agenten. Prøv igjen senere.'}\n\n*Tip: Sjekk at n8n workflow er aktiv og at internett-tilkoblingen fungerer.*`,
        timestamp: new Date(),
        agentId: state.activeAgentId
      };
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false
      }));
    }
  };

  const setActiveAgent = (agentId: string) => {
    setState(prev => ({ ...prev, activeAgentId: agentId }));
  };

  const clearMessages = () => {
    setState(prev => ({ ...prev, messages: [] }));
  };

  const getMessagesForAgent = (agentId: string) => {
    return state.messages.filter(message => message.agentId === agentId);
  };

  const value: ChatContextType = {
    ...state,
    sendMessage,
    setActiveAgent,
    clearMessages,
    getMessagesForAgent,
  };

  return React.createElement(ChatContext.Provider, { value }, children);
};

export const useChatStore = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatStore must be used within a ChatProvider');
  }
  return context;
};