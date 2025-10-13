import React, { useState, useEffect } from 'react';
import { FileText, Edit } from 'lucide-react';
import { blogService } from '../../utils/blogService';
import type { BlogPost, TableColumn, FilterOption, Blogginnlegg } from '../../types/blog';
import EditPostModal from './EditPostModal';

const BlogManager: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 1
  });
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' as const });
  
  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const result = await blogService.getAll(
        pagination.page,
        pagination.pageSize,
        filters,
        sortConfig.key,
        sortConfig.direction
      );
      
      setPosts(result.data);
      setPagination(prev => ({
        ...prev,
        totalPages: result.totalPages
      }));
    } catch (error) {
      console.error('Failed to load blog posts:', error);
      // Set empty posts array to show "no posts" state instead of crashing
      setPosts([]);
      setPagination(prev => ({
        ...prev,
        totalPages: 1
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [pagination.page, filters, sortConfig]);

  const handleUpdate = async (id: string, field: string, value: any) => {
    try {
      await blogService.update(id, { [field]: value });
      loadPosts();
    } catch (error) {
      console.error('Failed to update blog post:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Er du sikker på at du vil slette dette blogginnlegget?')) {
      try {
        await blogService.delete(id);
        loadPosts();
      } catch (error) {
        console.error('Failed to delete blog post:', error);
      }
    }
  };


  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setEditModalOpen(true);
  };

  const handleSavePost = async (updatedPost: Blogginnlegg) => {
    try {
      await blogService.update(updatedPost.id, updatedPost);
      await loadPosts(); // Reload posts to reflect changes
    } catch (error) {
      console.error('Failed to update blog post:', error);
      throw error;
    }
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setSelectedPost(null);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleFilter = (newFilters: Record<string, any>) => {
    // Convert string 'true'/'false' to boolean for publisert filter
    if (newFilters.publisert === 'true') {
      newFilters.publisert = true;
    } else if (newFilters.publisert === 'false') {
      newFilters.publisert = false;
    }
    
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key: column, direction });
  };

  const publishedCount = posts.filter(p => p.publisert).length;
  const draftCount = posts.filter(p => !p.publisert).length;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6" style={{ maxWidth: 'var(--container-max-width)', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold heading" style={{ color: 'rgb(var(--foreground))' }}>Blog Manager</h1>
          <p className="text-sm sm:text-base" style={{ color: 'rgb(var(--muted-foreground))' }}>Administrer og publiser blogginnlegg</p>
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
              <p className="text-2xl font-bold ">{posts.length}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
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
              <p className="text-sm font-medium ">Publisert</p>
              <p className="text-2xl font-bold ">{publishedCount}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="w-4 h-4 text-green-600">✓</span>
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
              <p className="text-sm font-medium ">Utkast</p>
              <p className="text-2xl font-bold ">{draftCount}</p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Edit className="w-4 h-4 text-yellow-600" />
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
              <p className="text-sm font-medium ">Denne mnd</p>
              <p className="text-2xl font-bold ">
                {posts.filter(p => {
                  const postDate = new Date(p.created_at);
                  const now = new Date();
                  return postDate.getMonth() === now.getMonth() && 
                         postDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="w-4 h-4 text-sm" style={{ color: 'rgb(var(--gray-600))' }}>📅</span>
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
              placeholder="Søk i tittel..."
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ 
                border: '1px solid rgb(var(--border))',
                backgroundColor: 'rgb(var(--background))',
                color: 'rgb(var(--foreground))'
              }}
              onChange={(e) => handleFilter({ ...filters, tittel: e.target.value })}
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
              value={filters.publisert === true ? 'true' : filters.publisert === false ? 'false' : ''}
              onChange={(e) => handleFilter({ ...filters, publisert: e.target.value })}
            >
              <option value="">Alle</option>
              <option value="true">Publisert</option>
              <option value="false">Utkast</option>
            </select>
          </div>
        </div>
      </div>

      {/* Blog Posts Table */}
      <div className="rounded-lg shadow-sm overflow-hidden" 
        style={{ 
          backgroundColor: 'rgb(var(--card))', 
          border: '1px solid rgb(var(--border))' 
        }}>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed" style={{ borderColor: 'rgb(var(--border))' }}>
            <thead style={{ backgroundColor: 'rgb(var(--muted))' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/5" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Tittel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-20" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-32" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/4" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Ingress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-20" style={{ color: 'rgb(var(--muted-foreground))' }}>
                  Dato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-20" style={{ color: 'rgb(var(--muted-foreground))' }}>
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
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="mx-auto h-12 w-12" style={{ color: 'rgb(var(--muted-foreground))' }} />
                    <h3 className="mt-2 text-sm font-medium" style={{ color: 'rgb(var(--foreground))' }}>Ingen blogginnlegg funnet</h3>
                    <p className="mt-1 text-sm" style={{ color: 'rgb(var(--muted-foreground))' }}>
                      Prøv å justere søkekriteriene dine eller sjekk Supabase-tilkoblingen.
                    </p>
                  </td>
                </tr>
              ) : (
                posts.map((post, index) => (
                  <tr key={post.id} className="transition-colors" 
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
                        <div className="text-sm font-medium truncate">{post.tittel}</div>
                        <div className="text-xs mt-2" style={{ color: 'rgb(var(--muted-foreground))' }}>
                          Opprettet: {new Date(post.created_at).toLocaleDateString('no-NO')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        post.publisert 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.publisert ? 'Publisert' : 'Utkast'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      <div className="break-all text-xs" title={post.slug}>
                        {post.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="break-words line-clamp-2" title={post.ingress}>
                        {post.ingress}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm ">
                      <div>{new Date(post.dato).toLocaleDateString('no-NO')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(post)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Rediger"
                        >
                          <Edit size={16} />
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
          Side {pagination.page} av {pagination.totalPages}
        </div>
        <div className="flex justify-center sm:justify-end space-x-1 sm:space-x-2 order-1 sm:order-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))' }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span className="hidden sm:inline">Forrige</span>
            <span className="sm:hidden">‹</span>
          </button>
          <button className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm   rounded-md" style={{ backgroundColor: 'rgb(var(--orange-primary))', color: 'white' }}>
            {pagination.page}
          </button>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))' }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span className="hidden sm:inline">Neste</span>
            <span className="sm:hidden">›</span>
          </button>
        </div>
      </div>

      {/* Edit Post Modal */}
      <EditPostModal
        post={selectedPost}
        isOpen={editModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePost}
        onImageChange={loadPosts} // Refresh table when images change
      />
    </div>
  );
};

export default BlogManager;