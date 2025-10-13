# 📧 Epost Agent - Supabase Integration

Epost-agenten er nå koblet til Supabase `n8n_chat_histories` tabellen for å vise ekte samtaledata i stedet for dummy-data.

## 🗄️ Database Schema

```sql
create table public.n8n_chat_histories (
  id serial not null,
  session_id character varying(255) not null,
  message jsonb not null,
  constraint n8n_chat_histories_pkey primary key (id)
) TABLESPACE pg_default;
```

## 📊 Message Format

Meldingene i `message` JSONB-feltet følger denne strukturen:

```typescript
{
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agent_id?: string;
  from?: string;           // E-post avsender
  to?: string;             // E-post mottaker  
  ai_generated?: boolean;  // Om svaret er AI-generert
  subject?: string;        // E-post emne
  direction?: 'innkommende' | 'utgående';
  metadata?: Record<string, any>;
}
```

## 🔄 Dataflyt

1. **n8n workflows** lagrer chat-historikk i `n8n_chat_histories` tabellen
2. **ChatService** (`src/utils/chatService.ts`) henter og grupperer data etter `session_id`
3. **EmailManager** (`src/components/Email/EmailManager.tsx`) viser grupperte samtaler som e-post konversasjoner

## 🏗️ Arkitektur

### ChatService (`src/utils/chatService.ts`)
- **`getConversations()`** - Henter og grupperer samtaler etter session_id
- **`getConversationBySessionId()`** - Henter spesifikk samtale
- **`addMessage()`** - Legger til ny melding
- **`getStats()`** - Beregner statistikk (aktiv, venter svar, avsluttet)
- **`subscribeToChanges()`** - Real-time oppdateringer

### EmailManager Komponenten
- **📊 Dashboard** med statistikk-kort
- **🔍 Søk og filtrering** etter emne, avsender, session ID
- **📋 Interaktiv tabell** med samtaler
- **💬 Modal-visning** av detaljerte meldinger
- **📄 Paginering** og real-time oppdateringer

## 🎯 Intelligente Funksjoner

### Status-bestemmelse
- **`aktiv`** - Nylig aktivitet (< 48 timer)
- **`venter_svar`** - Siste melding fra bruker (< 24 timer)
- **`avsluttet`** - Ingen aktivitet > 48 timer

### Prioritets-bestemmelse
- **`kritisk`** - Inneholder "urgent", "kritisk", "asap"
- **`høy`** - Inneholder "viktig", "prioritet", "raskt"
- **`lav`** - Inneholder "når du får tid", "ikke hastverk"
- **`medium`** - Standard

### Kategori-bestemmelse
- **`salg`** - Inneholder "pris", "tilbud", "kjøp"
- **`support`** - Inneholder "problem", "feil", "hjelp"
- **`klage`** - Inneholder "klage", "misfornøyd", "dårlig"
- **`generell`** - Standard

## 🧪 Test Data

For testing kan du bruke `src/utils/testData.ts`:

```typescript
import { addTestConversations } from './src/utils/testData';

// Legg til test-samtaler
await addTestConversations();
```

Dette legger til 3 test-samtaler:
1. SEO-forespørsel (salg, aktiv)
2. Teknisk support (support, venter svar)
3. Samarbeidsforslag (salg, aktiv)

## 🚀 Produksjon Setup

### 1. Supabase Konfigurasjon
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. n8n Workflow Integration
n8n workflows må lagre meldinger i `n8n_chat_histories` tabellen:

```javascript
// n8n node for å lagre melding
const messageData = {
  session_id: $json.session_id || $json.user_id,
  message: {
    role: 'user',
    content: $json.message,
    timestamp: new Date().toISOString(),
    from: $json.from,
    to: $json.to,
    subject: $json.subject,
    direction: 'innkommende',
    ai_generated: false
  }
};

// Insert til Supabase
await supabase
  .from('n8n_chat_histories')
  .insert(messageData);
```

### 3. Row Level Security (RLS)
```sql
-- Aktiver RLS
ALTER TABLE n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Basis policy for autentiserte brukere
CREATE POLICY "Users can view chat histories" 
  ON n8n_chat_histories FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert chat histories" 
  ON n8n_chat_histories FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');
```

## 🔧 Utvikling

### Kjør lokalt
```bash
npm run dev
```

### Real-time Testing
1. Åpne epost-agenten i browseren
2. Legg til test-data med `addTestConversations()`
3. Se real-time oppdateringer når nye meldinger legges til

### Debugging
- **Browser Console** - Se API-kall og feilmeldinger
- **Supabase Dashboard** - Sjekk data i `n8n_chat_histories` tabellen
- **Network Tab** - Verifiser API-requests

## ⚡ Performance

- **Paginering** - 10 samtaler per side
- **Real-time** - Automatisk oppdatering ved nye meldinger  
- **Caching** - Supabase håndterer query optimization
- **Indexing** - Legg til index på `session_id` for bedre ytelse:

```sql
CREATE INDEX idx_n8n_chat_histories_session_id 
  ON n8n_chat_histories(session_id);

CREATE INDEX idx_n8n_chat_histories_created_at 
  ON n8n_chat_histories(id); -- id er auto-increment, fungerer som created_at
```

## 🎨 UI/UX Features

- **📱 Responsiv design** - Fungerer på mobile og desktop
- **🔍 Live søk** - Søk i emne, avsender, session ID
- **📊 Real-time statistikk** - Oppdateres automatisk
- **💬 Modal detaljer** - Full samtalehistorikk
- **🎯 Status-ikoner** - Visuell indikasjon av samtale-status
- **⚡ Loading states** - Smooth brukeropplevelse

---

**🎯 Epost-agenten er nå klar for produksjon med ekte data fra n8n workflows!**
