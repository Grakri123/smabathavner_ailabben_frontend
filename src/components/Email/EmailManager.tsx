import React, { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle2, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { chatService } from '../../utils/chatService';
import type { ChatConversation } from '../../types/blog';

// Remove local interfaces - we'll use the ones from chatService
// The ChatConversation interface from chatService will be used instead

const EmailManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('alle');
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    aktiv: 0,
    venter_svar: 0,
    avsluttet: 0,
  });

  // Load conversations from Supabase
  const loadConversations = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await chatService.getConversations(
        page,
        10, // pageSize
        searchTerm,
        statusFilter
      );
      
      console.log('📧 EmailManager: Received conversations:', {
        count: response.data.length,
        totalPages: response.totalPages,
        conversations: response.data.map(conv => ({
          session_id: conv.session_id.substring(0, 20) + '...',
          message_count: conv.message_count,
          subject: conv.subject || 'No subject',
          from: conv.from || 'No sender'
        }))
      });
      
      console.log('📧 EmailManager: Raw conversation objects:', response.data);
      
      setConversations(response.data);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
      
      // Load stats
      const statsData = await chatService.getStats();
      setStats(statsData);
      
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err instanceof Error ? err.message : 'Kunne ikke laste samtaler');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadConversations(1);
  }, [searchTerm, statusFilter]);

  // Real-time updates
  useEffect(() => {
    const subscription = chatService.subscribeToChanges((payload) => {
      console.log('🔄 Real-time update received:', payload);
      // Reload conversations when data changes
      loadConversations(currentPage);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentPage]);

  // Debug: Log when conversations state changes
  useEffect(() => {
    console.log('🎯 EmailManager: Conversations state updated:', {
      count: conversations.length,
      conversations: conversations.map(conv => ({
        session_id: conv.session_id.substring(0, 20) + '...',
        message_count: conv.message_count,
        subject: conv.subject
      }))
    });
  }, [conversations]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedConversation) {
        setSelectedConversation(null);
      }
    };

    if (selectedConversation) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [selectedConversation]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aktiv': return 'bg-green-100 text-green-800';
      case 'venter_svar': return 'bg-yellow-100 text-yellow-800';
      case 'avsluttet': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'kritisk': return 'bg-red-100 text-red-800';
      case 'høy': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'lav': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aktiv': return <Mail size={16} />;
      case 'venter_svar': return <Clock size={16} />;
      case 'avsluttet': return <CheckCircle2 size={16} />;
      default: return <Mail size={16} />;
    }
  };

  // Filtering is now handled by the service, so we use conversations directly
  const filteredConversations = conversations;



  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6" style={{ maxWidth: 'var(--container-max-width)', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold heading" style={{ color: 'rgb(var(--foreground))' }}>E-post Agent</h1>
          <p className="text-sm sm:text-base" style={{ color: 'rgb(var(--muted-foreground))' }}>Administrer innkommende e-poster og AI-genererte svar-utkast</p>
        </div>
        <button
          onClick={() => loadConversations(currentPage)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'rgb(var(--orange-primary))', color: 'white' }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = 'rgb(var(--orange-secondary))';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(var(--orange-primary))';
          }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Oppdater
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg p-4 bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="font-medium text-red-800">Feil ved lasting av data</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-lg p-4 shadow-sm" 
          style={{ 
            backgroundColor: 'rgb(var(--card))', 
            border: '1px solid rgb(var(--border))' 
          }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium ">Totalt</p>
              <p className="text-2xl font-bold ">{stats.total}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 shadow-sm" 
          style={{ 
            backgroundColor: 'rgb(var(--card))', 
            border: '1px solid rgb(var(--border))' 
          }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium ">Aktive</p>
              <p className="text-2xl font-bold ">{stats.aktiv}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 shadow-sm" 
          style={{ 
            backgroundColor: 'rgb(var(--card))', 
            border: '1px solid rgb(var(--border))' 
          }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium ">Venter svar</p>
              <p className="text-2xl font-bold ">{stats.venter_svar}</p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 shadow-sm" 
          style={{ 
            backgroundColor: 'rgb(var(--card))', 
            border: '1px solid rgb(var(--border))' 
          }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium ">Avsluttet</p>
              <p className="text-2xl font-bold ">{stats.avsluttet}</p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg p-3 sm:p-4 shadow-sm" 
        style={{ 
          backgroundColor: 'rgb(var(--card))', 
          border: '1px solid rgb(var(--border))' 
        }}>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Søk i samtaler (emne, avsender)..."
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ 
                border: '1px solid rgb(var(--border))',
                backgroundColor: 'rgb(var(--background))',
                color: 'rgb(var(--foreground))'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <select
              className="px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ 
                border: '1px solid rgb(var(--border))',
                backgroundColor: 'rgb(var(--background))',
                color: 'rgb(var(--foreground))'
              }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="alle">Alle statuser</option>
              <option value="aktiv">Aktiv</option>
              <option value="venter_svar">Venter svar</option>
              <option value="avsluttet">Avsluttet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Email Conversations Table */}
      <div className="rounded-lg shadow-sm overflow-hidden" 
        style={{ 
          backgroundColor: 'rgb(var(--card))', 
          border: '1px solid rgb(var(--border))' 
        }}>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed" style={{ borderColor: 'rgb(var(--border))' }}>
            <thead style={{ backgroundColor: 'rgb(var(--muted))' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/4" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Samtale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/5" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Meldinger
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/5" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Siste aktivitet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody style={{ borderColor: 'rgb(var(--border))' }}>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Laster samtaler...</p>
                  </td>
                </tr>
              ) : filteredConversations.map((conversation, index) => (
                <tr key={conversation.session_id} className="transition-colors"
                  style={{ 
                    borderTop: index > 0 ? `1px solid rgb(var(--border))` : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}>
                  <td className="px-6 py-6">
                    <div>
                      <div className="text-sm font-medium truncate">{conversation.subject || 'Ingen emne'}</div>
                      <div className="text-sm truncate" style={{ color: 'rgb(var(--muted-foreground))' }}>{conversation.from || 'Ukjent avsender'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                      {getStatusIcon(conversation.status)}
                      {conversation.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{conversation.message_count}</span>
                      <span className="text-xs ml-1" style={{ color: 'rgb(var(--muted-foreground))' }}>meldinger</span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'rgb(var(--muted-foreground))' }}>
                      {conversation.messages.filter(m => 
                        m.message.ai_generated || 
                        m.message.type === 'ai' || 
                        m.message.role === 'assistant'
                      ).length} AI-generert
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap text-sm">
                    <div>{conversation.last_activity.toLocaleDateString('no-NO')}</div>
                    <div className="text-xs mt-1" style={{ color: 'rgb(var(--muted-foreground))' }}>
                      {conversation.last_activity.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedConversation(conversation)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Se samtale"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredConversations.length === 0 && (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium ">Ingen samtaler funnet</h3>
            <p className="mt-1 text-sm ">
              Prøv å justere søkekriteriene dine.
            </p>
          </div>
        )}
      </div>

      {/* Conversation Details Modal */}
      {selectedConversation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedConversation(null)}
        >
          <div 
            className="rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ 
              backgroundColor: 'rgb(var(--card))', 
              border: '1px solid rgb(var(--border))' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium" style={{ color: 'rgb(var(--foreground))' }}>
                    {selectedConversation.subject || 'Ingen emne'}
                  </h3>
                  <p className="text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Fra: {selectedConversation.from || 'Ukjent avsender'}
                  </p>
                  <p className="text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Startet: {selectedConversation.started_at.toLocaleString('no-NO')} | 
                    Siste aktivitet: {selectedConversation.last_activity.toLocaleString('no-NO')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="rounded-full p-2 transition-colors"
                  style={{ color: 'rgb(var(--muted-foreground))' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
                    e.currentTarget.style.color = 'rgb(var(--foreground))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgb(var(--muted-foreground))';
                  }}
                  title="Lukk samtale"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <h4 className="text-md font-medium mb-4" style={{ color: 'rgb(var(--foreground))' }}>
                Samtalehistorikk ({selectedConversation.message_count} meldinger)
              </h4>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedConversation.messages.map((historyItem, index) => {
                  const message = historyItem.message;
                  // Normalize message format to handle both n8n and standard formats
                  const normalizedMsg = {
                    role: message.type ? (message.type === 'human' ? 'user' : 'assistant') : (message.role || 'user'),
                    content: message.content || '',
                    timestamp: message.timestamp || new Date().toISOString(),
                    from: message.from,
                    ai_generated: message.ai_generated || message.type === 'ai' || message.role === 'assistant'
                  };
                  
                  const isUserMessage = normalizedMsg.role === 'user';
                  
                  return (
                    <div 
                      key={historyItem.id} 
                      className={`p-4 rounded-lg border-l-4 ${
                        isUserMessage 
                          ? 'border-blue-500' 
                          : 'border-green-500'
                      }`}
                      style={{ 
                        backgroundColor: isUserMessage 
                          ? 'rgb(var(--muted))' 
                          : 'rgba(59, 130, 246, 0.1)' // Light blue tint for AI messages
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium" style={{ color: 'rgb(var(--foreground))' }}>
                          {normalizedMsg.from || (isUserMessage ? 'Bruker' : 'AI Assistent')}
                          {normalizedMsg.ai_generated && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              AI-generert
                            </span>
                          )}
                        </div>
                        <div className="text-xs" style={{ color: 'rgb(var(--muted-foreground))' }}>
                          {new Date(normalizedMsg.timestamp).toLocaleString('no-NO')}
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap" style={{ color: 'rgb(var(--foreground))' }}>
                        {normalizedMsg.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="text-xs sm:text-sm order-2 sm:order-1">
          Viser {filteredConversations.length} samtaler (side {currentPage} av {totalPages})
        </div>
        <div className="flex justify-center sm:justify-end space-x-1 sm:space-x-2 order-1 sm:order-2">
          <button 
            onClick={() => loadConversations(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50" 
            style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))' }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}>
            <span className="hidden sm:inline">Forrige</span>
            <span className="sm:hidden">‹</span>
          </button>
          <button className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md" style={{ backgroundColor: 'rgb(var(--orange-primary))', color: 'white' }}>
            {currentPage}
          </button>
          <button 
            onClick={() => loadConversations(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50" 
            style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))' }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}>
            <span className="hidden sm:inline">Neste</span>
            <span className="sm:hidden">›</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailManager;
