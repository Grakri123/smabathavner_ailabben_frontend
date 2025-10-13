import React, { useState } from 'react';
import { Search, Filter, Plus, AlertCircle, Clock, CheckCircle2, X, Eye } from 'lucide-react';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'ny' | 'under_behandling' | 'løst' | 'lukket';
  priority: 'lav' | 'medium' | 'høy' | 'kritisk';
  category: 'teknisk' | 'funksjonalitet' | 'bug' | 'forbedring';
  created_at: Date;
  updated_at: Date;
  user_email: string;
  assigned_to?: string;
}

const SupportManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('alle');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Dummy data for support tickets
  const [tickets] = useState<SupportTicket[]>([
    {
      id: '1',
      title: 'Chat Agent svarer ikke',
      description: 'Når jeg prøver å chatte med Chat Agent får jeg ingen respons. Dette har skjedd de siste 2 dagene.',
      status: 'ny',
      priority: 'høy',
      category: 'teknisk',
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15'),
      user_email: 'bruker1@example.com'
    },
    {
      id: '2',
      title: 'Kan ikke eksportere blogginnlegg',
      description: 'Eksporter-knappen i blogginnlegg siden virker ikke. Får feilmelding når jeg klikker.',
      status: 'under_behandling',
      priority: 'medium',
      category: 'bug',
      created_at: new Date('2024-01-14'),
      updated_at: new Date('2024-01-16'),
      user_email: 'bruker2@example.com',
      assigned_to: 'Support Team'
    },
    {
      id: '3',
      title: 'Forslag: Mørk modus',
      description: 'Det ville vært flott med en mørk modus for bedre brukervennlighet på kveldstid.',
      status: 'løst',
      priority: 'lav',
      category: 'forbedring',
      created_at: new Date('2024-01-10'),
      updated_at: new Date('2024-01-12'),
      user_email: 'bruker3@example.com',
      assigned_to: 'Design Team'
    },
    {
      id: '4',
      title: 'SEO Agent gir feil råd',
      description: 'SEO Agent foreslår keywords som ikke passer til vår bransje. Kan dette justeres?',
      status: 'under_behandling',
      priority: 'medium',
      category: 'funksjonalitet',
      created_at: new Date('2024-01-13'),
      updated_at: new Date('2024-01-16'),
      user_email: 'bruker4@example.com',
      assigned_to: 'AI Team'
    },
    {
      id: '5',
      title: 'Systemet krasjer ved opplasting',
      description: 'Hver gang jeg prøver å laste opp bilder til blogginnlegg krasjer hele systemet.',
      status: 'ny',
      priority: 'kritisk',
      category: 'bug',
      created_at: new Date('2024-01-16'),
      updated_at: new Date('2024-01-16'),
      user_email: 'bruker5@example.com'
    }
  ]);

  const getStatusColor = (status: string) => {
    // Return empty string since we'll use inline styles
    return '';
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ny': return { backgroundColor: 'rgb(var(--blue-100))', color: 'rgb(var(--blue-800))' };
      case 'under_behandling': return { backgroundColor: 'rgb(var(--yellow-100))', color: 'rgb(var(--yellow-800))' };
      case 'løst': return { backgroundColor: 'rgb(var(--green-100))', color: 'rgb(var(--green-800))' };
      case 'lukket': return { backgroundColor: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))' };
      default: return { backgroundColor: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))' };
    }
  };

  const getPriorityColor = (priority: string) => {
    // Return empty string since we'll use inline styles
    return '';
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'kritisk': return { backgroundColor: 'rgb(var(--red-100))', color: 'rgb(var(--red-800))' };
      case 'høy': return { backgroundColor: 'rgb(var(--orange-100))', color: 'rgb(var(--orange-800))' };
      case 'medium': return { backgroundColor: 'rgb(var(--blue-100))', color: 'rgb(var(--blue-800))' };
      case 'lav': return { backgroundColor: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))' };
      default: return { backgroundColor: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ny': return <AlertCircle size={16} />;
      case 'under_behandling': return <Clock size={16} />;
      case 'løst': return <CheckCircle2 size={16} />;
      case 'lukket': return <X size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'alle' || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tickets.length,
    aktiv: tickets.filter(t => t.status === 'ny' || t.status === 'under_behandling').length,
    venter: tickets.filter(t => t.status === 'under_behandling').length,
    fullført: tickets.filter(t => t.status === 'løst' || t.status === 'lukket').length,
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6" style={{ maxWidth: 'var(--container-max-width)', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold heading" style={{ color: 'rgb(var(--foreground))' }}>Support Manager</h1>
          <p className="text-sm sm:text-base" style={{ color: 'rgb(var(--muted-foreground))' }}>Administrer og følg opp support-henvendelser</p>
        </div>
      </div>

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
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--blue-100))' }}>
              <AlertCircle className="w-4 h-4" style={{ color: 'rgb(var(--blue-600))' }} />
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
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--green-100))' }}>
              <AlertCircle className="w-4 h-4" style={{ color: 'rgb(var(--green-600))' }} />
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
              <p className="text-2xl font-bold ">{stats.venter}</p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--yellow-100))' }}>
              <Clock className="w-4 h-4" style={{ color: 'rgb(var(--yellow-600))' }} />
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
              <p className="text-sm font-medium ">Fullført</p>
              <p className="text-2xl font-bold ">{stats.fullført}</p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--muted))' }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: 'rgb(var(--muted-foreground))' }} />
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
                backgroundColor: 'rgb(var(--background))',
                color: 'rgb(var(--foreground))',
                border: '1px solid rgb(var(--border))'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <select
              className="px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ 
                backgroundColor: 'rgb(var(--background))',
                color: 'rgb(var(--foreground))',
                border: '1px solid rgb(var(--border))'
              }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="alle">Alle statuser</option>
              <option value="ny">Ny</option>
              <option value="under_behandling">Under behandling</option>
              <option value="løst">Løst</option>
              <option value="lukket">Lukket</option>
            </select>
          </div>
        </div>
      </div>

      {/* Support Tickets Table */}
      <div className="rounded-lg shadow-sm overflow-hidden" 
        style={{ 
          backgroundColor: 'rgb(var(--card))', 
          border: '1px solid rgb(var(--border))' 
        }}>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
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
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Tidspunkt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className=" divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}>
                  <td className="px-6 py-6">
                    <div>
                      <div className="text-sm font-medium truncate">{ticket.title}</div>
                      <div className="text-sm truncate" style={{ color: 'rgb(var(--muted-foreground))' }}>{ticket.user_email}</div>
                      <div className="text-xs mt-2" style={{ color: 'rgb(var(--muted-foreground))' }}>
                        {ticket.description.substring(0, 50)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium" style={getStatusStyle(ticket.status)}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium">1</span>
                      <span className="text-xs ml-1" style={{ color: 'rgb(var(--muted-foreground))' }}>meldinger</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap text-sm capitalize">
                    {ticket.category}
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap text-sm">
                    <div>{ticket.created_at.toLocaleDateString('no-NO')}</div>
                    <div className="text-xs mt-1" style={{ color: 'rgb(var(--muted-foreground))' }}>
                      {ticket.created_at.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="transition-colors"
                        style={{ color: 'rgb(var(--orange-primary))' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'rgb(var(--orange-600))';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgb(var(--orange-primary))';
                        }}
                        title="Se sak"
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

        {filteredTickets.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12" style={{ color: 'rgb(var(--muted-foreground))' }} />
            <h3 className="mt-2 text-sm font-medium ">Ingen saker funnet</h3>
            <p className="mt-1 text-sm ">
              Prøv å justere søkekriteriene dine.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="text-xs sm:text-sm  order-2 sm:order-1">
          Viser {filteredTickets.length} av {tickets.length} saker
        </div>
        <div className="flex justify-center sm:justify-end space-x-1 sm:space-x-2 order-1 sm:order-2">
          <button className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-colors" 
            style={{ 
              border: '1px solid rgb(var(--border))', 
              color: 'rgb(var(--foreground))' 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}>
            <span className="hidden sm:inline">Forrige</span>
            <span className="sm:hidden">‹</span>
          </button>
          <button className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md" style={{ backgroundColor: 'rgb(var(--orange-primary))', color: 'white' }}>
            1
          </button>
          <button className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-colors" 
            style={{ 
              border: '1px solid rgb(var(--border))', 
              color: 'rgb(var(--foreground))' 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
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

export default SupportManager;
