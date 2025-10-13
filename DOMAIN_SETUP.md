# 🌐 Småbåthavner Domene Setup Guide

## Frontend URL
**Produksjon**: `https://smabathavner.ailabben.no`
**Development**: `http://localhost:3000`

---

## ✅ Sjekkliste for Domene-konfigurasjon

### 1. **Vercel Deployment** ✓
- [x] Frontend deployed til `smabathavner.ailabben.no`
- [ ] Environment variables satt i Vercel

### 2. **Supabase Konfigurasjon**
Logg inn på Supabase Dashboard og gjør følgende:

#### A. Redirect URLs (KRITISK)
1. Gå til **Authentication** → **URL Configuration**
2. Legg til følgende i **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   https://smabathavner.ailabben.no/auth/callback
   ```
3. Sett **Site URL** til:
   ```
   https://smabathavner.ailabben.no
   ```

#### B. Database Tabeller
Sjekk at følgende tabeller eksisterer:
- [x] `blogginnlegg` - Blog posts
- [ ] `smabathavner_contacts` - Kontakter fra chat (erstatter `klvarme_contacts`)
- [ ] `n8n_chat_histories` - Chat historikk

**Migrering fra KL Varme:**
```sql
-- Hvis du har eksisterende klvarme_contacts tabell, rename den:
ALTER TABLE klvarme_contacts RENAME TO smabathavner_contacts;

-- Eller opprett ny tabell med samme struktur
```

### 3. **n8n Konfigurasjon**

#### A. CORS Settings
I n8n miljøvariabler, sett:
```bash
N8N_CORS_ORIGIN=http://localhost:3000,https://smabathavner.ailabben.no
```

#### B. Webhook URL
n8n base URL: `https://smabathavner.n8n.ailabben.no`

Webhooks vil bli automatisk bygget som:
```
https://smabathavner.n8n.ailabben.no/webhook/{WEBHOOK_ID}
```

#### C. Konfigurer Webhooks
I `src/store/chatStore.ts`, oppdater webhook IDs:
```typescript
const agents: Agent[] = [
  {
    id: 'main-assistant',
    name: 'Hovedassistent',
    n8nEndpoint: 'DIN-WEBHOOK-ID-HER' // Erstatt med riktig ID
  }
  // ... andre agenter
];
```

### 4. **Environment Variables**

#### Vercel (Produksjon)
Sett følgende i Vercel Dashboard:
```bash
VITE_N8N_BASE_URL=https://smabathavner.n8n.ailabben.no
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_DEV_MODE=false
```

#### Local Development (.env.local)
```bash
VITE_N8N_BASE_URL=https://smabathavner.n8n.ailabben.no
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_DEV_MODE=true
```

### 5. **Autentisering**

#### Tillatte E-poster
Kun `system@ailabben.no` har tilgang for nå.

For å legge til flere brukere:
1. Rediger `src/store/authStore.tsx` (linje 226-229)
2. Endre eller fjern email-sjekken
3. Eller opprett brukere direkte i Supabase Dashboard

---

## 🧪 Testing

### 1. Test Auth Flow
1. Gå til `https://smabathavner.ailabben.no`
2. Logg inn med `system@ailabben.no`
3. Sjekk email for magic link
4. Klikk på link - skal redirecte til `/auth/callback` → hovedside

### 2. Test n8n Connection
1. Velg "Hovedassistent" i sidebar
2. Send en testmelding
3. Sjekk at den treffer n8n webhook
4. Verifiser respons kommer tilbake

### 3. Test Database
1. Gå til "SEO Agent" → "Blogg" tab
2. Sjekk at blogginnlegg laster
3. Test redigering av et innlegg

### 4. Test Chat Manager
1. Gå til "Chat Agent" → "Blogg" tab
2. Sjekk at kontakter vises (fra `smabathavner_contacts`)
3. Test åpning av chat-samtale

---

## 🚨 Troubleshooting

### Problem: "Denne e-posten har ikke tilgang"
**Løsning**: 
1. Sjekk at du bruker `system@ailabben.no`
2. Eller rediger `src/store/authStore.tsx` for å tillate andre emails

### Problem: Magic link redirecter til feil URL
**Løsning**:
1. Sjekk Supabase → Authentication → URL Configuration
2. Verifiser at `https://smabathavner.ailabben.no/auth/callback` er lagt til

### Problem: n8n CORS error
**Løsning**:
1. Sjekk n8n miljøvariabler
2. Verifiser at `N8N_CORS_ORIGIN` inkluderer ditt domene
3. Restart n8n etter endring

### Problem: Chat Manager viser ingen data
**Løsning**:
1. Sjekk at `smabathavner_contacts` tabell eksisterer i Supabase
2. Eller migrer data fra `klvarme_contacts` til `smabathavner_contacts`

### Problem: Webhook ikke funnet (404)
**Løsning**:
1. Sjekk at webhook ID er korrekt i `src/store/chatStore.ts`
2. Verifiser at n8n workflow er aktivert
3. Test webhook manuelt:
   ```bash
   curl -X POST https://smabathavner.n8n.ailabben.no/webhook/YOUR_ID \
     -H "Content-Type: application/json" \
     -d '{"message": "test"}'
   ```

---

## 📋 Deploy Checklist

- [ ] Vercel deployment fungerer
- [ ] Environment variables satt
- [ ] Supabase redirect URLs konfigurert
- [ ] n8n CORS konfigurert
- [ ] Database tabeller opprettet/migrert
- [ ] Webhook IDs oppdatert i koden
- [ ] Auth flow testet
- [ ] Chat funksjonalitet testet
- [ ] Blog manager testet
- [ ] Chat manager testet

---

## 📞 Support

Ved problemer, sjekk:
1. Browser console for feilmeldinger (F12)
2. Network tab for API-kall som feiler
3. Supabase logs
4. n8n execution logs

**Status**: ✅ Domene konfigurert for Småbåthavner
**Sist oppdatert**: 2024

