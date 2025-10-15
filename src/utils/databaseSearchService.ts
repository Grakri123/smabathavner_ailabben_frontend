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
    pageSize = 10,
    sortField: 'name' | 'customer_number' | 'created_at' = 'created_at',
    sortDirection: 'asc' | 'desc' = 'desc'
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
        .order(sortField, { ascending: sortDirection === 'asc' })
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

  // Search documents by filename, ourref, or customer (from both documents and documents_outlook tables)
  async searchDocuments(
    searchTerm: string,
    customerFilter?: string,
    page = 1,
    pageSize = 10,
    sortField: 'file_name' | 'ourref' | 'opplastnings_metode' | 'createdate' = 'createdate',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedSearchResponse<Document>> {
    try {
      console.log('🔍 Searching documents from both tables:', { searchTerm, customerFilter, page, pageSize, sortField, sortDirection });

      // Build search conditions
      let searchConditions = '';
      if (searchTerm) {
        searchConditions = `file_name.ilike.%${searchTerm}%,ourref.ilike.%${searchTerm}%`;
      }

      // Build customer filter condition
      let customerCondition = '';
      if (customerFilter) {
        customerCondition = `customer_id.eq.${customerFilter}`;
      }

      // Combine conditions
      let whereConditions = [];
      if (searchConditions) whereConditions.push(searchConditions);
      if (customerCondition) whereConditions.push(customerCondition);
      
      const whereClause = whereConditions.length > 0 ? whereConditions.join(',') : '';

      console.log('📋 Search conditions:', { whereClause });

      // Use fallback method since RPC function doesn't exist
      console.log('🔄 Using individual queries method');
      return await this.searchDocumentsFallback(searchTerm, customerFilter, page, pageSize, sortField, sortDirection);
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  // Fallback method using individual queries
  private async searchDocumentsFallback(
    searchTerm: string,
    customerFilter?: string,
    page = 1,
    pageSize = 10,
    sortField: 'file_name' | 'ourref' | 'opplastnings_metode' | 'createdate' = 'createdate',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedSearchResponse<Document>> {
    try {
      console.log('🔄 Using fallback search method');

      // Search documents table
      let documentsQuery = supabase
        .from('documents')
        .select(`
          *,
          customer:customers(name)
        `, { count: 'exact' });

      // Search documents_outlook table
      let outlookQuery = supabase
        .from('documents_outlook')
        .select(`
          *,
          customer:customers(name)
        `, { count: 'exact' });

      // Apply search filter to both
      if (searchTerm) {
        documentsQuery = documentsQuery.or(`file_name.ilike.%${searchTerm}%,ourref.ilike.%${searchTerm}%`);
        outlookQuery = outlookQuery.or(`file_name.ilike.%${searchTerm}%,ourref.ilike.%${searchTerm}%`);
      }

      // Apply customer filter to both
      if (customerFilter) {
        documentsQuery = documentsQuery.eq('customer_id', customerFilter);
        outlookQuery = outlookQuery.eq('customer_id', customerFilter);
      }

      // Execute both queries with safe sorting
      // Map frontend sort fields to actual database fields
      const getDatabaseSortField = (field: string) => {
        switch (field) {
          case 'createdate':
            return 'uploaded_at';
          case 'file_name':
            return 'file_name';
          case 'ourref':
            return 'ourref';
          case 'opplastnings_metode':
            return 'opplastnings_metode';
          default:
            return 'uploaded_at';
        }
      };

      const dbSortField = getDatabaseSortField(sortField);
      
      const [documentsResult, outlookResult] = await Promise.all([
        documentsQuery.order(dbSortField, { ascending: sortDirection === 'asc' }),
        outlookQuery.order(dbSortField, { ascending: sortDirection === 'asc' })
      ]);

      if (documentsResult.error) throw documentsResult.error;
      if (outlookResult.error) throw outlookResult.error;

      // Combine results
      const allDocuments = [
        ...(documentsResult.data?.map((doc: any) => ({
          ...doc,
          customer_name: doc.customer?.name || null,
          source: 'documents'
        })) || []),
        ...(outlookResult.data?.map((doc: any) => ({
          ...doc,
          customer_name: doc.customer?.name || null,
          source: 'documents_outlook'
        })) || [])
      ];

      // Sort combined results by the specified field
      allDocuments.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortField) {
          case 'file_name':
            aValue = a.file_name || '';
            bValue = b.file_name || '';
            break;
          case 'ourref':
            aValue = a.ourref || '';
            bValue = b.ourref || '';
            break;
          case 'opplastnings_metode':
            aValue = a.opplastnings_metode || '';
            bValue = b.opplastnings_metode || '';
            break;
          case 'createdate':
          default:
            aValue = new Date(a.uploaded_at || a.createdate || 0).getTime();
            bValue = new Date(b.uploaded_at || b.createdate || 0).getTime();
            break;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === 'asc' ? comparison : -comparison;
        } else {
          const comparison = aValue - bValue;
          return sortDirection === 'asc' ? comparison : -comparison;
        }
      });

      // Apply pagination
      const totalCount = allDocuments.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = allDocuments.slice(startIndex, endIndex);

      console.log('✅ Fallback search results:', { 
        totalCount, 
        paginatedCount: paginatedData.length,
        page,
        totalPages: Math.ceil(totalCount / pageSize)
      });

      return {
        data: paginatedData as Document[],
        count: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      };
    } catch (error) {
      console.error('Error in fallback search:', error);
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

      // Try to find document in both tables to determine source
      const [documentsResult, outlookResult] = await Promise.all([
        supabase.from('documents').select('id').eq('id', documentId).single(),
        supabase.from('documents_outlook').select('id').eq('id', documentId).single()
      ]);

      // Determine which table the document is in
      const isInDocuments = !documentsResult.error && documentsResult.data;
      const isInOutlook = !outlookResult.error && outlookResult.data;

      if (!isInDocuments && !isInOutlook) {
        throw new Error('Document not found in either table');
      }

      // Search embeddings table (it should work for both document sources)
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
      const [customersResult, documentsResult, outlookResult, recentResult] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
        supabase.from('documents_outlook').select('id', { count: 'exact', head: true }),
        supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .gte('uploaded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const totalDocuments = (documentsResult.count || 0) + (outlookResult.count || 0);

      return {
        totalCustomers: customersResult.count || 0,
        totalDocuments: totalDocuments,
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
        .subscribe(),
      supabase
        .channel('documents_outlook_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents_outlook' }, callback)
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

