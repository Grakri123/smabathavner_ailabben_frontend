import React, { useEffect, useState } from 'react';
import { X, User, Bot, Clock, Mail, Calendar, MessageSquare, ExternalLink } from 'lucide-react';
import { contactService } from '../../utils/contactService';
import type { KlvarmeContact } from '../../types/blog';

interface ChatSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  contactData?: {
    customer_name: string;
    customer_email: string;
    created_at: Date;
    message_count: number;
    session_duration: number;
    end_reason: string;
  };
}

const ChatSessionModal: React.FC<ChatSessionModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  contactData
}) => {
  const [contact, setContact] = useState<KlvarmeContact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load full contact data when modal opens
  useEffect(() => {
    if (isOpen && sessionId) {
      loadContactData();
    }
  }, [isOpen, sessionId]);

  const loadContactData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contactData = await contactService.getContactBySessionId(sessionId);
      setContact(contactData);
      
    } catch (err) {
      console.error('Error loading contact data:', err);
      setError('Kunne ikke laste samtaledata');
    } finally {
      setIsLoading(false);
    }
  };

  const parseConversationHistory = (conversationHistory: any) => {
    try {
      if (Array.isArray(conversationHistory)) {
        return conversationHistory;
      }
      if (typeof conversationHistory === 'string') {
        return JSON.parse(conversationHistory);
      }
      return [];
    } catch (error) {
      console.error('Error parsing conversation history:', error);
      return [];
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Ukjent';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('no-NO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (endReason?: string) => {
    switch (endReason) {
      case 'contact_collected':
        return 'text-green-600 bg-green-100';
      case 'timeout':
        return 'text-yellow-600 bg-yellow-100';
      case 'user_left':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusText = (endReason?: string) => {
    switch (endReason) {
      case 'contact_collected':
        return 'Kontakt samlet inn';
      case 'timeout':
        return 'Timeout';
      case 'user_left':
        return 'Bruker forlot';
      default:
        return 'Ukjent';
    }
  };

  if (!isOpen) return null;

  const messages = contact ? parseConversationHistory(contact.conversation_history) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] mx-4 rounded-lg shadow-xl overflow-hidden"
        style={{ 
          backgroundColor: 'rgb(var(--card))',
          border: '1px solid rgb(var(--border))'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'rgb(var(--border))' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--foreground))' }}>
                {contactData?.customer_name || contact?.customer_name || 'Ukjent kunde'}
              </h2>
              <p className="text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>
                {contactData?.customer_email || contact?.customer_email || 'Ukjent e-post'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: 'rgb(var(--muted-foreground))' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[70vh]">
          {/* Session Info */}
          <div 
            className="p-6 border-b bg-gray-50"
            style={{ 
              backgroundColor: 'rgb(var(--muted))',
              borderColor: 'rgb(var(--border))'
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} style={{ color: 'rgb(var(--muted-foreground))' }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Opprettet
                  </p>
                  <p className="text-sm" style={{ color: 'rgb(var(--foreground))' }}>
                    {contactData?.created_at.toLocaleDateString('no-NO') || 
                     (contact?.created_at ? new Date(contact.created_at).toLocaleDateString('no-NO') : 'Ukjent')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MessageSquare size={16} style={{ color: 'rgb(var(--muted-foreground))' }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Meldinger
                  </p>
                  <p className="text-sm" style={{ color: 'rgb(var(--foreground))' }}>
                    {contactData?.message_count || messages.length}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock size={16} style={{ color: 'rgb(var(--muted-foreground))' }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Varighet
                  </p>
                  <p className="text-sm" style={{ color: 'rgb(var(--foreground))' }}>
                    {formatDuration(contactData?.session_duration || contact?.session_duration)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <div>
                  <p className="text-xs font-medium" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Status
                  </p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contactData?.end_reason || contact?.end_reason)}`}>
                    {getStatusText(contactData?.end_reason || contact?.end_reason)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p style={{ color: 'rgb(var(--muted-foreground))' }}>Laster samtale...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-red-600">
                  <p>{error}</p>
                  <button 
                    onClick={loadContactData}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Prøv igjen
                  </button>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Ingen meldinger funnet i denne samtalen</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message: any, index: number) => {
                  const isUser = message.role === 'user' || message.type === 'human';
                  const content = message.content || message.message || '';
                  const timestamp = message.timestamp || new Date().toISOString();
                  
                  return (
                    <div key={index} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isUser ? 'bg-blue-500' : 'bg-gray-500'
                      }`}>
                        {isUser ? (
                          <User size={16} className="text-white" />
                        ) : (
                          <Bot size={16} className="text-white" />
                        )}
                      </div>
                      
                      {/* Message */}
                      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
                        <div 
                          className={`rounded-lg px-4 py-3 ${
                            isUser 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}
                          style={!isUser ? {
                            backgroundColor: 'rgb(var(--muted))',
                            color: 'rgb(var(--foreground))'
                          } : {}}
                        >
                          <p className="whitespace-pre-wrap">{content}</p>
                        </div>
                        
                        <div className={`text-xs mt-1 ${isUser ? 'text-right' : 'text-left'}`} style={{ color: 'rgb(var(--muted-foreground))' }}>
                          {formatTimestamp(timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div 
            className="p-6 border-t flex items-center justify-between"
            style={{ borderColor: 'rgb(var(--border))' }}
          >
            <div className="text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>
              Session ID: {sessionId.substring(0, 20)}...
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // TODO: Implement export functionality
                  console.log('Export conversation');
                }}
                className="px-4 py-2 rounded-lg border transition-colors"
                style={{ 
                  borderColor: 'rgb(var(--border))',
                  color: 'rgb(var(--foreground))'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ExternalLink size={16} className="inline mr-2" />
                Eksporter
              </button>
              
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-white transition-colors"
                style={{ backgroundColor: 'rgb(var(--orange-primary))' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(var(--orange-600))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(var(--orange-primary))';
                }}
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSessionModal;
