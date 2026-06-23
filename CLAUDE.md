# ResearchPilot — CLAUDE.md

Questo file fornisce contesto per Claude Code. Leggilo prima di fare qualsiasi modifica.

## Cos'è questo progetto

ResearchPilot è un copilota AI per ricercatori in ambito medico. L'obiettivo è ridurre il tempo sprecato in task ripetitivi (lettura paper, scrittura manoscritti, analisi dati, grant writing, compliance) e lasciare al ricercatore solo il lavoro intellettuale vero.

## Stack

- **Framework**: Next.js 14, App Router, TypeScript strict
- **Styling**: Tailwind CSS + shadcn/ui (componenti in `src/components/ui/`)
- **Auth + DB**: Supabase (PostgreSQL con RLS, auth email/password)
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`)
  - Sintesi paper → `claude-haiku-4-5-20251001` (veloce, economico)
  - Chat letteratura → `claude-sonnet-4-6` (più capace)
- **Dati esterni**: PubMed E-utilities API (no auth necessaria, opzionale API key)
- **Deploy**: Vercel

## Struttura cartelle

```
src/
├── app/
│   ├── api/literature/         # Route API modulo Literature
│   │   ├── search/route.ts     # Ricerca PubMed + scoring rilevanza
│   │   ├── synthesize/route.ts # Sintesi abstract con Claude Haiku
│   │   ├── ask/route.ts        # Chat sulla letteratura con Claude Sonnet
│   │   └── save/route.ts       # Salvataggio paper su Supabase
│   ├── auth/callback/route.ts  # Callback OAuth Supabase
│   ├── dashboard/
│   │   ├── layout.tsx          # Layout con sidebar, protetto da auth
│   │   ├── page.tsx            # Redirect a /dashboard/literature
│   │   └── literature/page.tsx # Pagina principale modulo Literature
│   ├── login/page.tsx          # Login + signup (client component)
│   ├── page.tsx                # Root: redirect a dashboard o login
│   ├── layout.tsx              # Root layout (font, metadata)
│   └── globals.css             # CSS variables shadcn + Tailwind base
├── components/
│   ├── layout/
│   │   └── sidebar.tsx         # Sidebar con nav moduli (client component)
│   ├── literature/
│   │   ├── paper-card.tsx      # Card paper con abstract, AI summary, save
│   │   ├── research-context-form.tsx  # Form setup contesto ricerca
│   │   └── literature-chat.tsx # Chat AI sulla letteratura
│   └── ui/                     # Badge, Button, Card, Input, Textarea
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client (uso in client components)
│   │   └── server.ts           # Server client (uso in server components/API)
│   └── utils.ts                # cn() helper per Tailwind
├── middleware.ts                # Protezione route /dashboard, redirect login
└── types/database.ts           # Tipi Supabase + tipi app (Paper, ResearchContext, ChatMessage)
```

## Variabili d'ambiente richieste

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
PUBMED_API_KEY          # opzionale
```

## Schema database Supabase

Tre tabelle principali (schema completo in `supabase-schema.sql`):
- `profiles` — creata automaticamente al signup via trigger
- `research_contexts` — contesto di ricerca dell'utente (topic, popolazione, outcome, keywords)
- `saved_papers` — paper salvati con metadati PubMed + sintesi AI

Tutte le tabelle hanno RLS abilitato: ogni utente vede solo i propri dati.

## Moduli

### ✅ Literature Intelligence (completato v0.1)
- Setup contesto di ricerca personalizzato
- Ricerca paper PubMed con scoring rilevanza basato sul contesto
- Sintesi abstract con Claude Haiku
- Chat sulla letteratura con Claude Sonnet (mantiene history ultimi 6 messaggi)
- Salvataggio paper su Supabase

### 🔜 Manuscript Copilot (da costruire)
- Scrittura assistita di manoscritti scientifici (Intro, Methods, Discussion)
- Formattazione automatica per rivista target
- Gestione co-autori e versioning
- Risposta assistita ai reviewer comments
- Route API: `/api/manuscript/`
- Componenti in: `src/components/manuscript/`
- Pagina: `src/app/dashboard/manuscript/page.tsx`

### 🔜 Data Analysis Layer (da costruire)
- Upload dataset (CSV, Excel)
- Analisi in linguaggio naturale → codice R/Python eseguito
- Figure publication-ready
- Route API: `/api/analysis/`

### 🔜 Grant Builder (da costruire)
- Template per NIH, ERC, AIRC, Horizon Europe
- Bozza assistita per sezione
- Reviewer simulator
- Route API: `/api/grants/`

### 🔜 Compliance Tracker (da costruire)
- Checklist IRB, GDPR, registrazione trial
- Dashboard scadenze con semaforo
- Route API: `/api/compliance/`

## Convenzioni di codice

- Componenti **server** di default; aggiungi `"use client"` solo se necessario (eventi, state, hooks)
- I client Supabase vanno importati dal path corretto: `@/lib/supabase/client` (browser) o `@/lib/supabase/server` (server/API)
- I tipi condivisi stanno tutti in `src/types/database.ts`
- Le API route restituiscono sempre `{ error: string }` in caso di errore con status code appropriato
- I componenti UI usano `cn()` da `@/lib/utils` per le classi Tailwind condizionali
- Nessun `any` — usare i tipi definiti in `database.ts`

## Prossimi passi suggeriti

1. Aggiungere la **paper library** (saved papers con filtri e tag) nella sezione Literature
2. Costruire il **Manuscript Copilot** — è il secondo modulo per valore percepito
3. Aggiungere una **digest giornaliera** via cron job Vercel + email (Resend)
