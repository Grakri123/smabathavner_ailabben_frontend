import React, { useEffect, useState } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';
import type { Document } from '../../types/database';
import { secureDownloadService } from '../../utils/secureDownloadService';

interface PreviewModalProps {
  document: Document;
  onClose: () => void;
  onDownload: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ document, onClose, onDownload }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileExtension = document.file_name.split('.').pop()?.toLowerCase() || '';
  const isPreviewable = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
  const isPDF = fileExtension === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);

  useEffect(() => {
    if (isPreviewable) {
      loadPreview();
    } else {
      setLoading(false);
    }
  }, [document.id]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👁️ Loading preview for:', document.file_name);
      const url = await secureDownloadService.generatePreviewUrl(document.id);
      
      if (!url) {
        throw new Error('Failed to generate preview URL');
      }
      
      setPreviewUrl(url);
      console.log('✅ Preview URL loaded');
    } catch (err) {
      console.error('❌ Error loading preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadClick = () => {
    onDownload();
    // Don't close modal immediately, let user see download is in progress
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'rgb(var(--card))' }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgb(var(--border))' }}
        >
          <div className="flex-1 min-w-0 pr-4">
            <h2 
              className="text-xl font-semibold truncate"
              style={{ color: 'rgb(var(--foreground))' }}
            >
              {document.file_name}
            </h2>
            <p 
              className="text-sm mt-1"
              style={{ color: 'rgb(var(--muted-foreground))' }}
            >
              {document.customer_name} • {new Date(document.created_at).toLocaleDateString('nb-NO')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Download Button */}
            <button
              onClick={handleDownloadClick}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
              style={{
                backgroundColor: 'rgb(var(--orange-primary))',
                color: 'white'
              }}
            >
              <Download size={16} />
              Last Ned
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ 
                color: 'rgb(var(--muted-foreground))',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4"
                  style={{ borderColor: 'rgb(var(--orange-primary))' }}
                />
                <p style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Laster forhåndsvisning...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div 
              className="flex items-start gap-3 p-4 rounded-lg border"
              style={{ 
                backgroundColor: 'rgb(var(--orange-100))',
                borderColor: 'rgb(var(--orange-primary))',
                color: 'rgb(var(--orange-primary))'
              }}
            >
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Kunne ikke laste forhåndsvisning</p>
                <p className="text-sm mt-1 opacity-90">{error}</p>
                <button
                  onClick={handleDownloadClick}
                  className="mt-3 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  style={{
                    backgroundColor: 'rgb(var(--orange-primary))',
                    color: 'white'
                  }}
                >
                  Last ned filen i stedet
                </button>
              </div>
            </div>
          )}

          {!loading && !error && !isPreviewable && (
            <div 
              className="flex flex-col items-center justify-center h-full text-center p-8 rounded-lg border-2 border-dashed"
              style={{ borderColor: 'rgb(var(--border))' }}
            >
              <AlertCircle size={48} className="mb-4" style={{ color: 'rgb(var(--muted-foreground))' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--foreground))' }}>
                Forhåndsvisning ikke tilgjengelig
              </h3>
              <p className="mb-6" style={{ color: 'rgb(var(--muted-foreground))' }}>
                Filtypen <code className="px-2 py-1 rounded" style={{ backgroundColor: 'rgb(var(--muted))' }}>
                  .{fileExtension}
                </code> støtter ikke forhåndsvisning i nettleseren.
              </p>
              <button
                onClick={handleDownloadClick}
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                style={{
                  backgroundColor: 'rgb(var(--orange-primary))',
                  color: 'white'
                }}
              >
                <Download size={18} />
                Last ned for å åpne
              </button>
              {fileExtension === 'msg' && (
                <p className="mt-4 text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  .msg-filer må åpnes i Microsoft Outlook
                </p>
              )}
            </div>
          )}

          {!loading && !error && previewUrl && isPDF && (
            <div className="w-full h-full flex items-center justify-center">
              <iframe
                src={previewUrl}
                className="w-full rounded-lg border"
                style={{ 
                  borderColor: 'rgb(var(--border))',
                  height: 'calc(100vh - 200px)', // Dynamic height based on viewport
                  minHeight: '700px', // Increased minimum height
                  maxHeight: '80vh' // Maximum height to prevent overflow
                }}
                title={`Preview: ${document.file_name}`}
              />
            </div>
          )}

          {!loading && !error && previewUrl && isImage && (
            <div className="flex items-center justify-center">
              <img
                src={previewUrl}
                alt={document.file_name}
                className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
                style={{ objectFit: 'contain' }}
              />
            </div>
          )}
        </div>

        {/* Footer with Document Info */}
        <div 
          className="px-6 py-4 border-t"
          style={{ 
            borderColor: 'rgb(var(--border))',
            backgroundColor: 'rgb(var(--muted))'
          }}
        >
          <div className="flex items-center justify-between text-sm flex-wrap gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span style={{ color: 'rgb(var(--muted-foreground))' }}>
                <strong>Kunde:</strong> {document.customer_name || 'Ukjent'}
              </span>
              {document.opplastnings_metode && (
                <span style={{ color: 'rgb(var(--muted-foreground))' }}>
                  <strong>Metode:</strong> {document.opplastnings_metode}
                </span>
              )}
            </div>
            <span style={{ color: 'rgb(var(--muted-foreground))' }}>
              Opprettet: {document.createdate ? new Date(document.createdate).toLocaleString('nb-NO') : 'Ukjent'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;

