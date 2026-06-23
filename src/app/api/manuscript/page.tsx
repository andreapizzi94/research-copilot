"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText, Sparkles, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, Copy, Download,
} from "lucide-react";

interface ManuscriptMeta {
  title: string;
  journal: string;
  articleType: string;
  topic: string;
  population: string;
  intervention: string;
  outcomes: string;
  keyFindings: string;
}

const SECTIONS = [
  { key: "abstract", label: "Abstract", description: "Background, obiettivi, metodi, risultati, conclusioni" },
  { key: "introduction", label: "Introduction", description: "Contesto, gap, razionale e obiettivo" },
  { key: "methods", label: "Methods", description: "Disegno, popolazione, variabili, analisi statistica" },
  { key: "results", label: "Results", description: "Risultati principali e analisi secondarie" },
  { key: "discussion", label: "Discussion", description: "Interpretazione, confronto letteratura, limitazioni" },
];

const ARTICLE_TYPES = ["RCT", "Studio osservazionale", "Studio di coorte", "Case-control", "Revisione sistematica", "Meta-analisi", "Case report"];

export default function ManuscriptPage() {
  const [step, setStep] = useState<"setup" | "editor">("setup");
  const [meta, setMeta] = useState<ManuscriptMeta>({
    title: "", journal: "", articleType: "RCT",
    topic: "", population: "", intervention: "", outcomes: "", keyFindings: "",
  });
  const [sections, setSections] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string>("abstract");
  const [copied, setCopied] = useState<string | null>(null);

  const generateSection = async (sectionKey: string) => {
    setGenerating(sectionKey);
    try {
      const res = await fetch("/api/manuscript/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: sectionKey, meta, existingSections: sections }),
      });
      const data = await res.json();
      if (data.text) {
        setSections((prev) => ({ ...prev, [sectionKey]: data.text }));
        setExpanded(sectionKey);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(null);
    }
  };

  const generateAll = async () => {
    for (const s of SECTIONS) {
      await generateSection(s.key);
    }
  };

  const copySection = (key: string) => {
    navigator.clipboard.writeText(sections[key] || "");
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadAll = () => {
    const content = SECTIONS.filter((s) => sections[s.key])
      .map((s) => `## ${s.label}\n\n${sections[s.key]}`)
      .join("\n\n---\n\n");
    const full = `# ${meta.title}\n\n**Rivista:** ${meta.journal}\n**Tipo:** ${meta.articleType}\n\n---\n\n${content}`;
    const blob = new Blob([full], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.title.slice(0, 40).replace(/\s+/g, "_")}.txt`;
    a.click();
  };

  const completedSections = SECTIONS.filter((s) => sections[s.key]).length;

  if (step === "setup") {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-3">
            <FileText className="h-6 w-6 text-indigo-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Nuovo Manoscritto</h1>
          <p className="text-slate-500 text-sm mt-1">Inserisci i dettagli del tuo studio per generare le sezioni con AI.</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Titolo del manoscritto *</label>
              <Input
                placeholder="Es: Effetti della metformina sul rischio cardiovascolare..."
                value={meta.title}
                onChange={(e) => setMeta({ ...meta, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Rivista target</label>
                <Input
                  placeholder="Es: NEJM, Lancet, BMJ..."
                  value={meta.journal}
                  onChange={(e) => setMeta({ ...meta, journal: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Tipo di articolo</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={meta.articleType}
                  onChange={(e) => setMeta({ ...meta, articleType: e.target.value })}
                >
                  {ARTICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Topic di ricerca *</label>
              <Textarea
                placeholder="Descrivi brevemente l'argomento dello studio..."
                value={meta.topic}
                onChange={(e) => setMeta({ ...meta, topic: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Popolazione</label>
              <Input
                placeholder="Es: Pazienti adulti con diabete tipo 2, età >60 anni"
                value={meta.population}
                onChange={(e) => setMeta({ ...meta, population: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Intervento / Esposizione</label>
              <Input
                placeholder="Es: Metformina 1000mg/die vs placebo per 12 mesi"
                value={meta.intervention}
                onChange={(e) => setMeta({ ...meta, intervention: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Outcome primari</label>
              <Input
                placeholder="Es: Incidenza MACE a 12 mesi, mortalità cardiovascolare"
                value={meta.outcomes}
                onChange={(e) => setMeta({ ...meta, outcomes: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Risultati chiave (opzionale)</label>
              <Textarea
                placeholder="Es: Riduzione del 23% degli eventi MACE nel gruppo trattato (HR 0.77, 95% CI 0.61-0.97, p=0.026)..."
                value={meta.keyFindings}
                onChange={(e) => setMeta({ ...meta, keyFindings: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>

            <Button
              className="w-full"
              disabled={!meta.title || !meta.topic}
              onClick={() => setStep("editor")}
            >
              Inizia a scrivere
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-slate-800 truncate max-w-xl">{meta.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              {meta.journal && <Badge variant="secondary">{meta.journal}</Badge>}
              <Badge variant="outline">{meta.articleType}</Badge>
              <span className="text-xs text-slate-400">{completedSections}/{SECTIONS.length} sezioni</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setStep("setup")}>
              Modifica info
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={generateAll}
              disabled={!!generating}
              className="gap-1.5"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Genera tutto
            </Button>
            {completedSections > 0 && (
              <Button size="sm" onClick={downloadAll} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Scarica
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        <div className="space-y-3">
          {SECTIONS.map((section) => {
            const isExpanded = expanded === section.key;
            const isDone = !!sections[section.key];
            const isGenerating = generating === section.key;

            return (
              <Card key={section.key} className={isDone ? "border-indigo-200" : ""}>
                <CardHeader className="p-4 pb-0">
                  <div className="flex items-center justify-between">
                    <button
                      className="flex items-center gap-2 text-left flex-1"
                      onClick={() => setExpanded(isExpanded ? "" : section.key)}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-slate-300 shrink-0" />
                      )}
                      <div>
                        <CardTitle className="text-sm font-semibold">{section.label}</CardTitle>
                        <p className="text-xs text-slate-400 font-normal">{section.description}</p>
                      </div>
                      <div className="ml-auto">
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>
                    </button>

                    <div className="flex gap-1 ml-3">
                      {isDone && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copySection(section.key)}>
                          {copied === section.key
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={isDone ? "outline" : "default"}
                        className="gap-1.5"
                        disabled={!!generating}
                        onClick={() => generateSection(section.key)}
                      >
                        {isGenerating
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generando...</>
                          : <><Sparkles className="h-3.5 w-3.5" />{isDone ? "Rigenera" : "Genera"}</>}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-4 pt-3">
                    {isGenerating ? (
                      <div className="flex items-center gap-2 text-slate-500 py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        <span className="text-sm">Claude sta scrivendo la sezione...</span>
                      </div>
                    ) : isDone ? (
                      <Textarea
                        value={sections[section.key]}
                        onChange={(e) => setSections((prev) => ({ ...prev, [section.key]: e.target.value }))}
                        className="min-h-[200px] text-sm leading-relaxed font-mono resize-y"
                      />
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Clicca "Genera" per scrivere questa sezione con AI</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
