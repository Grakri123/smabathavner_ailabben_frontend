# 🗄️ Database Søk - Dokumentasjon

> Ny funksjonalitet for å søke i kunder, dokumenter og dokument-innhold

---

## 📋 Oversikt

**Database Søk** er en ny tab som lar deg søke og administrere:
- **Kunder** - Søk etter kundenavn eller kundenummer
- **Dokumenter** - Søk i filnavn og filtrer etter kunde
- **Dokument-innhold** - Se tekstinnhold (chunks/embeddings) i dokumenter

---

## 🎯 Funksjoner

### 1. **Kunde-søk**
- Søk etter kundenavn
- Søk etter kundenummer
- Se alle kunder sortert etter opprettelsesdato
- Klikk på kunde for å se alle dokumenter knyttet til kunden

### 2. **Dokument-søk**
- Søk i filnavn
- **Autocomplete kunde-filter** - Skriv "S", "SM", "SMÅ" osv. for live forslag
- Velg kunde fra forslag eller tøm for å vise alle
- Se dokument-metadata (vår ref, datoer)
- Klikk på dokument for å se tekstinnhold

### 3. **Dokument-detaljer Modal**
- Vis full dokument-informasjon
- Se alle text chunks (embeddings) fra dokumentet
- Paginering av chunks (10 per side)
- Metadata for hver chunk

### 4. **Statistikk**
- Total antall kunder i databasen
- Total antall dokumenter
- Dokumenter lastet opp siste 30 dager
- Antall søkeresultater

---

## 📊 Database Tabeller

### `customers`
```sql
create table public.customers (
  id uuid not null default gen_random_uuid (),
  name text not null,
  customer_number text null,
  created_at timestamp without time zone null default now(),
  constraint customers_pkey primary key (id)
)
```

**Indexer:**
- `idx_customers_name` - Rask søk på navn
- `idx_customers_number` - Rask søk på kundenummer

### `documents`
```sql
create table public.documents (
  id uuid not null default gen_random_uuid (),
  customer_id uuid null,
  file_name text not null,
  file_path text not null,
  ourref text null,
  editdate timestamp without time zone null,
  createdate timestamp without time zone null,
  uploaded_at timestamp without time zone null default now(),
  constraint documents_pkey primary key (id),
  constraint documents_customer_id_fkey foreign key (customer_id) 
    references customers (id) on delete CASCADE
)
```

**Indexer:**
- `idx_documents_customer_id` - Rask filtering på kunde
- `idx_documents_createdate` - Sortering på dato

### `document_embeddings`
```sql
create table public.document_embeddings (
  id uuid not null default gen_random_uuid (),
  document_id uuid null,
  chunk_text text not null,
  embedding extensions.vector null,
  chunk_index integer null,
  created_at timestamp without time zone null default now(),
  metadata jsonb null,
  constraint document_embeddings_pkey primary key (id),
  constraint document_embeddings_document_id_fkey foreign key (document_id) 
    references documents (id) on delete CASCADE
)
```

**Indexer:**
- `document_embeddings_document_id_idx` - Rask filtering på dokument
- `document_embeddings_embedding_idx` - Vector similarity search (IVFFlat)

---

## 🔧 Implementerte Filer

### 1. **Types** (`src/types/database.ts`)
```typescript
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
  customer_name?: string; // Joined data
}

export interface DocumentEmbedding {
  id: string;
  document_id: string | null;
  chunk_text: string;
  embedding: number[] | null;
  chunk_index: number | null;
  created_at: string;
  metadata: Record<string, any> | null;
  document?: Document; // Joined data
  similarity?: number;
}
```

### 2. **Service** (`src/utils/databaseSearchService.ts`)

**Metoder:**
- `searchCustomers(searchTerm, page, pageSize)` - Søk i kunder
- `searchDocuments(searchTerm, customerFilter, page, pageSize)` - Søk i dokumenter
- `getAllCustomers()` - Hent alle kunder for dropdown
- `getDocumentsByCustomer(customerId, page, pageSize)` - Dokumenter for en kunde
- `getDocumentEmbeddings(documentId, page, pageSize)` - Hent chunks for dokument
- `semanticSearch(searchQuery, limit)` - Semantisk søk med embeddings (krever RPC)
- `getStats()` - Hent statistikk
- `subscribeToChanges(callback)` - Real-time oppdateringer

### 3. **Komponenter**

