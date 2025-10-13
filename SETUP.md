# 🚀 Kunde Setup Guide

> **Rask guide for å sette opp dette template for en ny kunde**

## ✅ Sjekkliste for Ny Kunde

### 1. Repository Setup
- [ ] Klon template repository
- [ ] Endre repository navn til `kunde-navn-frontend`
- [ ] Oppdater `package.json` med kunde-navn
- [ ] Initialiser nytt Git repository

### 2. Miljøvariabler (`.env.local`)
- [ ] Kopier `env.example` til `.env.local`
- [ ] Sett `VITE_N8N_BASE_URL` til kundens n8n domain
- [ ] Konfigurer Supabase URL og anon key
- [ ] Test at alle variabler er riktige

### 3. Agent Konfigurasjon
- [ ] Oppdater agent-navn i `src/store/chatStore.ts`
- [ ] Endre agent-ikon og farge
- [ ] Sett riktig n8n webhook ID
- [ ] Test chat-funksjonalitet

### 4. Database Setup
- [ ] Opprett `blogginnlegg` tabell i Supabase
- [ ] Legg til kunde-spesifikke tabeller
- [ ] Konfigurer RLS policies
- [ ] Test database-tilkobling

### 5. n8n Integration
- [ ] Konfigurer CORS i kundens n8n
- [ ] Opprett webhook workflow
- [ ] Test API-kall fra frontend
- [ ] Verifiser response-format

### 6. Branding
- [ ] Oppdater farger i `tailwind.config.js`
- [ ] Endre titler og tekster
- [ ] Tilpass navigasjon hvis nødvendig
- [ ] Test responsivt design

### 7. Testing
- [ ] Chat-funksjonalitet fungerer
- [ ] Blog/CRM tabeller laster inn
- [ ] Modal-redigering fungerer
- [ ] Mobile-visning er OK
- [ ] Alle miljøer fungerer (dev/prod)

### 8. Deployment
- [ ] Konfigurer hosting (Vercel/Netlify)
- [ ] Sett produksjon miljøvariabler
- [ ] Test produksjon-build
- [ ] Konfigurer domene

---

## 🔧 Vanlige Tilpasninger

### Nye CRM Tabeller

1. **Opprett tabell i Supabase**:
```sql
create table public.kunde_leads (
  id uuid primary key default gen_random_uuid(),
  navn text not null,
  -- kunde-spesifikke felter
  created_at timestamptz default now()
);
```

2. **Legg til TypeScript types**:
```typescript
// src/types/kunde.ts
export interface KundeLead {
  id: string;
  navn: string;
  // ... andre felter
}
```

3. **Opprett service**:
```typescript
// src/utils/kundeService.ts
export const kundeService = {
  getLeads: async () => { /* ... */ }
};
```

4. **Legg til komponent**:
```typescript
// src/components/Kunde/KundeManager.tsx
const KundeManager: React.FC = () => {
  // ... implementasjon
};
```

### Nye Agenter

```typescript
// src/store/chatStore.ts
const agents: Agent[] = [
  {
    id: 'kunde-seo-agent',
    name: 'SEO Ekspert',
    description: 'Hjelper med SEO for kunde',
    icon: '🔍',
    color: 'bg-green-500',
    n8nEndpoint: 'webhook-id-fra-n8n'
  },
  {
    id: 'kunde-salgs-agent', 
    name: 'Salgs Assistent',
    description: 'Hjelper med salg og leads',
    icon: '💼',
    color: 'bg-blue-500',
    n8nEndpoint: 'annet-webhook-id'
  }
];
```

---

## 🚨 Troubleshooting

### Problem: Chat fungerer ikke

**Sjekk:**
1. n8n CORS konfigurasjon
2. Webhook er aktiv i n8n
3. Response format fra n8n
4. Network tab i DevTools

**Fix:**
```bash
# Test webhook manuelt
curl -X POST https://kunde.n8n.domain.no/webhook-test/webhook-id \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

### Problem: Database fungerer ikke

**Sjekk:**
1. Supabase URL og keys
2. Tabell eksisterer
3. RLS policies
4. Network connectivity

**Fix:**
```javascript
// Test i browser console
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('URL', 'KEY');
const { data, error } = await supabase.from('blogginnlegg').select('*');
console.log(data, error);
```

### Problem: Hvit skjerm

**Sjekk:**
1. Console errors (F12)
2. Missing miljøvariabler
3. TypeScript errors
4. Import/export issues

**Fix:**
```bash
# Sjekk TypeScript
npx tsc --noEmit

# Restart dev server
npm run dev
```

---

## 📋 Kunde-spesifikke Notater

### [Kunde Navn]

**Dato**: ___________  
**Utvikler**: ___________

**Spesielle krav:**
- [ ] ___________
- [ ] ___________

**Tilpasninger gjort:**
- [ ] ___________
- [ ] ___________

**Testing utført:**
- [ ] ___________
- [ ] ___________

**Deployment info:**
- **URL**: ___________
- **Hosting**: ___________
- **Domain**: ___________

**Notater:**
___________
___________

---

**✅ Setup komplett! Kunde er klar til å bruke systemet.**