# 🔍 Debug Guide - Session ID Gruppering

Hvis samme `session_id` vises som separate rader i stedet for én gruppert samtale, følg denne debug-guiden.

## 🧪 Test Setup

### 1. Legg til test-data
```typescript
import { addTestConversations } from './src/utils/testData';

// Kjør i browser console
addTestConversations().then(success => {
  console.log('Test data added:', success);
});
```

Dette legger til:
- **sess_test_001**: 4 meldinger (SEO inquiry)
- **sess_test_002**: 3 meldinger (Technical support)  
- **sess_test_003**: 3 meldinger (Partnership inquiry)

### 2. Kjør debug-funksjon
1. Gå til Epost Agent siden
2. Klikk **🔍 Debug** knappen
3. Åpne Browser Console (F12)
4. Se debug-output

## 🔍 Debug Output

Du skal se noe slikt:

```
🔍 Debug: Raw data from database:
  1. ID: 1, Session: sess_test_001, Content: "Hei, jeg lurer på hvilke SEO-tjenester dere tilb..."
  2. ID: 2, Session: sess_test_001, Content: "Hei! Takk for henvendelsen. Vi tilbyr omfattende..."
  3. ID: 3, Session: sess_test_001, Content: "Høres bra ut! Kan vi sette opp et møte for å dis..."
  4. ID: 4, Session: sess_test_001, Content: "Selvfølgelig! Jeg sender deg en kalenderlink så d..."
  5. ID: 5, Session: sess_test_002, Content: "Chatboten på nettsiden vår fungerer ikke som den..."
  ...

🔍 Debug: Grouped by session_id:
  Session: sess_test_001 (4 messages)
    1. user: "Hei, jeg lurer på hvilke SEO-tj..."
    2. assistant: "Hei! Takk for henvendelsen. Vi..."
    3. user: "Høres bra ut! Kan vi sette opp..."
    4. assistant: "Selvfølgelig! Jeg sender deg e..."
  Session: sess_test_002 (3 messages)
    1. user: "Chatboten på nettsiden vår fung..."
    2. assistant: "Takk for tilbakemeldingen. Kan..."
    3. user: "Spesielt spørsmål om priser og..."
  Session: sess_test_003 (3 messages)
    1. user: "Vi er interessert i å utforske..."
    2. assistant: "Hei! Vi er definitivt interesse..."
    3. user: "Perfekt! Vi har budsjett på 50-1..."
```

## 📊 EmailManager Debug Output

Du skal også se:

```
📧 EmailManager: Received conversations:
count: 3
conversations: [
  {
    session_id: "sess_test_001",
    message_count: 4,
    subject: "Spørsmål om SEO-tjenester",
    from: "kunde@example.com"
  },
  {
    session_id: "sess_test_002", 
    message_count: 3,
    subject: "Teknisk problem med chatbot",
    from: "support@bedrift.no"
  },
  {
    session_id: "sess_test_003",
    message_count: 3,
    subject: "Samarbeidsforslag - AI-markedsføring", 
    from: "markedssjef@startup.com"
  }
]
```

## ❌ Hvis problemet fortsatt eksisterer

### Sjekk 1: Database Data
```sql
-- Sjekk raw data i Supabase
SELECT id, session_id, message->>'content' as content 
FROM n8n_chat_histories 
ORDER BY id;
```

### Sjekk 2: Message Format
Sørg for at meldinger har riktig format:
```json
{
  "session_id": "samme-verdi-for-relaterte-meldinger",
  "message": {
    "role": "user",
    "content": "melding innhold",
    "timestamp": "2024-01-17T10:00:00Z"
  }
}
```

### Sjekk 3: ChatService Gruppering
Hvis grupperingen feiler, sjekk:
1. **session_id** er identisk for relaterte meldinger
2. **Ingen whitespace** eller hidden characters i session_id
3. **Case sensitivity** - "Session_001" ≠ "session_001"

### Sjekk 4: EmailManager Rendering
Hvis grupperingen fungerer men UI viser feil:
1. Sjekk at `key={conversation.session_id}` brukes i React
2. Verifiser at `filteredConversations` inneholder grupperte data
3. Se at `conversation.message_count` reflekterer antall meldinger

## 🔧 Vanlige Feil

### 1. Duplikat Session IDs
```typescript
// FEIL - samme session_id men forskjellig case
"sess_001" vs "Sess_001" vs "SESS_001"

// RIKTIG - eksakt samme session_id
"sess_001" for alle relaterte meldinger
```

### 2. Missing Message Fields
```typescript
// FEIL - mangler timestamp
{
  role: "user",
  content: "melding"
}

// RIKTIG - komplett message
{
  role: "user", 
  content: "melding",
  timestamp: "2024-01-17T10:00:00Z"
}
```

### 3. React Key Issues
```typescript
// FEIL - bruker index som key
{conversations.map((conv, index) => 
  <tr key={index}>

// RIKTIG - bruker session_id som key  
{conversations.map((conv) => 
  <tr key={conv.session_id}>
```

## 🎯 Forventet Resultat

Etter fix skal du se:
- **3 rader** i tabellen (ikke 10)
- **sess_test_001** med "4 meldinger" 
- **sess_test_002** med "3 meldinger"
- **sess_test_003** med "3 meldinger"
- Modal viser **alle meldinger** for valgt samtale

---

**🔍 Hvis problemet fortsatt eksisterer, kjør debug-funktionen og del output for videre analyse.**
