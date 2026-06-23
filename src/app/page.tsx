import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  FlaskConical, BookOpen, FileText, BarChart2,
  DollarSign, ClipboardList, ArrowRight, CheckCircle2, Clock, Sparkles, ChevronRight,
} from "lucide-react";

const MODULES = [
  {
    icon: BookOpen,
    label: "Literature Intelligence",
    description: "Ricerca su PubMed, sintesi AI degli abstract e chat con la letteratura scientifica.",
    available: true,
    color: "from-blue-500 to-blue-700",
    bg: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
  },
  {
    icon: FileText,
    label: "Manuscript Copilot",
    description: "Editor IMRaD con generazione outline, AI writing assistant e export PDF.",
    available: true,
    color: "from-violet-500 to-violet-700",
    bg: "bg-violet-50 border-violet-200",
    iconColor: "text-violet-600",
  },
  {
    icon: BarChart2,
    label: "Data Analysis",
    description: "Analisi statistica in linguaggio naturale: t-test, ANOVA, regressione, correlazioni e grafici SVG.",
    available: true,
    color: "from-teal-500 to-teal-700",
    bg: "bg-teal-50 border-teal-200",
    iconColor: "text-teal-600",
  },
  {
    icon: DollarSign,
    label: "Grant Builder",
    description: "Redazione assistita di grant, budget e sezioni di rilevanza clinica.",
    available: false,
    color: "from-amber-500 to-amber-700",
    bg: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
  },
  {
    icon: ClipboardList,
    label: "Compliance",
    description: "Gestione IRB, GDPR, scadenze etiche e checklist per submission.",
    available: false,
    color: "from-rose-500 to-rose-700",
    bg: "bg-rose-50 border-rose-200",
    iconColor: "text-rose-600",
  },
];

const STATS = [
  { value: "5", label: "Moduli AI integrati" },
  { value: "PubMed", label: "Database collegato" },
  { value: "Claude", label: "AI engine" },
  { value: "GDPR", label: "Compliant" },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-50 bg-slate-950/70">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <FlaskConical className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">ResearchPilot</span>
            <span className="text-[10px] font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-full px-2 py-0.5 ml-1">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Accedi
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium bg-blue-600 hover:bg-blue-500 transition-colors px-4 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              Inizia gratis
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium bg-blue-600/15 text-blue-400 border border-blue-600/25 rounded-full px-4 py-1.5 mb-8">
          <Sparkles className="h-3 w-3" />
          Powered by Claude · Anthropic AI
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
          Il copilota AI per la
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            ricerca medica
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Dalla ricerca bibliografica alla submission del manoscritto.
          ResearchPilot accelera ogni fase del tuo workflow scientifico con AI avanzata.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 text-sm"
          >
            Inizia gratuitamente
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#modules"
            className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Scopri i moduli
          </a>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-slate-900/60 p-6 text-center">
              <div className="text-2xl font-bold text-white mb-1">{value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Modules ────────────────────────────────────────────────────── */}
      <section id="modules" className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Moduli disponibili</h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Ogni modulo è progettato per uno specifico momento del processo di ricerca. Usa solo quello che ti serve.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map(({ icon: Icon, label, description, available, bg, iconColor }) => (
            <div
              key={label}
              className={`relative rounded-2xl border p-5 transition-all ${
                available
                  ? "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                  : "bg-white/[0.01] border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg} shrink-0`}>
                  <Icon className={`h-4.5 w-4.5 ${iconColor}`} style={{ width: 18, height: 18 }} />
                </div>
                {available ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Disponibile
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    Prossimamente
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-sm text-white mb-1.5">{label}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="border-t border-white/10 bg-slate-900/40 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-10">Come funziona</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Carica il tuo contesto",
                desc: "Definisci topic, popolazione e outcome della tua ricerca.",
              },
              {
                step: "02",
                title: "Esplora la letteratura",
                desc: "Cerca su PubMed, leggi le sintesi AI e salva i paper rilevanti.",
              },
              {
                step: "03",
                title: "Scrivi e analizza",
                desc: "Genera il manoscritto, analizza i dati, esporta in PDF.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-left">
                <div className="text-4xl font-black text-white/10 mb-3 font-mono">{step}</div>
                <h3 className="font-semibold text-sm text-white mb-1.5">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA bottom ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FlaskConical className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Pronto a iniziare?</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
            Crea un account gratuito e inizia a usare ResearchPilot in pochi secondi. Nessuna carta di credito richiesta.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 text-sm"
          >
            Crea account gratuito
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FlaskConical className="h-3.5 w-3.5" />
            ResearchPilot v0.1.0 Beta — Medical Research Copilot
          </div>
          <p className="text-xs text-slate-600">
            Powered by Anthropic Claude · Not for clinical decision-making
          </p>
        </div>
      </footer>
    </div>
  );
}
