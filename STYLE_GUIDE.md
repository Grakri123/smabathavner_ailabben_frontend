# 🎨 Småbåthavner Frontend - Style Guide & Design System

> Komplett designdokumentasjon for å sikre konsistent utseende på tvers av alle tabs og komponenter

---

## 📋 Innholdsfortegnelse

1. [Fargepalett](#fargepalett)
2. [Typografi](#typografi)
3. [Layout Struktur](#layout-struktur)
4. [Komponenter](#komponenter)
5. [Stats Cards](#stats-cards)
6. [Søk og Filtre](#søk-og-filtre)
7. [Tabeller](#tabeller)
8. [Modaler](#modaler)
9. [Knapper](#knapper)
10. [Badges og Status](#badges-og-status)
11. [Paginering](#paginering)
12. [Responsivt Design](#responsivt-design)
13. [Animasjoner](#animasjoner)

---

## 🎨 Fargepalett

### CSS Custom Properties

Alle farger bruker CSS custom properties med `rgb()` format for fleksibilitet:

```css
style={{ backgroundColor: 'rgb(var(--card))' }}
style={{ color: 'rgb(var(--foreground))' }}
style={{ border: '1px solid rgb(var(--border))' }}
```

### Light Mode (Lysemodus)

| Variabel | RGB Verdi | Hex | Bruk |
|----------|-----------|-----|------|
| `--background` | 255 255 255 | #FFFFFF | Hoved bakgrunn |
| `--foreground` | 18 42 57 | #122A39 | Hoved tekst |
| `--card` | 255 255 255 | #FFFFFF | Card bakgrunn |
| `--muted` | 249 250 251 | #F9FAFB | Sekundær bakgrunn |
| `--muted-foreground` | 107 114 128 | #6B7280 | Sekundær tekst |
| `--border` | 229 231 235 | #E5E7EB | Borders og dividers |
| `--orange-primary` | 249 115 22 | #F97316 | Primærfarge (CTA, active states) |
| `--orange-600` | 234 88 12 | #EA580C | Hover state for orange |
| `--sidebar-background` | 245 245 245 | #F5F5F5 | Sidebar bakgrunn |
| `--sidebar-border` | 229 231 235 | #E5E7EB | Sidebar border |

### Dark Mode (Mørk modus)

| Variabel | RGB Verdi | Hex | Bruk |
|----------|-----------|-----|------|
| `--background` | 17 24 39 | #111827 | Hoved bakgrunn (gray-900) |
| `--foreground` | 243 244 246 | #F3F4F6 | Hoved tekst (gray-100) |
| `--card` | 31 41 55 | #1F2937 | Card bakgrunn (gray-800) |
| `--muted` | 31 41 55 | #1F2937 | Sekundær bakgrunn (gray-800) |
| `--muted-foreground` | 156 163 175 | #9CA3AF | Sekundær tekst (gray-400) |
| `--border` | 55 65 81 | #374151 | Borders og dividers (gray-700) |
| `--orange-primary` | 249 115 22 | #F97316 | Primærfarge (samme som light) |
| `--sidebar-background` | 31 41 55 | #1F2937 | Sidebar bakgrunn (gray-800) |
| `--sidebar-border` | 55 65 81 | #374151 | Sidebar border (gray-700) |

### Accent Colors (Status og Badges)

```css
/* Grønn (Success/Publisert) */
bg-green-100 text-green-800  /* Lys: #DCFCE7 / #166534 */
bg-green-100 text-green-600  /* Icons */

/* Gul (Venter/Utkast) */
bg-yellow-100 text-yellow-800  /* Lys: #FEF3C7 / #854D0E */
bg-yellow-100 text-yellow-600  /* Icons */

/* Blå (Info/Default) */
bg-blue-100 text-blue-600  /* Lys: #DBEAFE / #2563EB */
bg-blue-100 text-blue-800  /* Mørk tekst */

/* Grå (Avsluttet/Inaktiv) */
bg-gray-100 text-gray-800  /* Lys: #F3F4F6 / #1F2937 */
bg-gray-100 text-gray-600  /* Icons */

/* Rød (Kritisk/Error) */
bg-red-100 text-red-800  /* Lys: #FEE2E2 / #991B1B */
bg-red-50 border-red-200  /* Error meldinger */

/* Oransje (Høy prioritet) */
bg-orange-100 text-orange-800  /* Lys: #FFEDD5 / #9A3412 */
```

---

## ✍️ Typografi

### Font Families

```css
/* Body text */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;

/* Headings og Logo */
font-family: "video", serif;  /* Adobe Typekit */
```

### Heading Sizes

```jsx
// H1 - Page Title
<h1 className="text-xl sm:text-2xl font-bold heading">Blog Manager</h1>

// H2 - Section Title  
<h2 className="text-lg sm:text-xl font-semibold heading">Rediger Blogginnlegg</h2>

// H3 - Subsection
<h3 className="text-md font-medium heading">Samtalehistorikk</h3>
```

### Text Sizes

```jsx
// Body large (beskrivelser)
<p className="text-sm sm:text-base">Administrer og publiser blogginnlegg</p>

// Body normal
<div className="text-sm font-medium">Label tekst</div>

// Body small (metadata)
<div className="text-xs">Opprettet: 01.01.2024</div>

// Body extra small (hints)
<p className="text-xs" style={{ color: 'rgb(var(--muted-foreground))' }}>
  💡 Tips: Last opp bilder først
</p>
```

### Text Colors

```jsx
// Primary text
style={{ color: 'rgb(var(--foreground))' }}

// Secondary text (labels, metadata)
style={{ color: 'rgb(var(--muted-foreground))' }}

// Error text
style={{ color: 'rgb(var(--orange-primary))' }}
```

---

## 📐 Layout Struktur

### Container Pattern

**ALLE tabs skal følge denne strukturen:**

```jsx
<div className="space-y-4 sm:space-y-6 p-3 sm:p-6" 
  style={{ maxWidth: 'var(--container-max-width)', margin: '0 auto' }}>
  {/* Header */}
  {/* Stats Cards */}
  {/* Search and Filters */}
  {/* Main Content (Table/Cards) */}
  {/* Pagination */}
</div>
```

### Spacing System

```jsx
// Gap mellom major sections
className="space-y-4 sm:space-y-6"  // 16px → 24px

// Gap mellom form fields
className="space-y-4"  // 16px

// Gap inne i komponenter
className="gap-3 sm:gap-4"  // 12px → 16px

// Gap for små elementer
className="gap-2"  // 8px

// Padding på container
className="p-3 sm:p-6"  // 12px → 24px

// Padding på cards
className="p-4"  // 16px

// Padding på table cells
className="px-6 py-6"  // 24px horizontal, 24px vertical
className="px-6 py-4"  // For mindre cells
className="px-6 py-3"  // For header
```

---

## 🎴 Komponenter

### 1. Header Pattern

**Konsistent header for alle tabs:**

```jsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <div>
    <h1 className="text-xl sm:text-2xl font-bold heading" 
      style={{ color: 'rgb(var(--foreground))' }}>
      Tab Navn
    </h1>
    <p className="text-sm sm:text-base" 
      style={{ color: 'rgb(var(--muted-foreground))' }}>
      Kort beskrivelse av funksjonalitet
    </p>
  </div>
  {/* Optional: Action button */}
  <button className="flex items-center gap-2 px-4 py-2 text-white rounded-md"
    style={{ backgroundColor: 'rgb(var(--orange-primary))' }}>
    <RefreshCw className="w-4 h-4" />
    Oppdater
  </button>
</div>
```

---

## 📊 Stats Cards

### Layout

**Alltid 4 cards i en grid:**

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
  {/* 4 stat cards */}
</div>
```

### Card Structure

```jsx
<div className="rounded-lg p-4 shadow-sm" 
  style={{ 
    backgroundColor: 'rgb(var(--card))', 
    border: '1px solid rgb(var(--border))' 
  }}>
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium">Label</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
      <Icon className="w-4 h-4 text-blue-600" />
    </div>
  </div>
</div>
```

### Icon Colors per Card Type

| Card Type | Background | Icon Color | Bruk |
|-----------|------------|------------|------|
| Total | `bg-blue-100` | `text-blue-600` | Total count |
| Active/Published | `bg-green-100` | `text-green-600` | Positive status |
| Pending/Draft | `bg-yellow-100` | `text-yellow-600` | In progress |
| Completed/Closed | `bg-gray-100` | `text-gray-600` | Finished/Archived |

---

## 🔍 Søk og Filtre

### Container

```jsx
<div className="rounded-lg p-3 sm:p-4 shadow-sm" 
  style={{ 
    backgroundColor: 'rgb(var(--card))', 
    border: '1px solid rgb(var(--border))' 
  }}>
  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
    {/* Søkefelt */}
    {/* Filtre */}
  </div>
</div>
```

### Søkefelt

```jsx
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
  />
</div>
```

### Select/Dropdown

```jsx
<select
  className="px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  style={{ 
    border: '1px solid rgb(var(--border))',
    backgroundColor: 'rgb(var(--background))',
    color: 'rgb(var(--foreground))'
  }}>
  <option value="">Alle</option>
  <option value="publisert">Publisert</option>
  <option value="utkast">Utkast</option>
</select>
```

---

## 📋 Tabeller

### Container og Structure

```jsx
<div className="rounded-lg shadow-sm overflow-hidden" 
  style={{ 
    backgroundColor: 'rgb(var(--card))', 
    border: '1px solid rgb(var(--border))' 
  }}>
  <div className="overflow-x-auto">
    <table className="w-full table-fixed" style={{ borderColor: 'rgb(var(--border))' }}>
      <thead style={{ backgroundColor: 'rgb(var(--muted))' }}>
        {/* Headers */}
      </thead>
      <tbody style={{ borderColor: 'rgb(var(--border))' }}>
        {/* Rows */}
      </tbody>
    </table>
  </div>
</div>
```

### Table Header

```jsx
<th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/4" 
  style={{ color: 'rgb(var(--muted-foreground))' }}>
  Kolonne Navn
</th>
```

### Table Row (med hover)

```jsx
<tr 
  className="transition-colors" 
  style={{ 
    borderTop: index > 0 ? `1px solid rgb(var(--border))` : 'none'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  }}>
  {/* Cells */}
</tr>
```

### Table Cell Patterns

```jsx
// Standard cell
<td className="px-6 py-6">
  <div>
    <div className="text-sm font-medium truncate">{title}</div>
    <div className="text-xs mt-2" style={{ color: 'rgb(var(--muted-foreground))' }}>
      {metadata}
    </div>
  </div>
</td>

// Action cell
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
  <div className="flex space-x-2">
    <button className="text-blue-600 hover:text-blue-900" title="Se">
      <Eye size={16} />
    </button>
    <button className="text-orange-600 hover:text-orange-900" title="Rediger">
      <Edit size={16} />
    </button>
  </div>
</td>
```

### Loading State

```jsx
<tr>
  <td colSpan={6} className="px-6 py-12 text-center">
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2" 
        style={{ borderColor: 'rgb(var(--orange-primary))' }}></div>
      <span className="ml-2" style={{ color: 'rgb(var(--foreground))' }}>
        Laster...
      </span>
    </div>
  </td>
</tr>
```

### Empty State

```jsx
<tr>
  <td colSpan={6} className="px-6 py-12 text-center">
    <Icon className="mx-auto h-12 w-12" 
      style={{ color: 'rgb(var(--muted-foreground))' }} />
    <h3 className="mt-2 text-sm font-medium" 
      style={{ color: 'rgb(var(--foreground))' }}>
      Ingen data funnet
    </h3>
    <p className="mt-1 text-sm" 
      style={{ color: 'rgb(var(--muted-foreground))' }}>
      Prøv å justere søkekriteriene dine.
    </p>
  </td>
</tr>
```

---

## 🪟 Modaler

### Overlay og Container

```jsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
  <div className="w-full h-full sm:rounded-lg sm:shadow-xl sm:w-full sm:max-w-4xl sm:max-h-[90vh] overflow-hidden flex flex-col" 
    style={{ 
      backgroundColor: 'rgb(var(--background))', 
      border: '1px solid rgb(var(--border))' 
    }}>
    {/* Header */}
    {/* Content */}
    {/* Footer */}
  </div>
</div>
```

### Modal Header

```jsx
<div className="flex items-center justify-between p-4 sm:p-6 sticky top-0 z-10" 
  style={{ 
    backgroundColor: 'rgb(var(--background))', 
    borderBottom: '1px solid rgb(var(--border))' 
  }}>
  <h2 className="text-lg sm:text-xl font-semibold heading" 
    style={{ color: 'rgb(var(--foreground))' }}>
    Modal Tittel
  </h2>
  <button onClick={onClose} className="p-1 rounded transition-all duration-200"
    style={{ color: 'rgb(var(--muted-foreground))' }}>
    <X size={20} />
  </button>
</div>
```

### Modal Content (scrollable)

```jsx
<div className="flex-1 overflow-y-auto p-4 sm:p-6">
  {/* Innhold */}
</div>
```

### Modal Footer

```jsx
<div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 sm:gap-4 p-4 sm:p-6 sticky bottom-0" 
  style={{ 
    borderTop: '1px solid rgb(var(--border))', 
    backgroundColor: 'rgb(var(--muted))' 
  }}>
  <button className="px-4 py-2 rounded-lg order-2 sm:order-1"
    style={{ 
      backgroundColor: 'rgb(var(--background))',
      color: 'rgb(var(--muted-foreground))',
      border: '1px solid rgb(var(--border))'
    }}>
    Lukk
  </button>
  <button className="px-4 py-2 rounded-lg text-white order-1 sm:order-2"
    style={{ backgroundColor: 'rgb(var(--orange-primary))' }}>
    Lagre
  </button>
</div>
```

---

## 🔘 Knapper

### Primary Button (Orange)

```jsx
<button className="px-4 py-2 text-white rounded-lg transition-colors"
  style={{ backgroundColor: 'rgb(var(--orange-primary))' }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'rgb(var(--orange-600))';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'rgb(var(--orange-primary))';
  }}>
  Knapp tekst
</button>
```

### Secondary Button (Outlined)

```jsx
<button className="px-4 py-2 rounded-lg transition-colors"
  style={{ 
    border: '1px solid rgb(var(--border))', 
    color: 'rgb(var(--foreground))' 
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  }}>
  Knapp tekst
</button>
```

### Icon Button

```jsx
<button className="text-blue-600 hover:text-blue-900" title="Tooltip">
  <Icon size={16} />
</button>
```

### Disabled State

```jsx
<button disabled className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
  Deaktivert
</button>
```

### Loading State

```jsx
<button className="flex items-center gap-2 px-4 py-2 rounded-lg"
  style={{ backgroundColor: 'rgb(var(--orange-primary))' }}>
  <Loader2 className="w-4 h-4 animate-spin" />
  <span>Laster...</span>
</button>
```

---

## 🏷️ Badges og Status

### Status Badge Pattern

```jsx
<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
  {icon && <Icon size={16} />}
  {text}
</span>
```

### Status Colors

```jsx
// Success/Publisert/Aktiv
className="bg-green-100 text-green-800"

// Pending/Utkast/Venter
className="bg-yellow-100 text-yellow-800"

// Info/Default
className="bg-blue-100 text-blue-800"

// Inactive/Avsluttet
className="bg-gray-100 text-gray-800"

// Error/Kritisk
className="bg-red-100 text-red-800"

// Warning/Høy prioritet
className="bg-orange-100 text-orange-800"
```

### Med Ikon

```jsx
<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
  <CheckCircle2 size={16} />
  Publisert
</span>
```

---

## 📄 Paginering

### Layout

```jsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
  {/* Info text */}
  <div className="text-xs sm:text-sm order-2 sm:order-1">
    Side {page} av {totalPages}
  </div>
  
  {/* Buttons */}
  <div className="flex justify-center sm:justify-end space-x-1 sm:space-x-2 order-1 sm:order-2">
    <button>Forrige</button>
    <button>1</button>
    <button>Neste</button>
  </div>
</div>
```

### Pagination Button (Inactive)

```jsx
<button 
  className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50"
  style={{ border: '1px solid rgb(var(--border))', color: 'rgb(var(--foreground))' }}
  onMouseEnter={(e) => {
    if (!e.currentTarget.disabled) {
      e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
    }
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  }}>
  <span className="hidden sm:inline">Forrige</span>
  <span className="sm:hidden">‹</span>
</button>
```

### Pagination Button (Active)

```jsx
<button 
  className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md"
  style={{ backgroundColor: 'rgb(var(--orange-primary))', color: 'white' }}>
  {currentPage}
</button>
```

---

## 📱 Responsivt Design

### Breakpoints

```jsx
// Mobile first approach
className="text-sm sm:text-base lg:text-lg"
className="p-3 sm:p-6"
className="gap-3 sm:gap-4 lg:gap-6"

// Grid responsive
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"

// Flex responsive
className="flex-col sm:flex-row"
```

### Mobile Patterns

```jsx
// Hide on mobile, show on desktop
className="hidden sm:inline"
className="hidden sm:block"

// Show on mobile, hide on desktop
className="sm:hidden"

// Responsive text
<span className="hidden sm:inline">Full text</span>
<span className="sm:hidden">Short</span>
```

### Table Width Management

```jsx
// Fixed widths for desktop
className="w-1/4"  // 25%
className="w-1/5"  // 20%
className="w-1/6"  // ~16.6%
className="w-20"   // Fixed 80px
className="w-32"   // Fixed 128px
```

---

## ✨ Animasjoner

### Hover Transitions

```jsx
// Standard transition
className="transition-colors"
className="transition-all duration-200"

// Custom transition
onMouseEnter={(e) => {
  e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.backgroundColor = 'transparent';
}}
```

### Loading Spinner

```jsx
<div className="animate-spin rounded-full h-6 w-6 border-b-2" 
  style={{ borderColor: 'rgb(var(--orange-primary))' }}>
</div>

// Med Lucide Icon
<RefreshCw className="w-4 h-4 animate-spin" />
<Loader2 className="w-4 h-4 animate-spin" />
```

### Typing Animation (for chat)

```jsx
<div className="typing-animation">
  <span className="typing-dot"></span>
  <span className="typing-dot"></span>
  <span className="typing-dot"></span>
</div>
```

---

## 🎯 Form Elements

### Input Field

```jsx
<input
  type="text"
  placeholder="Placeholder..."
  className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all duration-200"
  style={{ 
    backgroundColor: 'rgb(var(--background))',
    border: error ? '1px solid rgb(var(--orange-primary))' : '1px solid rgb(var(--border))',
    color: 'rgb(var(--foreground))'
  }}
  onFocus={(e) => {
    e.target.style.borderColor = 'rgb(var(--orange-primary))';
    e.target.style.boxShadow = '0 0 0 2px rgba(249, 115, 22, 0.1)';
  }}
  onBlur={(e) => {
    e.target.style.borderColor = error ? 'rgb(var(--orange-primary))' : 'rgb(var(--border))';
    e.target.style.boxShadow = 'none';
  }}
/>
```

### Textarea

```jsx
<textarea
  rows={3}
  className="w-full px-4 py-2 rounded-lg focus:outline-none resize-none"
  style={{ 
    border: '1px solid rgb(var(--border))',
    backgroundColor: 'rgb(var(--background))',
    color: 'rgb(var(--foreground))'
  }}
  placeholder="Skriv her..."
/>
```

### Checkbox

```jsx
<label className="flex items-center space-x-2 cursor-pointer">
  <input
    type="checkbox"
    checked={value}
    onChange={(e) => setValue(e.target.checked)}
    className="w-4 h-4 rounded transition-colors"
    style={{ 
      accentColor: 'rgb(var(--orange-primary))',
      borderColor: 'rgb(var(--border))'
    }}
  />
  <span className="text-sm font-medium" 
    style={{ color: 'rgb(var(--foreground))' }}>
    Label
  </span>
</label>
```

### Label

```jsx
<label className="block text-sm font-medium mb-2" 
  style={{ color: 'rgb(var(--foreground))' }}>
  Label tekst *
</label>
```

### Error Message

```jsx
{error && (
  <p className="mt-1 text-sm" 
    style={{ color: 'rgb(var(--orange-primary))' }}>
    {error}
  </p>
)}
```

### Helper Text

```jsx
<p className="mt-1 text-xs" 
  style={{ color: 'rgb(var(--muted-foreground))' }}>
  💡 Tips: Dette er en hjelpetekst
</p>
```

---

## 🚨 Error & Alert States

### Error Alert

```jsx
<div className="rounded-lg p-4 bg-red-50 border border-red-200 flex items-center gap-3">
  <AlertCircle className="w-5 h-5 text-red-600" />
  <div>
    <h3 className="font-medium text-red-800">Feil ved lasting av data</h3>
    <p className="text-sm text-red-600">{errorMessage}</p>
  </div>
</div>
```

### Success Alert

```jsx
<div className="rounded-lg p-4 bg-green-50 border border-green-200">
  <div className="flex items-center gap-2 text-green-800">
    <CheckCircle2 size={16} />
    <span className="text-sm font-medium">Lagret!</span>
  </div>
</div>
```

### Info Alert

```jsx
<div className="rounded-lg p-4 bg-blue-50 border border-blue-200">
  <div className="text-sm text-blue-800">{infoMessage}</div>
</div>
```

---

## 📚 Eksempel: Komplett Tab Template

```jsx
const NewTabManager: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6" 
      style={{ maxWidth: 'var(--container-max-width)', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold heading" 
            style={{ color: 'rgb(var(--foreground))' }}>
            Tab Navn
          </h1>
          <p className="text-sm sm:text-base" 
            style={{ color: 'rgb(var(--muted-foreground))' }}>
            Beskrivelse av funksjonalitet
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* 4 stat cards her */}
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg p-3 sm:p-4 shadow-sm" 
        style={{ 
          backgroundColor: 'rgb(var(--card))', 
          border: '1px solid rgb(var(--border))' 
        }}>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Søkefelt og filtre */}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg shadow-sm overflow-hidden" 
        style={{ 
          backgroundColor: 'rgb(var(--card))', 
          border: '1px solid rgb(var(--border))' 
        }}>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            {/* Table content */}
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        {/* Pagination controls */}
      </div>
    </div>
  );
};
```

---

## 🎨 Icon Library (Lucide React)

### Ofte brukte ikoner:

```jsx
import { 
  FileText,      // Dokumenter/Blog
  Mail,          // E-post
  MessageSquare, // Chat
  User,          // Bruker
  Bot,           // AI
  Eye,           // Se/View
  Edit,          // Rediger
  Trash,         // Slett
  Save,          // Lagre
  X,             // Lukk
  RefreshCw,     // Oppdater/Refresh
  Loader2,       // Loading spinner
  AlertCircle,   // Error/Alert
  CheckCircle2,  // Success
  Clock,         // Tid/Venter
  Calendar,      // Dato
  Search,        // Søk
  Plus,          // Legg til
  Settings,      // Innstillinger
  LogOut,        // Logg ut
} from 'lucide-react';
```

### Standard størrelser:

```jsx
<Icon size={12} />  // Extra small
<Icon size={16} />  // Small (standard i badges og table actions)
<Icon size={20} />  // Medium (standard i buttons)
<Icon size={24} />  // Large (modals, headers)
<Icon className="w-4 h-4" />  // Tailwind small (16px)
<Icon className="w-5 h-5" />  // Tailwind medium (20px)
<Icon className="w-6 h-6" />  // Tailwind large (24px)
<Icon className="w-12 h-12" />  // Empty states (48px)
```

---

## ✅ Sjekkliste for Nye Tabs

Når du lager en ny tab, sørg for at du har:

- [ ] Brukt standard container pattern med `space-y-4 sm:space-y-6` og `p-3 sm:p-6`
- [ ] Lagt til header med tittel og beskrivelse
- [ ] Laget 4 stats cards i grid layout
- [ ] Implementert søk og filter section
- [ ] Brukt standard table structure med hover states
- [ ] Lagt til loading og empty states
- [ ] Implementert paginering med standard buttons
- [ ] Testet i både lys og mørk modus
- [ ] Testet responsivt design (mobile, tablet, desktop)
- [ ] Brukt konsistente farger fra CSS custom properties
- [ ] Brukt riktig typografi (Inter for body, "video" for headings)
- [ ] Implementert hover/focus states på alle interaktive elementer
- [ ] Brukt `rgb(var(--variabel))` format for alle farger

---

**🎨 Style guide sist oppdatert: 2024**  
**📝 For spørsmål eller tillegg, se eksisterende komponenter for referanse**

