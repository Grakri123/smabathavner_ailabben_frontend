import React, { useEffect, useState } from 'react';
import { X, FileText, Calendar, User, Hash, AlignLeft, Download } from 'lucide-react';
import { databaseSearchService } from '../../utils/databaseSearchService';
import { secureDownloadService } from '../../utils/secureDownloadService';
import type { Document, DocumentEmbedding } from '../../types/database';

interface DocumentDetailsModalProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentDetailsModal: React.FC<DocumentDetailsModalProps> = ({
  document,
  isOpen,
  onClose
}) => {
  const [embeddings, setEmbeddings] = useState<DocumentEmbedding[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isOpen && document) {
      loadEmbeddings(1);
    }
  }, [isOpen, document]);

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const loadEmbeddings = async (page: number) => {
    try {
      setLoading(true);
      const response = await databaseSearchService.getDocumentEmbeddings(
        document.id,
        page,
        10
      );
      setEmbeddings(response.data);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading embeddings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      console.log('📥 Downloading document from modal:', document.file_name);
      const success = await secureDownloadService.downloadDocument(document.id);
      
      if (success) {
        console.log('✅ Download initiated from modal');
      } else {
        console.error('❌ Download failed from modal');
        // Could show error message here
      }
    } catch (error) {
      console.error('❌ Error downloading from modal:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="w-full h-full sm:rounded-lg sm:shadow-xl sm:w-full sm:max-w-4xl sm:max-h-[90vh] overflow-hidden flex flex-col" 
        style={{ 
          backgroundColor: 'rgb(var(--background))', 
          border: '1px solid rgb(var(--border))' 
        }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 sticky top-0 z-10" 
          style={{ 
            backgroundColor: 'rgb(var(--background))', 
            borderBottom: '1px solid rgb(var(--border))' 
          }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" 
              style={{ backgroundColor: 'rgb(var(--muted))' }}>
              <FileText className="w-5 h-5" style={{ color: 'rgb(var(--foreground))' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold heading truncate" 
                style={{ color: 'rgb(var(--foreground))' }}>
                {document.file_name}
              </h2>
              <p className="text-sm truncate" style={{ color: 'rgb(var(--muted-foreground))' }}>
                Dokument detaljer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded transition-all duration-200 flex-shrink-0"
            style={{ color: 'rgb(var(--muted-foreground))' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
              e.currentTarget.style.color = 'rgb(var(--foreground))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgb(var(--muted-foreground))';
            }}
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Document Info */}
          <div className="rounded-lg p-4 mb-6" 
            style={{ 
              backgroundColor: 'rgb(var(--muted))', 
              border: '1px solid rgb(var(--border))' 
            }}>
            <h3 className="text-md font-medium mb-4 heading" 
              style={{ color: 'rgb(var(--foreground))' }}>
              Dokument Informasjon
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <FileText size={16} className="mt-1 flex-shrink-0" 
                  style={{ color: 'rgb(var(--muted-foreground))' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" 
                    style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Filnavn
                  </p>
                  <p className="text-sm break-words" 
                    style={{ color: 'rgb(var(--foreground))' }}>
                    {document.file_name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User size={16} className="mt-1 flex-shrink-0" 
                  style={{ color: 'rgb(var(--muted-foreground))' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" 
                    style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Kunde
                  </p>
                  <p className="text-sm break-words" 
                    style={{ color: 'rgb(var(--foreground))' }}>
                    {document.customer_name || 'Ikke tilknyttet'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash size={16} className="mt-1 flex-shrink-0" 
                  style={{ color: 'rgb(var(--muted-foreground))' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" 
                    style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Vår Referanse
                  </p>
                  <p className="text-sm font-mono break-words" 
                    style={{ color: 'rgb(var(--foreground))' }}>
                    {document.ourref || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText size={16} className="mt-1 flex-shrink-0" 
                  style={{ color: 'rgb(var(--muted-foreground))' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" 
                    style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Opplastningsmetode
                  </p>
                  <div className="flex flex-col gap-2">
                    {document.opplastnings_metode ? (
                      <span className="px-2 py-1 rounded text-xs" 
                        style={{ 
                          backgroundColor: 'rgb(var(--muted))',
                          color: 'rgb(var(--foreground))'
                        }}>
                        {document.opplastnings_metode}
                      </span>
                    ) : '-'}
                    {document.source && (
                      <span className="px-2 py-1 rounded text-xs" 
                        style={{ 
                          backgroundColor: document.source === 'documents_outlook' 
                            ? 'rgb(var(--blue-100))' 
                            : 'rgb(var(--green-100))',
                          color: document.source === 'documents_outlook' 
                            ? 'rgb(var(--blue-700))' 
                            : 'rgb(var(--green-700))'
                        }}>
                        Kilde: {document.source === 'documents_outlook' ? 'Outlook' : 'Standard'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={16} className="mt-1 flex-shrink-0" 
                  style={{ color: 'rgb(var(--muted-foreground))' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" 
                    style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Opprettet
                  </p>
                  <p className="text-sm" 
                    style={{ color: 'rgb(var(--foreground))' }}>
                    {document.createdate 
                      ? new Date(document.createdate).toLocaleDateString('no-NO')
                      : '-'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={16} className="mt-1 flex-shrink-0" 
                  style={{ color: 'rgb(var(--muted-foreground))' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" 
                    style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Sist Endret
                  </p>
                  <p className="text-sm" 
                    style={{ color: 'rgb(var(--foreground))' }}>
                    {document.editdate 
                      ? new Date(document.editdate).toLocaleDateString('no-NO')
                      : '-'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={16} className="mt-1 flex-shrink-0" 
                  style={{ color: 'rgb(var(--muted-foreground))' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" 
                    style={{ color: 'rgb(var(--muted-foreground))' }}>
                    Lastet Opp
                  </p>
                  <p className="text-sm" 
                    style={{ color: 'rgb(var(--foreground))' }}>
                    {document.uploaded_at 
                      ? new Date(document.uploaded_at).toLocaleDateString('no-NO')
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Document Chunks/Embeddings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium heading flex items-center gap-2" 
                style={{ color: 'rgb(var(--foreground))' }}>
                <AlignLeft size={16} />
                Dokument Innhold ({embeddings.length} av {totalPages * 10} chunks)
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
                  style={{ borderColor: 'rgb(var(--orange-primary))' }}></div>
                <span className="ml-2" style={{ color: 'rgb(var(--foreground))' }}>
                  Laster innhold...
                </span>
              </div>
            ) : embeddings.length === 0 ? (
              <div className="text-center py-12 rounded-lg" 
                style={{ backgroundColor: 'rgb(var(--muted))' }}>
                <AlignLeft className="mx-auto h-12 w-12 mb-2" 
                  style={{ color: 'rgb(var(--muted-foreground))' }} />
                <p className="text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Ingen tekstinnhold funnet for dette dokumentet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {embeddings.map((embedding, index) => (
                  <div key={embedding.id} 
                    className="rounded-lg p-4 border" 
                    style={{ 
                      backgroundColor: 'rgb(var(--card))', 
                      borderColor: 'rgb(var(--border))' 
                    }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-1 rounded" 
                        style={{ 
                          backgroundColor: 'rgb(var(--muted))',
                          color: 'rgb(var(--muted-foreground))'
                        }}>
                        Chunk {embedding.chunk_index !== null ? embedding.chunk_index + 1 : index + 1}
                      </span>
                      {embedding.similarity && (
                        <span className="text-xs" 
                          style={{ color: 'rgb(var(--muted-foreground))' }}>
                          Relevans: {(embedding.similarity * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed" 
                      style={{ color: 'rgb(var(--foreground))' }}>
                      {embedding.chunk_text}
                    </p>
                    {embedding.metadata && Object.keys(embedding.metadata).length > 0 && (
                      <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgb(var(--border))' }}>
                        <p className="text-xs font-medium mb-1" 
                          style={{ color: 'rgb(var(--muted-foreground))' }}>
                          Metadata:
                        </p>
                        <pre className="text-xs overflow-x-auto" 
                          style={{ color: 'rgb(var(--muted-foreground))' }}>
                          {JSON.stringify(embedding.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination for chunks */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button 
                  onClick={() => loadEmbeddings(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="px-3 py-2 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))' }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}>
                  Forrige
                </button>
                
                <span className="text-sm px-3 py-2" style={{ color: 'rgb(var(--foreground))' }}>
                  Side {currentPage} av {totalPages}
                </span>
                
                <button 
                  onClick={() => loadEmbeddings(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="px-3 py-2 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))' }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}>
                  Neste
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-6 sticky bottom-0" 
          style={{ 
            borderTop: '1px solid rgb(var(--border))', 
            backgroundColor: 'rgb(var(--muted))' 
          }}>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm sm:text-base transition-all duration-200"
            style={{ 
              backgroundColor: 'rgb(var(--green-600))',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(var(--green-700))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(var(--green-600))';
            }}
          >
            <Download size={16} />
            Last Ned
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm sm:text-base transition-all duration-200"
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
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailsModal;

