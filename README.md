# ResearchPilot

Medical Research Copilot — AI per ricercatori in ambito medico.

## Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + Auth)
- **AI**: Anthropic Claude API
- **Dati**: PubMed E-utilities API
- **Deploy**: Vercel

## Setup locale

### 1. Clona e installa dipendenze
```bash
git clone <repo-url>
cd researchpilot
npm install
```

### 2. Configura Supabase
1. Crea un progetto su [supabase.com](https://supabase.com)
2. Vai su **SQL Editor** ed esegui il file `supabase-schema.sql`
3. Copia URL e chiavi dal pannello **Settings > API**

### 3. Configura le variabili d'ambiente
```bash
cp .env.local.example .env.local
```
Compila il file con le tue chiavi:
- `NEXT_PUBLIC_SUPABASE_URL` — dal pannello Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — dal pannello Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — dal pannello Supabase
- `ANTHROPIC_API_KEY` — da [console.anthropic.com](https://console.anthropic.com)
- `PUBMED_API_KEY` — opzionale, da [NCBI](https://www.ncbi.nlm.nih.gov/account/)

### 4. Avvia in sviluppo
```bash
npm run dev
```
Apri [http://localhost:3000](http://localhost:3000)

## Deploy su Vercel

```bash
npx vercel --prod
```
Aggiungi le stesse variabili d'ambiente nel pannello Vercel > Settings > Environment Variables.

## Struttura del progetto

```
src/
├── app/
│   ├── api/literature/     # API routes (search, synthesize, ask, save)
│   ├── auth/callback/      # Supabase auth callback
│   ├── dashboard/
│   │   └── literature/     # Modulo Literature Intelligence
│   └── login/              # Pagina di login/signup
├── components/
│   ├── layout/             # Sidebar
│   ├── literature/         # Paper card, chat, context form
│   └── ui/                 # shadcn/ui components
├── lib/supabase/           # Client browser + server
└── types/database.ts       # Tipi TypeScript
```

## Funzionalità attuali (v0.1)

- Autenticazione via Supabase (email/password)
- **Literature Intelligence**
  - Setup contesto di ricerca (topic, popolazione, outcome, keywords)
  - Ricerca paper su PubMed con scoring di rilevanza AI
  - Sintesi automatica degli abstract con Claude
  - Chat sulla letteratura con memoria del contesto
  - Salvataggio paper su database

## Roadmap

- [ ] Manuscript Copilot
- [ ] Data Analysis Layer
- [ ] Grant Builder
- [ ] Compliance Tracker
- [ ] Paper library personale con tag e note
- [ ] Digest giornaliera automatica via email
