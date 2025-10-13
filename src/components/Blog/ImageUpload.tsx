import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';
import { blogService } from '../../utils/blogService';
import type { ImageUploadResult, ImageUploadError } from '../../types/blog';

interface ImageUploadProps {
  postId?: string;
  existingImages?: string[];
  onImagesChange: (images: string[]) => void;
  onFeaturedImageChange?: (imageUrl: string | null) => void;
  featuredImage?: string | null;
  maxFiles?: number;
  maxFileSize?: number; // in MB
}

interface UploadState {
  file: File;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
  url?: string;
  error?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  postId,
  existingImages = [],
  onImagesChange,
  onFeaturedImageChange,
  featuredImage,
  maxFiles = 10,
  maxFileSize = 5 // 5MB default
}) => {
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Don't include uploads in allImages since they get added to existingImages
  const allImages = existingImages;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Kun bildefiler er tillatt';
    }

    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Fil er for stor. Maks ${maxFileSize}MB tillatt`;
    }

    // Check if we're at max files
    if (existingImages.length >= maxFiles) {
      return `Maksimalt ${maxFiles} bilder tillatt`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<void> => {
    const uploadId = Date.now().toString();
    
    setUploads(prev => [...prev, {
      file,
      status: 'uploading'
    }]);

    try {
      const result: ImageUploadResult = await blogService.uploadImage(file, postId);
      
      setUploads(prev => prev.map(upload => 
        upload.file === file 
          ? { ...upload, status: 'completed', url: result.url }
          : upload
      ));

      // Update parent component with new images
      const newImages = [...existingImages, result.url];
      onImagesChange(newImages);

      // Set as featured image if it's the first one
      if (!featuredImage && onFeaturedImageChange) {
        onFeaturedImageChange(result.url);
      }

      // Remove completed upload from state after a delay to show success
      setTimeout(() => {
        setUploads(prev => prev.filter(upload => upload.file !== file));
      }, 2000);

    } catch (error) {
      const uploadError = error as ImageUploadError;
      setUploads(prev => prev.map(upload => 
        upload.file === file 
          ? { ...upload, status: 'error', error: uploadError.message }
          : upload
      ));
    }
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        alert(validationError);
        continue;
      }
      
      await uploadFile(file);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFiles(files);
    }
  }, [existingImages.length]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      await handleFiles(files);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    console.log('handleRemoveImage called with:', { imageUrl, postId, existingImages });
    try {
      // Extract path from URL for deletion
      const urlParts = imageUrl.split('/');
      const pathIndex = urlParts.findIndex(part => part === 'blog-images');
      if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
        const imagePath = urlParts.slice(pathIndex + 1).join('/');
        await blogService.deleteImage(imagePath);
      }
      
      // Update existing images
      const newImages = existingImages.filter(img => img !== imageUrl);
      onImagesChange(newImages);
      
      // Update featured image if it was removed
      const newFeaturedImage = featuredImage === imageUrl ? null : featuredImage;
      if (featuredImage === imageUrl && onFeaturedImageChange) {
        onFeaturedImageChange(null);
      }
      
      // IMMEDIATELY update database if we have a postId
      if (postId) {
        console.log('Updating database with:', {
          postId,
          featuredImage: newFeaturedImage,
          imageGallery: newImages
        });
        
        await blogService.updatePostImages(
          postId, 
          newFeaturedImage,  // Pass null directly
          newImages
        );
        
        console.log('Database updated successfully');
      }
      
      // Remove from uploads if it's there
      setUploads(prev => prev.filter(upload => upload.url !== imageUrl));
      
    } catch (error) {
      console.error('Failed to remove image:', error);
      alert('Kunne ikke slette bildet. Prøv igjen.');
    }
  };

  const handleSetFeaturedImage = (imageUrl: string) => {
    if (onFeaturedImageChange) {
      onFeaturedImageChange(imageUrl === featuredImage ? null : imageUrl);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors touch-manipulation"
        style={{
          borderColor: isDragOver ? 'rgb(var(--orange-primary))' : 'rgb(var(--border))',
          backgroundColor: isDragOver ? 'rgb(var(--muted))' : 'transparent'
        }}
        onMouseEnter={(e) => {
          if (!isDragOver) {
            e.currentTarget.style.borderColor = 'rgb(var(--muted-foreground))';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragOver) {
            e.currentTarget.style.borderColor = 'rgb(var(--border))';
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-2 sm:space-y-3">
          <Upload className="h-8 w-8 sm:h-12 sm:w-12" style={{ color: 'rgb(var(--muted-foreground))' }} />
          <div>
            <p className="text-base sm:text-lg font-medium" style={{ color: 'rgb(var(--foreground))' }}>
              <span className="hidden sm:inline">Dra og slipp bilder her</span>
              <span className="sm:hidden">Last opp bilder</span>
            </p>
            <p className="text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>
              <span className="hidden sm:inline">eller </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-medium touch-manipulation min-h-[44px] px-2 py-1 -mx-2 -my-1 rounded transition-colors"
                style={{ color: 'rgb(var(--orange-primary))' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgb(var(--orange-600))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgb(var(--orange-primary))';
                }}
              >
                velg filer
              </button>
            </p>
          </div>
          <p className="text-xs" style={{ color: 'rgb(var(--muted-foreground))' }}>
            PNG, JPG, WebP opptil {maxFileSize}MB
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> </span>
            ({maxFiles - existingImages.length} igjen)
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {uploads.some(u => u.status === 'uploading') && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Laster opp...</h4>
          {uploads.filter(u => u.status === 'uploading').map((upload, index) => (
            <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">{upload.file.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error Messages */}
      {uploads.some(u => u.status === 'error') && (
        <div className="space-y-2">
          {uploads.filter(u => u.status === 'error').map((upload, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">
                {upload.file.name}: {upload.error}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Image Gallery */}
      {existingImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Bilder ({existingImages.length})
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {existingImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`Bilde ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Featured Badge */}
                  {featuredImage === imageUrl && (
                    <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-blue-600 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium">
                      <span className="hidden sm:inline">Hovedbilde</span>
                      <span className="sm:hidden">★</span>
                    </div>
                  )}
                  
                  {/* Mobile Actions - Always visible */}
                  <div className="sm:hidden absolute bottom-1 right-1 flex space-x-1">
                    {onFeaturedImageChange && (
                      <button
                        onClick={() => handleSetFeaturedImage(imageUrl)}
                        className="p-1.5 bg-white bg-opacity-90 rounded-full touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title={featuredImage === imageUrl ? 'Fjern som hovedbilde' : 'Sett som hovedbilde'}
                      >
                        {featuredImage === imageUrl ? (
                          <Check className="h-4 w-4 text-blue-600" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-gray-600" />
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRemoveImage(imageUrl)}
                      className="p-1.5 bg-white bg-opacity-90 rounded-full touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Slett bilde"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                  
                  {/* Desktop Actions - Hover overlay */}
                  <div className="hidden sm:block absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                      {onFeaturedImageChange && (
                        <button
                          onClick={() => handleSetFeaturedImage(imageUrl)}
                          className="p-2 rounded-full transition-colors"
                        style={{ backgroundColor: 'rgb(var(--background))' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgb(var(--background))';
                        }}
                          title={featuredImage === imageUrl ? 'Fjern som hovedbilde' : 'Sett som hovedbilde'}
                        >
                          {featuredImage === imageUrl ? (
                            <Check className="h-4 w-4" style={{ color: 'rgb(var(--orange-primary))' }} />
                          ) : (
                            <ImageIcon className="h-4 w-4" style={{ color: 'rgb(var(--muted-foreground))' }} />
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleRemoveImage(imageUrl)}
                        className="p-2 rounded-full transition-colors"
                        style={{ backgroundColor: 'rgb(var(--background))' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgb(var(--orange-100))';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgb(var(--background))';
                        }}
                        title="Slett bilde"
                      >
                        <X className="h-4 w-4" style={{ color: 'rgb(var(--orange-primary))' }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
