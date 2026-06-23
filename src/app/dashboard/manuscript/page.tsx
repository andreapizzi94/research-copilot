"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText, Plus, Loader2, Save, Sparkles, BookMarked,
  ChevronLeft, Eye, Code2, Clock, Trash2, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SectionNav } from "@/components/manuscript/section-nav";
import { AssistPanel } from "@/components/manuscript/assist-panel";
import { CitationPicker } from "@/components/manuscript/citation-picker";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { getT } from "@/lib/i18n";
import type {
  Manuscript, ManuscriptSection, ManuscriptStatus,
  ManuscriptSummary, Paper, ResearchContext
} from "@/types/database";
import type { Lang } from "@/contexts/language-context";

// ── PDF export ────────────────────────────────────────────────────────────────
function mdToPlainHTML(text: string): string {
  if (!text) return "";
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = escaped.split("\n");
  let html = "";
  let inPara = false;

  for (const line of lines) {
    if (!line.trim()) {
      if (inPara) { html += "</p>"; inPara = false; }
      continue;
    }
    const processed = line
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+?),\s*(\d{4})\]/g, "<sup>[$1, $2]</sup>")
      .replace(/\[(\d+)\]/g, "<sup>[$1]</sup>");

    if (line.startsWith("## ")) {
      if (inPara) { html += "</p>"; inPara = false; }
      html += `<h3>${processed.slice(3)}</h3>`;
    } else if (line.startsWith("### ")) {
      if (inPara) { html += "</p>"; inPara = false; }
      html += `<h4>${processed.slice(4)}</h4>`;
    } else {
      if (!inPara) { html += "<p>"; inPara = true; } else html += " ";
      html += processed;
    }
  }
  if (inPara) html += "</p>";
  return html;
}

