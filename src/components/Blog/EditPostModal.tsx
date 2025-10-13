import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Blogginnlegg } from '../../types/blog';
import ImageUpload from './ImageUpload';

interface EditPostModalProps {
  post: Blogginnlegg | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPost: Blogginnlegg) => Promise<void>;
  onImageChange?: () => void; // Callback for when images are changed
}

const EditPostModal: React.FC<EditPostModalProps> = ({ post, isOpen, onClose, onSave, onImageChange }) => {
  const [formData, setFormData] = useState<Blogginnlegg | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when post changes
  useEffect(() => {
    if (post) {
      setFormData({ ...post });
      setErrors({});
    }
  }, [post]);

  if (!isOpen || !post || !formData) {
    return null;
  }

  const handleInputChange = (field: keyof Blogginnlegg, value: string | boolean | string[]) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => prev ? { ...prev, image_gallery: images } : null);
    // Trigger refresh of parent component (BlogManager)
    if (onImageChange) {
      onImageChange();
    }
  };

  const handleFeaturedImageChange = (imageUrl: string | null) => {
    setFormData(prev => prev ? { ...prev, featured_image: imageUrl || undefined } : null);
    // Trigger refresh of parent component (BlogManager)
    if (onImageChange) {
      onImageChange();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData?.tittel?.trim()) {
      newErrors.tittel = 'Tittel er påkrevd';
    }
    if (!formData?.slug?.trim()) {
      newErrors.slug = 'Slug er påkrevd';
    }
    if (!formData?.ingress?.trim()) {
      newErrors.ingress = 'Ingress er påkrevd';
    }
    if (!formData?.innhold_md?.trim()) {
      newErrors.innhold_md = 'Innhold er påkrevd';
    }
    if (!formData?.dato) {
      newErrors.dato = 'Dato er påkrevd';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!formData || !validateForm()) return;

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Feil ved lagring:', error);
      setErrors({ general: 'Kunne ikke lagre innlegget. Prøv igjen.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="w-full h-full sm:rounded-lg sm:shadow-xl sm:w-full sm:max-w-4xl sm:max-h-[90vh] overflow-hidden flex flex-col" style={{ backgroundColor: 'rgb(var(--background))', border: '1px solid rgb(var(--border))' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 sticky top-0 z-10" style={{ backgroundColor: 'rgb(var(--background))', borderBottom: '1px solid rgb(var(--border))' }}>
          <h2 className="text-lg sm:text-xl font-semibold heading" style={{ color: 'rgb(var(--foreground))' }}>Rediger Blogginnlegg</h2>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="p-1 rounded transition-all duration-200 disabled:opacity-50"
            style={{ color: 'rgb(var(--muted-foreground))' }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
                e.currentTarget.style.color = 'rgb(var(--foreground))';
              }
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
          {errors.general && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgb(var(--orange-100))', border: '1px solid rgb(var(--orange-primary))', color: 'rgb(var(--orange-primary))' }}>
              {errors.general}
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Tittel */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--foreground))' }}>
                Tittel *
              </label>
              <input
                type="text"
                value={formData.tittel}
                onChange={(e) => handleInputChange('tittel', e.target.value)}
                className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all duration-200"
                style={{ 
                  backgroundColor: 'rgb(var(--background))',
                  border: errors.tittel ? '1px solid rgb(var(--orange-primary))' : '1px solid rgb(var(--border))',
                  color: 'rgb(var(--foreground))'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgb(var(--orange-primary))';
                  e.target.style.boxShadow = '0 0 0 2px rgba(249, 115, 22, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.tittel ? 'rgb(var(--orange-primary))' : 'rgb(var(--border))';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Skriv inn tittel..."
              />
              {errors.tittel && (
                <p className="mt-1 text-sm" style={{ color: 'rgb(var(--orange-primary))' }}>{errors.tittel}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--foreground))' }}>
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all duration-200"
                style={{ 
                  backgroundColor: 'rgb(var(--background))',
                  border: errors.slug ? '1px solid rgb(var(--orange-primary))' : '1px solid rgb(var(--border))',
                  color: 'rgb(var(--foreground))'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgb(var(--orange-primary))';
                  e.target.style.boxShadow = '0 0 0 2px rgba(249, 115, 22, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.slug ? 'rgb(var(--orange-primary))' : 'rgb(var(--border))';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="url-vennlig-slug"
              />
              {errors.slug && (
                <p className="mt-1 text-sm" style={{ color: 'rgb(var(--orange-primary))' }}>{errors.slug}</p>
              )}
            </div>

            {/* Ingress */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--foreground))' }}>
                Ingress *
              </label>
              <textarea
                value={formData.ingress}
                onChange={(e) => handleInputChange('ingress', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg focus:outline-none resize-none transition-all duration-200"
                style={{ 
                  backgroundColor: 'rgb(var(--background))',
                  border: errors.ingress ? '1px solid rgb(var(--orange-primary))' : '1px solid rgb(var(--border))',
                  color: 'rgb(var(--foreground))'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgb(var(--orange-primary))';
                  e.target.style.boxShadow = '0 0 0 2px rgba(249, 115, 22, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.ingress ? 'rgb(var(--orange-primary))' : 'rgb(var(--border))';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Kort beskrivelse av innlegget..."
              />
              {errors.ingress && (
                <p className="mt-1 text-sm" style={{ color: 'rgb(var(--orange-primary))' }}>{errors.ingress}</p>
              )}
            </div>

            {/* Bilder */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--foreground))' }}>
                Bilder
              </label>
              <ImageUpload
                postId={formData.id}
                existingImages={formData.image_gallery || []}
                onImagesChange={handleImagesChange}
                onFeaturedImageChange={handleFeaturedImageChange}
                featuredImage={formData.featured_image || null}
                maxFiles={10}
                maxFileSize={5}
              />
            </div>

            {/* Innhold (Markdown) */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--foreground))' }}>
                Innhold (Markdown) *
              </label>
              <textarea
                value={formData.innhold_md}
                onChange={(e) => handleInputChange('innhold_md', e.target.value)}
                rows={12}
                className="w-full px-3 py-2 rounded-lg focus:outline-none font-mono text-sm resize-none transition-all duration-200"
                style={{ 
                  backgroundColor: 'rgb(var(--background))',
                  border: errors.innhold_md ? '1px solid rgb(var(--orange-primary))' : '1px solid rgb(var(--border))',
                  color: 'rgb(var(--foreground))'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgb(var(--orange-primary))';
                  e.target.style.boxShadow = '0 0 0 2px rgba(249, 115, 22, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.innhold_md ? 'rgb(var(--orange-primary))' : 'rgb(var(--border))';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="# Overskrift

Skriv ditt innhold i Markdown format...

## Underoverskrift

- Liste punkt 1
- Liste punkt 2

**Fet tekst** og *kursiv tekst*

![Bilde beskrivelse](bilde-url) - Kopier URL fra bildene ovenfor"
              />
              {errors.innhold_md && (
                <p className="mt-1 text-sm" style={{ color: 'rgb(var(--orange-primary))' }}>{errors.innhold_md}</p>
              )}
              <p className="mt-1 text-xs" style={{ color: 'rgb(var(--muted-foreground))' }}>
                💡 Tips: Last opp bilder først, deretter kopier URL-en og lim inn i Markdown-innholdet
              </p>
            </div>

            {/* Dato og Publisert */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--foreground))' }}>
                  Dato *
                </label>
                <input
                  type="date"
                  value={formData.dato}
                  onChange={(e) => handleInputChange('dato', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none text-sm sm:text-base transition-all duration-200"
                  style={{ 
                    backgroundColor: 'rgb(var(--background))',
                    border: errors.dato ? '1px solid rgb(var(--orange-primary))' : '1px solid rgb(var(--border))',
                    color: 'rgb(var(--foreground))'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgb(var(--orange-primary))';
                    e.target.style.boxShadow = '0 0 0 2px rgba(249, 115, 22, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.dato ? 'rgb(var(--orange-primary))' : 'rgb(var(--border))';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.dato && (
                  <p className="mt-1 text-sm" style={{ color: 'rgb(var(--orange-primary))' }}>{errors.dato}</p>
                )}
              </div>

              <div className="flex items-center sm:items-start sm:pt-8">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.publisert}
                    onChange={(e) => handleInputChange('publisert', e.target.checked)}
                    className="w-4 h-4 rounded transition-colors"
                    style={{ 
                      accentColor: 'rgb(var(--orange-primary))',
                      borderColor: 'rgb(var(--border))'
                    }}
                  />
                  <span className="text-sm font-medium" style={{ color: 'rgb(var(--foreground))' }}>Publisert</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 sm:gap-4 p-4 sm:p-6 sticky bottom-0" style={{ borderTop: '1px solid rgb(var(--border))', backgroundColor: 'rgb(var(--muted))' }}>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg disabled:opacity-50 text-sm sm:text-base order-2 sm:order-1 transition-all duration-200"
            style={{ 
              backgroundColor: 'rgb(var(--background))',
              color: 'rgb(var(--muted-foreground))',
              border: '1px solid rgb(var(--border))'
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(var(--background))';
            }}
          >
            Lukk
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center space-x-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 text-sm sm:text-base order-1 sm:order-2 transition-all duration-200"
            style={{ backgroundColor: 'rgb(var(--orange-primary))' }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = 'rgb(var(--orange-600))';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = 'rgb(var(--orange-primary))';
              }
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Lagrer...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Lagre</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;