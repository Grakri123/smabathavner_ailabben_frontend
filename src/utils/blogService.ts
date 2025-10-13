import { supabase } from '../store/authStore';
import type { BlogPost, PaginatedResponse, ImageUploadResult, ImageUploadError } from '../types/blog';

// Blog service for blogginnlegg table
class BlogService {
  private tableName = 'blogginnlegg';

  async getAll(
    page = 1,
    pageSize = 10,
    filters: Record<string, any> = {},
    sortBy = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<BlogPost>> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact' });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'publisert' && typeof value === 'boolean') {
          query = query.eq(key, value);
        } else if (key === 'tittel' || key === 'ingress') {
          query = query.ilike(key, `%${value}%`);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    // Apply sorting and pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (error) throw error;

    return {
      data: data as BlogPost[],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  async getById(id: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as BlogPost;
  }

  async create(post: Partial<BlogPost>): Promise<BlogPost> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(post)
      .select()
      .single();

    if (error) throw error;
    return data as BlogPost;
  }

  async update(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as BlogPost;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Bulk operations
  async bulkUpdate(ids: string[], updates: Partial<BlogPost>): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .in('id', ids)
      .select();

    if (error) throw error;
    return data as BlogPost[];
  }

  // Blog-specific methods
  async getPublished(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('publisert', true)
      .order('dato', { ascending: false });

    if (error) throw error;
    return data as BlogPost[];
  }

  async getDrafts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('publisert', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as BlogPost[];
  }

  async publish(id: string): Promise<BlogPost> {
    return this.update(id, { publisert: true });
  }

  async unpublish(id: string): Promise<BlogPost> {
    return this.update(id, { publisert: false });
  }

  async getBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as BlogPost;
  }

  // Real-time subscription
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel(`${this.tableName}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: this.tableName },
        callback
      )
      .subscribe();
  }

  // Image upload methods
  async uploadImage(file: File, postId?: string): Promise<ImageUploadResult> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = postId ? `posts/${postId}/${fileName}` : `uploads/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(data.path);

      return {
        url: publicUrl,
        path: data.path,
        name: fileName,
        size: file.size
      };
    } catch (error) {
      console.error('Failed to upload image:', error);
      const uploadError: ImageUploadError = {
        message: error instanceof Error ? error.message : 'Failed to upload image',
        file,
        code: 'UPLOAD_ERROR'
      };
      throw uploadError;
    }
  }

  async uploadMultipleImages(files: File[], postId?: string): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];
    const errors: ImageUploadError[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadImage(file, postId);
        results.push(result);
      } catch (error) {
        errors.push(error as ImageUploadError);
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw errors[0]; // Throw first error if no uploads succeeded
    }

    return results;
  }

  async deleteImage(imagePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('blog-images')
      .remove([imagePath]);

    if (error) throw error;
  }

  async updatePostImages(postId: string, featuredImage?: string | null, imageGallery?: string[]): Promise<BlogPost> {
    const updates: Partial<BlogPost> = {};
    
    if (featuredImage !== undefined) {
      updates.featured_image = featuredImage || undefined; // Convert null to undefined for Supabase
    }
    
    if (imageGallery !== undefined) {
      updates.image_gallery = imageGallery;
    }

    console.log('blogService.updatePostImages called with:', {
      postId,
      featuredImage,
      imageGallery,
      updates
    });

    const result = await this.update(postId, updates);
    console.log('blogService.updatePostImages result:', result);
    
    return result;
  }

  // Helper method to get optimized image URL with transformations
  getOptimizedImageUrl(imageUrl: string, width?: number, height?: number, quality: number = 80): string {
    if (!imageUrl.includes('supabase')) return imageUrl;
    
    const url = new URL(imageUrl);
    const params = new URLSearchParams();
    
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    params.append('quality', quality.toString());
    
    if (params.toString()) {
      url.search = params.toString();
    }
    
    return url.toString();
  }
}

export const blogService = new BlogService();
export default blogService;