function buildPrintHTML(ms: Manuscript, lang: Lang): string {
  const sectionLabels =
    lang === "en"
      ? { introduction: "Introduction", methods: "Methods", results: "Results", discussion: "Discussion" }
      : { introduction: "Introduzione", methods: "Metodi", results: "Risultati", discussion: "Discussione" };

  const sections = (
    [
      { key: "introduction", label: sectionLabels.introduction, content: ms.introduction },
      { key: "methods",      label: sectionLabels.methods,      content: ms.methods },
      { key: "results",      label: sectionLabels.results,      content: ms.results },
      { key: "discussion",   label: sectionLabels.discussion,   content: ms.discussion },
    ] as const
  ).filter((s) => s.content.trim());

  const titleEsc = ms.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const dateStr = new Date().toLocaleDateString(lang === "en" ? "en-US" : "it-IT", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${titleEsc}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 2.5cm 3cm; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.8; color: #000; background: #fff; }
    .title { font-size: 20pt; font-weight: bold; text-align: center; margin-bottom: 8pt; line-height: 1.3; }
    .meta { text-align: center; font-size: 10pt; color: #555; border-bottom: 1pt solid #ccc; padding-bottom: 14pt; margin-bottom: 22pt; }
    .section { margin-bottom: 24pt; page-break-inside: avoid; }
    .section-title { font-size: 12pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8pt; border-bottom: 1pt solid #000; padding-bottom: 3pt; margin-bottom: 10pt; }
    p { margin-bottom: 9pt; text-align: justify; hyphens: auto; }
    h3 { font-size: 12pt; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; }
    h4 { font-size: 11pt; font-weight: bold; font-style: italic; margin-top: 8pt; margin-bottom: 3pt; }
    sup { font-size: 8pt; vertical-align: super; line-height: 0; }
    strong { font-weight: bold; }
    em { font-style: italic; }
    .footer { text-align: center; font-size: 9pt; color: #aaa; margin-top: 30pt; padding-top: 10pt; border-top: 0.5pt solid #ddd; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="title">${titleEsc}</div>
  <div class="meta">ResearchPilot · ${dateStr}</div>
  ${sections.map((s) => `<div class="section"><div class="section-title">${s.label}</div>${mdToPlainHTML(s.content)}</div>`).join("\n")}
  <div class="footer">Generated with ResearchPilot — Not for clinical decision-making</div>
  <script>
    window.onload = function() {
      document.querySelector('.no-print') && document.querySelector('.no-print').remove();
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;
}

function exportToPDF(ms: Manuscript, lang: Lang) {
  const html = buildPrintHTML(ms, lang);
  const w = window.open("", "_blank", "width=900,height=700,scrollbars=yes");
  if (!w) {
    alert(lang === "en" ? "Popup blocked. Allow popups for this site." : "Popup bloccato. Consenti i popup per questo sito.");
    return;
  }
  w.document.write(html);
  w.document.close();
}

// ── Status labels per lingua ──────────────────────────────────────────────────
function getStatusLabels(lang: Lang): Record<ManuscriptStatus, string> {
  return lang === "en"
    ? { draft: "Draft", review: "Under review", final: "Final" }
    : { draft: "Bozza", review: "In revisione", final: "Finale" };
}

const STATUS_COLORS: Record<ManuscriptStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  review: "bg-amber-100 text-amber-700",
  final: "bg-green-100 text-green-700",
};

const SECTION_PLACEHOLDERS: Record<ManuscriptSection, string> = {
  introduction: "Inizia con il background del tuo studio...\n\nEsempio:\n## Background\nL'ipertensione arteriosa rappresenta uno dei principali fattori di rischio cardiovascolare [1]...\n\n## Razionale\n...\n\n## Obiettivi\n...",
  methods: "Descrivi il disegno dello studio, la popolazione e gli outcome misurati...\n\nEsempio:\n## Disegno dello studio\nStudio osservazionale prospettico condotto presso...\n\n## Popolazione\n...\n\n## Outcome primari e secondari\n...",
  results: "Presenta i tuoi dati e analisi statistiche...\n\nEsempio:\n## Caratteristiche basali\nSono stati arruolati N pazienti (età media ± SD)...\n\n## Outcome primario\n...",
  discussion: "Interpreta i risultati, discuti le limitazioni e le implicazioni cliniche...\n\nEsempio:\n## Principali risultati\nIl presente studio dimostra che...\n\n## Limitazioni\n...\n\n## Conclusioni\n...",
};

function parseMarkdown(text: string): string {
  if (!text) return "<p class=\"text-slate-400 italic text-sm\">Nessun contenuto ancora.</p>";

  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = escaped.split("\n");
  let html = "";
  let inPara = false;

  for (const line of lines) {
    if (!line.trim()) {
      if (inPara) { html += "</p>"; inPara = false; }
      continue;
    }

    const inline = line
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(\d+)\]/g, '<sup class="text-blue-600 font-semibold">[$1]</sup>')
      .replace(/\[([^\]]+?),\s*(\d{4})\]/g, '<sup class="text-blue-600 font-semibold">[$1, $2]</sup>');

    if (line.startsWith("## ")) {
      if (inPara) { html += "</p>"; inPara = false; }
      html += `<h2 class="text-base font-semibold text-slate-800 mt-5 mb-2">${inline.slice(3)}</h2>`;
    } else if (line.startsWith("### ")) {
      if (inPara) { html += "</p>"; inPara = false; }
      html += `<h3 class="text-sm font-semibold text-slate-700 mt-3 mb-1">${inline.slice(4)}</h3>`;
    } else {
      if (!inPara) { html += '<p class="text-slate-700 text-sm leading-relaxed mb-3">'; inPara = true; }
      else html += " ";
      html += inline;
    }
  }

  if (inPara) html += "</p>";
  return html;
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

const EMPTY_MANUSCRIPT: Omit<Manuscript, "id"> = {
  title: "Nuovo manoscritto",
  introduction: "",
  methods: "",
  results: "",
  discussion: "",
  status: "draft",
  citedPaperIds: [],
};

export default function ManuscriptPage() {
  const supabase = createClient();
  const { lang } = useLanguage();
  const t = getT(lang);
  const STATUS_LABELS = getStatusLabels(lang);

  const [view, setView] = useState<"list" | "editor">("list");
  const [manuscripts, setManuscripts] = useState<ManuscriptSummary[]>([]);
  const [manuscript, setManuscript] = useState<Manuscript>({ ...EMPTY_MANUSCRIPT });
  const [activeSection, setActiveSection] = useState<ManuscriptSection>("introduction");
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const [savedPapers, setSavedPapers] = useState<Paper[]>([]);
  const [researchContext, setResearchContext] = useState<ResearchContext | null>(null);
  const [loadingList, setLoadingList] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPosRef = useRef<number>(0);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load manuscripts list + saved papers + latest research context
  useEffect(() => {
    async function load() {
      setLoadingList(true);
      const [msResult, papersResult, ctxResult] = await Promise.all([
        supabase
          .from("manuscripts")
          .select("id, title, status, updated_at, introduction")
          .order("updated_at", { ascending: false }),
        supabase
          .from("saved_papers")
          .select("id, pubmed_id, title, authors, year, journal, abstract, ai_summary, relevance_score")
          .order("created_at", { ascending: false }),
        supabase
          .from("research_contexts")
          .select("id, topic, population, outcomes, keywords")
          .order("updated_at", { ascending: false })
          .limit(1),
      ]);

      if (msResult.data) {
        setManuscripts(
          msResult.data.map((m) => ({
            id: m.id,
            title: m.title,
            status: (m.status as ManuscriptStatus) ?? "draft",
            updatedAt: m.updated_at,
            introPreview: (m.introduction ?? "").slice(0, 120),
          }))
        );
      }

      if (papersResult.data) {
        setSavedPapers(
          papersResult.data.map((p) => ({
            id: p.id,
            pubmedId: p.pubmed_id,
            title: p.title,
            authors: p.authors ?? [],
            abstract: p.abstract ?? "",
            journal: p.journal ?? "",
            year: p.year ?? 0,
            aiSummary: p.ai_summary ?? undefined,
            relevanceScore: p.relevance_score ?? undefined,
          }))
        );
      }

      if (ctxResult.data?.[0]) {
        const c = ctxResult.data[0];
        setResearchContext({
          id: c.id,
          topic: c.topic,
          population: c.population ?? "",
          outcomes: c.outcomes ?? "",
          keywords: c.keywords ?? [],
        });
      }

      setLoadingList(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveManuscript = useCallback(async (ms: Manuscript) => {
    setSaving(true);
    try {
      const res = await fetch("/api/manuscript/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscript: ms }),
      });
      const data = await res.json();
      if (data.id && !ms.id) {
        setManuscript((prev) => ({ ...prev, id: data.id }));
      }
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    } finally {
      setSaving(false);
    }
  }, []);

  const scheduleAutoSave = useCallback((ms: Manuscript) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveManuscript(ms), 2000);
  }, [saveManuscript]);

  const updateSection = (value: string) => {
    const updated = { ...manuscript, [activeSection]: value };
    setManuscript(updated);
    scheduleAutoSave(updated);
  };

  const openManuscript = async (summary: ManuscriptSummary) => {
    const { data } = await supabase
      .from("manuscripts")
      .select("*")
      .eq("id", summary.id)
      .single();

    if (data) {
      setManuscript({
        id: data.id,
        title: data.title,
        introduction: data.introduction ?? "",
        methods: data.methods ?? "",
        results: data.results ?? "",
        discussion: data.discussion ?? "",
        status: (data.status as ManuscriptStatus) ?? "draft",
        citedPaperIds: data.cited_paper_ids ?? [],
      });
    }
    setActiveSection("introduction");
    setView("editor");
  };

  const createNew = () => {
    setManuscript({ ...EMPTY_MANUSCRIPT });
    setActiveSection("introduction");
    setView("editor");
  };

  const generateOutline = async () => {
    if (!researchContext) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/manuscript/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: researchContext,
          papers: savedPapers.slice(0, 10).map((p) => ({
            title: p.title,
            authors: p.authors,
            year: p.year,
            aiSummary: p.aiSummary,
          })),
          lang,
        }),
      });
      const data = await res.json();
      if (!data.error) {
        const updated: Manuscript = {
          ...manuscript,
          introduction: data.introduction || manuscript.introduction,
          methods: data.methods || manuscript.methods,
          results: data.results || manuscript.results,
          discussion: data.discussion || manuscript.discussion,
        };
        setManuscript(updated);
        scheduleAutoSave(updated);
      }
    } finally {
      setGenerating(false);
    }
  };

  const insertCitation = (citation: string, paperId: string) => {
    const ta = textareaRef.current;
    const pos = ta ? (ta.selectionStart ?? cursorPosRef.current) : cursorPosRef.current;
    const current = manuscript[activeSection];
    const updated = { ...manuscript, [activeSection]: current.slice(0, pos) + citation + current.slice(pos) };
    const newCited = updated.citedPaperIds.includes(paperId)
      ? updated.citedPaperIds
      : [...updated.citedPaperIds, paperId];
    updated.citedPaperIds = newCited;
    setManuscript(updated);
    scheduleAutoSave(updated);
    setShowCitations(false);
    setTimeout(() => {
      if (ta) {
        ta.focus();
        const newPos = pos + citation.length;
        ta.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

  const applyAssistResult = (result: string) => {
    const updated = { ...manuscript, [activeSection]: result };
    setManuscript(updated);
    scheduleAutoSave(updated);
  };

  const totalWords = ["introduction", "methods", "results", "discussion"]
    .reduce((sum, s) => sum + wordCount(manuscript[s as ManuscriptSection]), 0);

  // ── List view ──────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="h-screen flex flex-col">
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-slate-800">Manuscript Copilot</h1>
                <p className="text-xs text-slate-500">Scrittura scientifica assistita da AI</p>
              </div>
            </div>
            <Button onClick={createNew} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nuovo manoscritto
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loadingList ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
            </div>
          ) : manuscripts.length === 0 ? (
            <div className="max-w-lg mx-auto text-center pt-20">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-4">
                <FileText className="h-7 w-7 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Inizia il tuo primo manoscritto</h2>
              <p className="text-slate-500 text-sm mb-6">
                Crea la struttura IMRaD, genera l&apos;outline dai paper salvati e lascia che l&apos;AI ti aiuti a scrivere.
              </p>
              <Button onClick={createNew} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Crea manoscritto
              </Button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="grid gap-3">
                {manuscripts.map((ms) => (
                  <button
                    key={ms.id}
                    onClick={() => openManuscript(ms)}
                    className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                            {ms.title}
                          </h3>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[ms.status])}>
                            {STATUS_LABELS[ms.status]}
                          </span>
                        </div>
                        {ms.introPreview && (
                          <p className="text-xs text-slate-400 line-clamp-2 ml-6">{ms.introPreview}…</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                        <Clock className="h-3 w-3" />
                        {new Date(ms.updatedAt).toLocaleDateString("it-IT")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Editor view ───────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setView("list")}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <Input
          value={manuscript.title}
          onChange={(e) => {
            const updated = { ...manuscript, title: e.target.value };
            setManuscript(updated);
            scheduleAutoSave(updated);
          }}
          className="h-8 text-sm font-medium border-transparent hover:border-slate-200 focus:border-blue-400 bg-transparent max-w-xs"
        />

        <select
          value={manuscript.status}
          onChange={(e) => {
            const updated = { ...manuscript, status: e.target.value as ManuscriptStatus };
            setManuscript(updated);
            scheduleAutoSave(updated);
          }}
          className="h-8 text-xs rounded-md border border-slate-200 bg-white px-2 text-slate-600"
        >
          {(Object.keys(STATUS_LABELS) as ManuscriptStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <div className="flex-1" />

        <span className="text-xs text-slate-400 hidden sm:block">
          {totalWords.toLocaleString()} parole totali
        </span>

        {!researchContext && (
          <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs hidden sm:flex">
            Nessun contesto di ricerca
          </Badge>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCitations(true)}
          className="gap-1.5 hidden sm:flex"
        >
          <BookMarked className="h-3.5 w-3.5" />
          Citazioni
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={generateOutline}
          disabled={generating || !researchContext}
          className="gap-1.5"
          title={!researchContext ? "Imposta un contesto di ricerca nel modulo Literature" : undefined}
        >
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {generating ? "Generando…" : "Genera outline"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToPDF(manuscript, lang)}
          className="gap-1.5 hidden sm:flex"
          title={lang === "en" ? "Export to PDF" : "Esporta in PDF"}
        >
          <Download className="h-3.5 w-3.5" />
          PDF
        </Button>

        <Button
          size="sm"
          onClick={() => saveManuscript(manuscript)}
          disabled={saving}
          className="gap-1.5"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : savedOk ? (
            <span className="text-xs">✓ {lang === "en" ? "Saved" : "Salvato"}</span>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              {lang === "en" ? "Save" : "Salva"}
            </>
          )}
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Section nav */}
        <SectionNav
          manuscript={manuscript}
          activeSection={activeSection}
          onSelect={setActiveSection}
        />

        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor toolbar */}
          <div className="bg-white border-b border-slate-100 px-4 py-2 flex items-center justify-between">
            <div className="flex gap-1">
              <button
                onClick={() => setPreviewMode(false)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  !previewMode ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                <Code2 className="h-3 w-3" />
                Modifica
              </button>
              <button
                onClick={() => setPreviewMode(true)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  previewMode ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                <Eye className="h-3 w-3" />
                Anteprima
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {wordCount(manuscript[activeSection])} parole
              </span>
              {manuscript[activeSection] && (
                <button
                  onClick={() => {
                    if (confirm("Vuoi cancellare il contenuto di questa sezione?")) {
                      const updated = { ...manuscript, [activeSection]: "" };
                      setManuscript(updated);
                      scheduleAutoSave(updated);
                    }
                  }}
                  className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Cancella
                </button>
              )}
            </div>
          </div>

          {/* Editor / Preview */}
          <div className="flex-1 overflow-hidden">
            {previewMode ? (
              <div
                className="h-full overflow-y-auto p-8 bg-white max-w-3xl mx-auto"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(manuscript[activeSection]) }}
              />
            ) : (
              <textarea
                ref={textareaRef}
                value={manuscript[activeSection]}
                onChange={(e) => updateSection(e.target.value)}
                onSelect={() => {
                  if (textareaRef.current) {
                    cursorPosRef.current = textareaRef.current.selectionStart;
                  }
                }}
                placeholder={SECTION_PLACEHOLDERS[activeSection]}
                spellCheck={false}
                className="w-full h-full p-8 resize-none font-mono text-sm text-slate-800 leading-relaxed bg-slate-50 border-0 outline-none focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* AI Assist panel */}
        <AssistPanel
          section={activeSection}
          content={manuscript[activeSection]}
          context={researchContext}
          onApply={applyAssistResult}
        />
      </div>

      {/* Citation picker modal */}
      {showCitations && (
        <CitationPicker
          papers={savedPapers}
          onInsert={insertCitation}
          onClose={() => setShowCitations(false)}
        />
      )}
    </div>
  );
}
