"use client";

import Link from "next/link";
import { BookOpen, FileText, BarChart2, ArrowRight, FlaskConical } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

const MODULES = [
  {
    href: "/dashboard/literature",
    icon: BookOpen,
    bg: "bg-blue-50",
    border: "border-blue-200 hover:border-blue-400",
    iconColor: "text-blue-600",
    ring: "group-hover:ring-blue-100",
    label: { it: "Literature Intelligence", en: "Literature Intelligence" },
    desc: {
      it: "Cerca su PubMed, leggi sintesi AI e chatta con la letteratura scientifica salvata.",
      en: "Search PubMed, read AI summaries, and chat with your saved scientific literature.",
    },
  },
  {
    href: "/dashboard/manuscript",
    icon: FileText,
    bg: "bg-violet-50",
    border: "border-violet-200 hover:border-violet-400",
    iconColor: "text-violet-600",
    ring: "group-hover:ring-violet-100",
    label: { it: "Manuscript Copilot", en: "Manuscript Copilot" },
    desc: {
      it: "Editor IMRaD con AI writing assistant, generazione outline e export PDF.",
      en: "IMRaD editor with AI writing assistant, outline generation and PDF export.",
    },
  },
  {
    href: "/dashboard/analysis",
    icon: BarChart2,
    bg: "bg-teal-50",
    border: "border-teal-200 hover:border-teal-400",
    iconColor: "text-teal-600",
    ring: "group-hover:ring-teal-100",
    label: { it: "Data Analysis", en: "Data Analysis" },
    desc: {
      it: "Analisi statistica in linguaggio naturale: t-test, ANOVA, regressione e grafici SVG.",
      en: "Natural language statistical analysis: t-test, ANOVA, regression and SVG charts.",
    },
  },
];

export default function DashboardHome() {
  const { lang } = useLanguage();

  const greeting = lang === "en" ? "Welcome to ResearchPilot" : "Benvenuto in ResearchPilot";
  const subtitle =
    lang === "en"
      ? "Your AI copilot for medical research. Choose a module to get started."
      : "Il tuo copilota AI per la ricerca medica. Scegli un modulo per iniziare.";
  const moduleTitle = lang === "en" ? "Available modules" : "Moduli disponibili";

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      {/* Hero */}
      <div className="bg-white border-b border-slate-200 px-8 py-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{greeting}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="flex-1 px-8 py-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          {moduleTitle}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          {MODULES.map(({ href, icon: Icon, bg, border, iconColor, ring, label, desc }) => (
            <Link
              key={href}
              href={href}
              className={`group flex flex-col bg-white border rounded-2xl p-5 transition-all hover:shadow-md ring-2 ring-transparent ${border} ${ring}`}
            >
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <h2 className="text-sm font-semibold text-slate-800 mb-1.5">{label[lang]}</h2>
              <p className="text-xs text-slate-500 leading-relaxed flex-1">{desc[lang]}</p>
              <div className={`flex items-center gap-1 text-xs font-medium mt-4 ${iconColor}`}>
                {lang === "en" ? "Open" : "Apri"}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
