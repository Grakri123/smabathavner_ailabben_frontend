import React, { useState, useEffect } from 'react';
import { Search, Database, FileText, Users, Eye, RefreshCw, AlertCircle, FolderOpen, Download } from 'lucide-react';
import { databaseSearchService } from '../../utils/databaseSearchService';
import { secureDownloadService } from '../../utils/secureDownloadService';
import type { Customer, Document, SearchStats } from '../../types/database';
import DocumentDetailsModal from './DocumentDetailsModal';
import PreviewModal from './PreviewModal';
import CustomerAutocomplete from './CustomerAutocomplete';

type SearchTab = 'customers' | 'documents';

const DatabaseSearchManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SearchTab>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<Customer | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<SearchStats>({
    totalCustomers: 0,
    totalDocuments: 0,
    recentUploads: 0,
    searchResults: 0
  });

  // Load initial data
  useEffect(() => {
    loadStats();
    loadAllCustomers();
    if (activeTab === 'customers') {
      searchCustomers(1);
    } else {
      searchDocuments(1);
    }
  }, []);

  // Search when tab changes
  useEffect(() => {
    setSearchTerm('');
    setSelectedCustomerFilter(null);
    setCurrentPage(1);
    if (activeTab === 'customers') {
      searchCustomers(1);
    } else {
      searchDocuments(1);
    }
  }, [activeTab]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === 'customers') {
        searchCustomers(1);
      } else {
        searchDocuments(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCustomerFilter]);

  const loadStats = async () => {
    try {
      const statsData = await databaseSearchService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadAllCustomers = async () => {
    try {
      setLoadingCustomers(true);
      console.log('🔄 Loading all customers for autocomplete...');
      const customersList = await databaseSearchService.getAllCustomers();
      console.log('✅ Loaded customers for autocomplete:', customersList.length, 'customers');
      console.log('📋 Customer names:', customersList.map(c => c.name).slice(0, 10));
      setAllCustomers(customersList);
    } catch (err) {
      console.error('❌ Error loading customers list:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const searchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await databaseSearchService.searchCustomers(
        searchTerm,
        page,
        10
      );
      
      setCustomers(response.data);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
      setStats(prev => ({ ...prev, searchResults: response.count }));
    } catch (err) {
      console.error('Error searching customers:', err);
      setError('Kunne ikke søke i kunder. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  const searchDocuments = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await databaseSearchService.searchDocuments(
        searchTerm,
        selectedCustomerFilter?.id || undefined,
        page,
        10
      );
      
      setDocuments(response.data);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
      setStats(prev => ({ ...prev, searchResults: response.count }));
    } catch (err) {
      console.error('Error searching documents:', err);
      setError('Kunne ikke søke i dokumenter. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStats();
    if (activeTab === 'customers') {
      searchCustomers(currentPage);
    } else {
      searchDocuments(currentPage);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (activeTab === 'customers') {
      searchCustomers(newPage);
    } else {
      searchDocuments(newPage);
    }
  };

  const handleViewCustomerDocuments = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedCustomerFilter(customer);
    setActiveTab('documents');
  };

  const handleCustomerFilterChange = (customer: Customer | null) => {
    setSelectedCustomerFilter(customer);
    setCurrentPage(1);
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      console.log('📥 Starting secure download for:', document.file_name);
      
      // Show loading state (optional)
      const success = await secureDownloadService.downloadDocument(document.id);
      
      if (success) {
        console.log('✅ Download initiated successfully');
        // Optional: Show success message
      } else {
        console.error('❌ Download failed');
        setError('Kunne ikke laste ned dokumentet. Prøv igjen.');
      }
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      setError('Feil ved nedlasting av dokument. Prøv igjen.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6" style={{ maxWidth: 'var(--container-max-width)', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold heading" style={{ color: 'rgb(var(--foreground))' }}>
            Database Søk
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'rgb(var(--muted-foreground))' }}>
            Søk etter kunder og dokumenter i databasen
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'rgb(var(--orange-primary))', color: 'white' }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = 'rgb(var(--orange-600))';
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
            <h3 className="font-medium text-red-800">Feil ved søk</h3>
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
              <p className="text-sm font-medium">Totalt Kunder</p>
              <p className="text-2xl font-bold">{stats.totalCustomers}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
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
              <p className="text-sm font-medium">Totalt Dokumenter</p>
              <p className="text-2xl font-bold">{stats.totalDocuments}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-green-600" />
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
              <p className="text-sm font-medium">Siste 30 dager</p>
              <p className="text-2xl font-bold">{stats.recentUploads}</p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Database className="w-4 h-4 text-yellow-600" />
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
              <p className="text-sm font-medium">Søkeresultater</p>
              <p className="text-2xl font-bold">{stats.searchResults}</p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Tabs */}
      <div className="rounded-lg shadow-sm" 
        style={{ 
          backgroundColor: 'rgb(var(--card))', 
          border: '1px solid rgb(var(--border))' 
        }}>
        <div className="flex border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'customers' ? 'border-b-2' : ''
            }`}
            style={activeTab === 'customers' 
              ? { 
                  borderColor: 'rgb(var(--orange-primary))', 
                  color: 'rgb(var(--orange-primary))' 
                } 
              : { 
                  color: 'rgb(var(--muted-foreground))' 
                }
            }
          >
            <Users className="w-4 h-4 inline mr-2" />
            Kunder
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'documents' ? 'border-b-2' : ''
            }`}
            style={activeTab === 'documents' 
              ? { 
                  borderColor: 'rgb(var(--orange-primary))', 
                  color: 'rgb(var(--orange-primary))' 
                } 
              : { 
                  color: 'rgb(var(--muted-foreground))' 
                }
            }
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Dokumenter
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={activeTab === 'customers' ? 'Søk etter kundenavn eller nummer...' : 'Søk i dokumentnavn...'}
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
            
            {activeTab === 'documents' && (
              <div className="w-full sm:w-auto sm:min-w-[300px]">
                <CustomerAutocomplete
                  customers={allCustomers}
                  selectedCustomer={selectedCustomerFilter}
                  onSelect={handleCustomerFilterChange}
                  placeholder="Filtrer på kunde..."
                  isLoading={loadingCustomers}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-lg shadow-sm overflow-hidden" 
        style={{ 
          backgroundColor: 'rgb(var(--card))', 
          border: '1px solid rgb(var(--border))' 
        }}>
        <div className="overflow-x-auto">
          {activeTab === 'customers' ? (
            // Customers Table
            <table className="w-full table-fixed" style={{ borderColor: 'rgb(var(--border))' }}>
              <thead style={{ backgroundColor: 'rgb(var(--muted))' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/3" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Kundenavn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/4" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Kundenummer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/4" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Opprettet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody style={{ borderColor: 'rgb(var(--border))' }}>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'rgb(var(--orange-primary))' }}></div>
                        <span className="ml-2" style={{ color: 'rgb(var(--foreground))' }}>Laster...</span>
                      </div>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Users className="mx-auto h-12 w-12" style={{ color: 'rgb(var(--muted-foreground))' }} />
                      <h3 className="mt-2 text-sm font-medium" style={{ color: 'rgb(var(--foreground))' }}>
                        Ingen kunder funnet
                      </h3>
                      <p className="mt-1 text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>
                        Prøv et annet søk eller sjekk databasetilkoblingen.
                      </p>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer, index) => (
                    <tr key={customer.id} className="transition-colors"
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
                        <div className="text-sm font-medium">{customer.name}</div>
                      </td>
                      <td className="px-6 py-6 text-sm">
                        <div className="font-mono text-xs">{customer.customer_number || '-'}</div>
                      </td>
                      <td className="px-6 py-6 text-sm">
                        <div>{new Date(customer.created_at).toLocaleDateString('no-NO')}</div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewCustomerDocuments(customer)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Se dokumenter"
                          >
                            <FolderOpen size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            // Documents Table
            <table className="w-full table-fixed" style={{ borderColor: 'rgb(var(--border))' }}>
              <thead style={{ backgroundColor: 'rgb(var(--muted))' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/4" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Filnavn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/8" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Vår Ref
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/8" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Metode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/8" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Opprettet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/8" style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody style={{ borderColor: 'rgb(var(--border))' }}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'rgb(var(--orange-primary))' }}></div>
                        <span className="ml-2" style={{ color: 'rgb(var(--foreground))' }}>Laster...</span>
                      </div>
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FileText className="mx-auto h-12 w-12" style={{ color: 'rgb(var(--muted-foreground))' }} />
                      <h3 className="mt-2 text-sm font-medium" style={{ color: 'rgb(var(--foreground))' }}>
                        Ingen dokumenter funnet
                      </h3>
                      <p className="mt-1 text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>
                        {selectedCustomer 
                          ? `Ingen dokumenter funnet for ${selectedCustomer.name}`
                          : 'Prøv et annet søk eller sjekk databasetilkoblingen.'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  documents.map((document, index) => (
                    <tr key={document.id} className="transition-colors"
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
                        <div className="text-sm font-medium truncate" title={document.file_name}>
                          {document.file_name}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-sm">
                        <div className="truncate">{document.customer_name || '-'}</div>
                      </td>
                      <td className="px-6 py-6 text-sm">
                        <div className="font-mono text-xs truncate">{document.ourref || '-'}</div>
                      </td>
                      <td className="px-6 py-6 text-sm">
                        <div className="truncate">
                          {document.opplastnings_metode || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-sm">
                        <div>{document.createdate ? new Date(document.createdate).toLocaleDateString('no-NO') : '-'}</div>
                      </td>
                    <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setPreviewDocument(document)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Forhåndsvisning"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(document)}
                          className="text-green-600 hover:text-green-900"
                          title="Last ned dokument"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="text-xs sm:text-sm order-2 sm:order-1">
          Viser {activeTab === 'customers' ? customers.length : documents.length} resultater (side {currentPage} av {totalPages})
        </div>
        <div className="flex justify-center sm:justify-end space-x-1 sm:space-x-2 order-1 sm:order-2">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
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
          
          <button className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md" 
            style={{ backgroundColor: 'rgb(var(--orange-primary))', color: 'white' }}>
            {currentPage}
          </button>
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
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

      {/* Preview Modal */}
      {previewDocument && (
        <PreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
          onDownload={() => handleDownloadDocument(previewDocument)}
        />
      )}

      {/* Document Details Modal */}
      {selectedDocument && (
        <DocumentDetailsModal
          document={selectedDocument}
          isOpen={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
};

export default DatabaseSearchManager;

