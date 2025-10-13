import React, { useState, useEffect } from 'react';
import { MessageSquare, User, Bot, Clock, Search, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { contactService } from '../../utils/contactService';
import ChatSessionModal from './ChatSessionModal';
import type { ContactSession } from '../../types/blog';

const ChatManager: React.FC = () => {
  const [sessions, setSessions] = useState<ContactSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('alle');
  const [selectedSession, setSelectedSession] = useState<ContactSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    aktiv: 0,
    avsluttet: 0,
    venter_svar: 0,
  });

  // Load contacts from Supabase
  const loadContacts = async (page = 1, search = searchTerm, status = statusFilter) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Loading contacts:', { page, search, status });
      
      const result = await contactService.getAllContacts(page, 10, search, status);
      
      console.log('✅ Contacts loaded successfully:', result);
      
      setSessions(result.data);
      setTotalPages(result.totalPages);
      setCurrentPage(page);
      
    } catch (err) {
      console.error('❌ Error loading contacts:', err);
      setError('Kunne ikke laste kontaktdata. Prøv igjen senere.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const statsData = await contactService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadContacts(1, searchTerm, statusFilter);
    loadStats();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '' || statusFilter !== 'alle') {
        loadContacts(1, searchTerm, statusFilter);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const handleViewChat = (session: ContactSession) => {
    setSelectedSession(session);
    setIsModalOpen(true);
    console.log('Opening chat session:', session.id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  const handleRefresh = () => {
    loadContacts(currentPage, searchTerm, statusFilter);
    loadStats();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      loadContacts(newPage, searchTerm, statusFilter);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6" style={{ maxWidth: 'var(--container-max-width)', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold heading" style={{ color: 'rgb(var(--foreground))' }}>Chat Manager</h1>
          <p className="text-sm sm:text-base" style={{ color: 'rgb(var(--muted-foreground))' }}>Administrer chat-samtaler og følg opp brukerinteraksjoner</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ 
              backgroundColor: 'rgb(var(--card))', 
              border: '1px solid rgb(var(--border))',
              color: 'rgb(var(--foreground))'
            }}
            title="Oppdater data"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg p-4 bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">{error}</span>
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
              <MessageSquare className="w-4 h-4 text-blue-600" />
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
              <User className="w-4 h-4 text-green-600" />
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
              <p className="text-sm font-medium ">Venter</p>
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
              <Bot className="w-4 h-4 text-gray-600" />
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
              placeholder="Søk etter bruker eller melding..."
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
              <option value="aktiv">Aktive</option>
              <option value="venter_svar">Venter svar</option>
              <option value="avsluttet">Avsluttet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chat Sessions Table */}
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
                  Bruker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Meldinger
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Siste melding
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Tidspunkt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody style={{ borderColor: 'rgb(var(--border))' }}>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <RefreshCw className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
                    <h3 className="mt-2 text-sm font-medium ">Laster kontaktdata...</h3>
                    <p className="mt-1 text-sm ">
                      Henter data fra Supabase...
                    </p>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium ">Ingen kontakter funnet</h3>
                    <p className="mt-1 text-sm ">
                      Prøv å justere søkekriteriene dine eller opprett nye kontakter.
                    </p>
                  </td>
                </tr>
              ) : (
                sessions.map((session, index) => (
                  <tr key={session.id} className="transition-colors"
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
                        <div className="text-sm font-medium truncate">{session.customer_name}</div>
                        <div className="text-xs mt-2" style={{ color: 'rgb(var(--muted-foreground))' }}>
                          {session.customer_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'aktiv' 
                          ? 'bg-green-100 text-green-800' 
                          : session.status === 'venter_svar'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status === 'aktiv' ? 'Aktiv' : session.status === 'venter_svar' ? 'Venter svar' : 'Avsluttet'}
                      </span>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium ">{session.message_count}</span>
                        <span className="text-xs  ml-1">meldinger</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm ">
                      <div className="max-w-xs truncate" title={session.last_message}>
                        {session.last_message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm ">
                      <div>{session.created_at.toLocaleDateString('no-NO')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewChat(session)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Se chat"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="text-xs sm:text-sm  order-2 sm:order-1">
          Viser {sessions.length} kontakter (side {currentPage} av {totalPages})
        </div>
        <div className="flex justify-center sm:justify-end space-x-1 sm:space-x-2 order-1 sm:order-2">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
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
          
          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = Math.max(1, currentPage - 2) + i;
            if (pageNum > totalPages) return null;
            
            return (
              <button 
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-colors ${
                  pageNum === currentPage 
                    ? 'text-white' 
                    : 'text-gray-700'
                }`}
                style={{ 
                  backgroundColor: pageNum === currentPage ? 'rgb(var(--orange-primary))' : 'transparent',
                  border: pageNum === currentPage ? 'none' : '1px solid rgb(var(--border))',
                  color: pageNum === currentPage ? 'white' : 'rgb(var(--foreground))'
                }}
                onMouseEnter={(e) => {
                  if (pageNum !== currentPage) {
                    e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pageNum !== currentPage) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}>
                {pageNum}
              </button>
            );
          })}
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
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

      {/* Chat Session Modal */}
      {selectedSession && (
        <ChatSessionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          sessionId={selectedSession.session_id}
          contactData={{
            customer_name: selectedSession.customer_name,
            customer_email: selectedSession.customer_email,
            created_at: selectedSession.created_at,
            message_count: selectedSession.message_count,
            session_duration: selectedSession.session_duration,
            end_reason: selectedSession.end_reason
          }}
        />
      )}
    </div>
  );
};

export default ChatManager;
