// Database Search Types for Customers, Documents, and Embeddings

export interface Customer {
  id: string;
  name: string;
  customer_number: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  customer_id: string | null;
  file_name: string;
  file_path: string;
  ourref: string | null;
  editdate: string | null;
  createdate: string | null;
  uploaded_at: string | null;
  opplastnings_metode: string | null;
  // Joined data
  customer_name?: string;
}

export interface DocumentEmbedding {
  id: string;
  document_id: string | null;
  chunk_text: string;
  embedding: number[] | null;
  chunk_index: number | null;
  created_at: string;
  metadata: Record<string, any> | null;
  // Joined data
  document?: Document;
  similarity?: number;
}

export interface SearchResult {
  type: 'customer' | 'document' | 'embedding';
  data: Customer | Document | DocumentEmbedding;
  relevance?: number;
  highlight?: string;
}

export interface PaginatedSearchResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchStats {
  totalCustomers: number;
  totalDocuments: number;
  recentUploads: number;
  searchResults: number;
}