**DatabaseSearchManager** (`src/components/Database/DatabaseSearchManager.tsx`)
- Hovedkomponent for søk
- Tabs for Kunder og Dokumenter
- Stats cards
- Søkefelt og autocomplete kunde-filter
- Tabeller med resultater
- Paginering

**CustomerAutocomplete** (`src/components/Database/CustomerAutocomplete.tsx`)
- Autocomplete/typeahead komponent for kundefilter
- Live søk med forslag mens du skriver
- Dropdown med matchende kunder
- Viser kundenavn og kundenummer
- Tøm-knapp (X) for å fjerne filter
- Følger style guide 100%

**DocumentDetailsModal** (`src/components/Database/DocumentDetailsModal.tsx`)
- Modal for å vise dokument-detaljer
- Dokument-informasjon (metadata)
- Liste over text chunks
- Paginering av chunks

### 4. **Integrering**

**chatStore.ts** - Ny agent lagt til:
```typescript
{
  id: 'database-agent',
  name: 'Database Søk',
  description: 'Søk etter kunder og dokumenter i databasen',
  icon: '🗄️',
  color: 'bg-teal-500',
  n8nEndpoint: undefined
}
```

**App.tsx** - Routing til DatabaseSearchManager:
- Vises når `database-agent` er valgt
- Sekundær navigasjon inkluderer database-agent

---

## 🎨 Design

Følger **STYLE_GUIDE.md** 100%:
- ✅ Standard container med `space-y-4 sm:space-y-6` og `p-3 sm:p-6`
- ✅ Header med tittel og beskrivelse
- ✅ 4 stats cards (Kunder, Dokumenter, Nylige, Resultater)
- ✅ Søk og filtre section
- ✅ Tabs for Kunder/Dokumenter
- ✅ Tabeller med hover states
- ✅ Loading og empty states
- ✅ Paginering med standard buttons
- ✅ Modal følger style guide
- ✅ Responsivt design (mobile, tablet, desktop)
- ✅ Lys og mørk modus support

**Farger:**
- Primary: Orange (`rgb(var(--orange-primary))`)
- Cards: `rgb(var(--card))`
- Background: `rgb(var(--background))`
- Borders: `rgb(var(--border))`
- Text: `rgb(var(--foreground))`
- Muted: `rgb(var(--muted-foreground))`

**Ikoner (Lucide React):**
- `Users` - Kunder
- `FileText` - Dokumenter
- `Database` - Database
- `Search` - Søk
- `FolderOpen` - Se dokumenter
- `Eye` - Se detaljer
- `AlignLeft` - Tekstinnhold

---

## 🚀 Bruksanvisning

### For utviklere:

1. **Velg Database Søk agent** i sidebar
2. **Søk i Kunder-tab:**
   - Skriv kundenavn eller nummer i søkefeltet
   - Klikk på 🗂️-ikonet for å se kundens dokumenter
3. **Søk i Dokumenter-tab:**
   - Skriv filnavn i søkefeltet
   - Filtrer på kunde (dropdown)
   - Klikk på 👁️-ikonet for å se dokument-detaljer
4. **Dokument-detaljer:**
   - Se all metadata
   - Scroll gjennom text chunks
   - Bruk paginering for mange chunks

### For brukere:

**Finne en kunde:**
1. Velg "Database Søk" i menyen (🗄️)
2. Sørg for at "Kunder"-tab er valgt
3. Søk etter kundenavn eller kundenummer
4. Klikk på mappen-ikon for å se dokumenter

**Søke i dokumenter:**
1. Velg "Dokumenter"-tab
2. Søk i filnavn ELLER skriv kundenavn i autocomplete-feltet
3. Forslag vises automatisk mens du skriver (f.eks. "S" → "SM" → "SMÅ" → "Småbåthavner")
4. Velg kunde fra listen eller klikk X for å tømme filter
5. Klikk på øye-ikon for å se dokumentet

**Se dokument-innhold:**
1. Åpne et dokument (øye-ikon)
2. Se all informasjon om dokumentet
3. Scroll ned for å se tekstinnhold
4. Bruk "Neste"/"Forrige" for flere chunks

---

## ⚙️ Semantic Search (Avansert)

### RPC Function for Semantic Search

For å aktivere semantisk søk med embeddings, må du opprette en RPC-funksjon i Supabase:

