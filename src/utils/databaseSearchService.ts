import { supabase } from '../store/authStore';
import type { 
  Customer, 
  Document, 
  DocumentEmbedding, 
  PaginatedSearchResponse,
  SearchStats 
} from '../types/database';

class DatabaseSearchService {
  // Search customers by name or customer number
  async searchCustomers(
    searchTerm: string,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedSearchResponse<Customer>> {
    try {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,customer_number.ilike.%${searchTerm}%`);
      }

      // Apply sorting and pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: data as Customer[],
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  // Search documents by filename, ourref, or customer
  async searchDocuments(
    searchTerm: string,
    customerFilter?: string,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedSearchResponse<Document>> {
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          customer:customers(name)
        `, { count: 'exact' });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`file_name.ilike.%${searchTerm}%,ourref.ilike.%${searchTerm}%`);
      }

      // Filter by customer if specified
      if (customerFilter) {
        query = query.eq('customer_id', customerFilter);
      }

      // Apply sorting and pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('uploaded_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Transform data to include customer_name
      const transformedData = data?.map((doc: any) => ({
        ...doc,
        customer_name: doc.customer?.name || null
      })) || [];

      return {
        data: transformedData as Document[],
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  // Get all customers (for dropdown filter) - with pagination to handle Supabase 1000 row limit
  async getAllCustomers(): Promise<Customer[]> {
    try {
      console.log('📞 DatabaseSearchService: Fetching ALL customers from Supabase (with pagination)...');
      
      let allCustomers: Customer[] = [];
      let page = 0;
      const pageSize = 1000; // Supabase default limit
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        console.log(`📄 Fetching customers page ${page + 1} (rows ${from}-${to})...`);

        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('name')
          .range(from, to);

        if (error) {
          console.error('❌ Supabase error fetching customers page:', page + 1, error);
          throw error;
        }

        if (data && data.length > 0) {
          allCustomers = [...allCustomers, ...data];
          console.log(`✅ Page ${page + 1}: Fetched ${data.length} customers (total so far: ${allCustomers.length})`);
          
          // If we got less than pageSize, we've reached the end
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      console.log('✅ DatabaseSearchService: Fetched ALL customers:', {
        totalCount: allCustomers.length,
        pagesFetched: page,
        firstFive: allCustomers.slice(0, 5).map(c => ({ name: c.name, number: c.customer_number }))
      });

      return allCustomers as Customer[];
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      // Return empty array instead of throwing to prevent UI break
      return [];
    }
  }

  // Get documents by customer ID
  async getDocumentsByCustomer(
    customerId: string,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedSearchResponse<Document>> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('customer_id', customerId)
        .order('uploaded_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: data as Document[],
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (error) {
      console.error('Error fetching documents by customer:', error);
      throw error;
    }
  }

  // Get document embeddings (chunks) for a specific document
  async getDocumentEmbeddings(
    documentId: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedSearchResponse<DocumentEmbedding>> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('document_embeddings')
        .select(`
          *,
          document:documents(*)
        `, { count: 'exact' })
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true })
        .range(from, to);

      if (error) throw error;

      return {
        data: data as DocumentEmbedding[],
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (error) {
      console.error('Error fetching document embeddings:', error);
      throw error;
    }
  }

  // Semantic search using embeddings (requires RPC function in Supabase)
  async semanticSearch(
    searchQuery: string,
    limit = 10
  ): Promise<DocumentEmbedding[]> {
    try {
      // Note: This requires a custom RPC function in Supabase that:
      // 1. Generates embedding for searchQuery
      // 2. Does similarity search against document_embeddings
      // You'll need to create this function in Supabase
      
      // Placeholder implementation - shows how it would work
      const { data, error } = await supabase
        .rpc('semantic_search', {
          query_text: searchQuery,
          match_threshold: 0.7,
          match_count: limit
        });

      if (error) {
        // Fallback to text search if RPC doesn't exist
        console.warn('Semantic search RPC not available, falling back to text search');
        return await this.fallbackTextSearch(searchQuery, limit);
      }

      return data as DocumentEmbedding[];
    } catch (error) {
      console.error('Error in semantic search:', error);
      // Fallback to simple text search
      return await this.fallbackTextSearch(searchQuery, limit);
    }
  }

  // Fallback text search in embeddings
  private async fallbackTextSearch(
    searchQuery: string,
    limit = 10
  ): Promise<DocumentEmbedding[]> {
    try {
      const { data, error } = await supabase
        .from('document_embeddings')
        .select(`
          *,
          document:documents(*)
        `)
        .ilike('chunk_text', `%${searchQuery}%`)
        .limit(limit);

      if (error) throw error;
      return data as DocumentEmbedding[];
    } catch (error) {
      console.error('Error in fallback text search:', error);
      return [];
    }
  }

  // Get statistics
  async getStats(): Promise<SearchStats> {
    try {
      const [customersResult, documentsResult, recentResult] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
        supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .gte('uploaded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        totalCustomers: customersResult.count || 0,
        totalDocuments: documentsResult.count || 0,
        recentUploads: recentResult.count || 0,
        searchResults: 0
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        totalCustomers: 0,
        totalDocuments: 0,
        recentUploads: 0,
        searchResults: 0
      };
    }
  }

  // Real-time subscription for changes
  subscribeToChanges(callback: (payload: any) => void) {
    const channels = [
      supabase
        .channel('customers_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, callback)
        .subscribe(),
      supabase
        .channel('documents_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, callback)
        .subscribe()
    ];

    return {
      unsubscribe: () => {
        channels.forEach(channel => channel.unsubscribe());
      }
    };
  }
}

export const databaseSearchService = new DatabaseSearchService();
export default databaseSearchService;