```sql
CREATE OR REPLACE FUNCTION semantic_search(
  query_text TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  chunk_text TEXT,
  embedding VECTOR,
  chunk_index INT,
  created_at TIMESTAMP,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_embedding VECTOR;
BEGIN
  -- 1. Generate embedding for query_text using your embedding model
  -- This is a placeholder - you need to integrate with your embedding service
  -- Example: query_embedding := generate_embedding(query_text);
  
  -- 2. Perform similarity search
  RETURN QUERY
  SELECT 
    de.id,
    de.document_id,
    de.chunk_text,
    de.embedding,
    de.chunk_index,
    de.created_at,
    de.metadata,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM document_embeddings de
  WHERE 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

**Note:** Du må integrere med en embedding service (OpenAI, Cohere, etc.) for å generere embeddings fra `query_text`.

---

## 🔐 Row Level Security (RLS)

**Viktig:** Sørg for at RLS policies er konfigurert i Supabase:

```sql
-- Customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customers" 
ON customers FOR SELECT 
USING (true);

-- Documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents" 
ON documents FOR SELECT 
USING (true);

-- Document Embeddings
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view embeddings" 
ON document_embeddings FOR SELECT 
USING (true);
```

Juster policies basert på dine sikkerhetskrav.

---

## 📝 Testing

### Test Kunde-søk:
1. Åpne Database Søk tab
2. Søk etter en kunde
3. Verifiser at resultater vises
4. Klikk på kunde for å se dokumenter

### Test Dokument-søk:
1. Bytt til Dokumenter-tab
2. Søk etter filnavn
3. Velg kunde fra dropdown
4. Verifiser filtering fungerer

### Test Dokument-detaljer:
1. Klikk på dokument
2. Sjekk at metadata vises korrekt
3. Verifiser at chunks laster
4. Test paginering av chunks

### Test Responsivt:
1. Test på mobile (< 640px)
2. Test på tablet (640-1024px)
3. Test på desktop (> 1024px)
4. Sjekk at alle funksjoner fungerer

### Test Dark Mode:
1. Toggle theme
2. Verifiser at alle farger er leselige
3. Sjekk at hover states fungerer

---

## 🚨 Troubleshooting

### Problem: Ingen kunder vises
**Løsning:**
1. Sjekk at `customers` tabell finnes i Supabase
2. Verifiser RLS policies
3. Sjekk console for errors
4. Test Supabase connection

### Problem: Dokumenter laster ikke
**Løsning:**
1. Sjekk at `documents` tabell finnes
2. Verifiser foreign key til `customers`
3. Sjekk RLS policies
4. Se network tab for API errors

### Problem: Ingen text chunks vises
**Løsning:**
1. Sjekk at `document_embeddings` tabell finnes
2. Verifiser at embeddings er opprettet for dokumentet
3. Sjekk foreign key til `documents`
4. Se console for errors

### Problem: Semantic search fungerer ikke
**Løsning:**
1. Dette er forventet - RPC function må opprettes manuelt
2. Følg instruksjonene under "Semantic Search (Avansert)"
3. Fallback text search brukes automatisk

---

## 📊 Performance

### Indexer som er opprettet:
- `idx_customers_name` - B-tree index på kundenavn
- `idx_customers_number` - B-tree index på kundenummer
- `idx_documents_customer_id` - B-tree index for filtering
- `idx_documents_createdate` - B-tree index for sorting
- `document_embeddings_document_id_idx` - B-tree for joins
- `document_embeddings_embedding_idx` - IVFFlat for vector search

### Tips for best performance:
1. Limit page size til 10-20 items
2. Bruk spesifikke søk (ikke tom string)
3. Filtrer dokumenter på kunde når mulig
4. Sett opp proper caching i produksjon

---

## 🎯 Fremtidige Forbedringer

Potensielle forbedringer for senere:

- [ ] **Avansert filtrering** - Filtrer på dato, filtype, etc.
- [ ] **Bulk operasjoner** - Slett/eksporter flere dokumenter
- [ ] **Document preview** - Vis PDF/bilde direkte i modal
- [ ] **Semantic search UI** - Egen tab for AI-basert søk
- [ ] **Export funksjoner** - Eksporter søkeresultater til CSV/Excel
- [ ] **Favoritter** - Marker ofte brukte kunder/dokumenter
- [ ] **Nylige søk** - History av søk
- [ ] **Auto-complete** - Foreslå kunder mens du skriver

---

**✅ Database Søk er klar til bruk!**  
**📅 Opprettet: 2024**  
**🔄 Versjon: 1.0.0**

