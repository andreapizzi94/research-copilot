"use client";

import { useState, useRef, useEffect } from "react";
import {
  BarChart2, Send, Loader2, Save, Check, Lightbulb,
  Trash2, ChevronDown, Database, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataPanel } from "@/components/analysis/data-panel";
import { ResultCard } from "@/components/analysis/result-card";
import { generateSuggestions } from "@/components/analysis/csv-utils";
import { cn } from "@/lib/utils";
import type {
  ParsedDataset, AnalysisBlock, AnalysisResult
} from "@/types/database";

interface SessionEntry {
  id: string;
  query: string;
  analyses: AnalysisBlock[];
  suggestions: string[];
  timestamp: Date;
}

let idCounter = 0;
function nextId() { return `entry-${++idCounter}`; }

export default function AnalysisPage() {
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [datasetName, setDatasetName] = useState("Dataset");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionEntry[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState<string | null>(null);  // entry id being saved
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  // Scroll to latest result
  useEffect(() => {
    if (session.length > 0) {
      resultsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [session.length]);

  // Generate suggestions when dataset changes
  const handleDatasetChange = (ds: ParsedDataset | null, name: string) => {
    setDataset(ds);
    if (name) setDatasetName(name);
    if (ds) {
      setSuggestions(generateSuggestions(ds.columnStats));
      setSession([]);
      setError(null);
    } else {
      setSuggestions([]);
    }
  };

  const runAnalysis = async (queryText?: string) => {
    const q = queryText ?? query;
    if (!q.trim() || !dataset) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analysis/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          headers: dataset.headers,
          rows: dataset.rows,
          columnStats: dataset.columnStats,
          datasetName,
        }),
      });

      const data: AnalysisResult & { error?: string } = await res.json();

      if (data.error) throw new Error(data.error);
      if (!data.analyses?.length) throw new Error("Nessun risultato ricevuto dall'analisi.");

      const entry: SessionEntry = {
        id: nextId(),
        query: q,
        analyses: data.analyses,
        suggestions: data.suggestions ?? [],
        timestamp: new Date(),
      };

      setSession((prev) => [...prev, entry]);
      setSuggestions(data.suggestions?.length ? data.suggestions : suggestions);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'analisi");
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async (entry: SessionEntry) => {
    if (!dataset) return;
    setSaving(entry.id);
    try {
      const res = await fetch("/api/analysis/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetName,
          nRows: dataset.nRows,
          nCols: dataset.nCols,
          query: entry.query,
          result: { analyses: entry.analyses, suggestions: entry.suggestions },
          suggestions: entry.suggestions,
        }),
      });
      if (res.ok) {
        setSavedIds((prev) => new Set([...prev, entry.id]));
      }
    } finally {
      setSaving(null);
    }
  };

  const removeEntry = (id: string) => {
    setSession((prev) => prev.filter((e) => e.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runAnalysis();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart2 className="h-5 w-5 text-blue-600" />
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Analysis</h1>
            <p className="text-xs text-slate-500">Analisi statistica in linguaggio naturale</p>
          </div>
        </div>

        {dataset && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <Database className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-700">
                {datasetName} — {dataset.nRows.toLocaleString()} × {dataset.nCols}
              </span>
            </div>
            {session.length > 0 && (
              <button
                onClick={() => setShowHistory((h) => !h)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-full px-3 py-1 hover:bg-slate-50 transition-colors"
              >
                {session.length} analisi
                <ChevronDown className={cn("h-3 w-3 transition-transform", showHistory && "rotate-180")} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — Data panel */}
        <div className="w-80 shrink-0 border-r border-slate-200 bg-white overflow-hidden flex flex-col">
          <DataPanel
            dataset={dataset}
            datasetName={datasetName}
            onDatasetChange={handleDatasetChange}
          />
        </div>

        {/* Right — Analysis panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

          {/* ── Empty state (no dataset) ── */}
          {!dataset && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-4">
                  <BarChart2 className="h-7 w-7 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 mb-2">Carica un dataset per iniziare</h2>
                <p className="text-slate-500 text-sm">
                  Incolla o carica un file CSV nel pannello a sinistra, poi descrivi in italiano cosa vuoi analizzare.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-2 text-left text-xs text-slate-500 bg-white rounded-xl border border-slate-200 p-4">
                  {[
                    "Confronta la pressione sistolica tra i due gruppi di trattamento",
                    "Calcola le statistiche descrittive per tutte le variabili continue",
                    "Esegui una regressione logistica per predire l'evento primario",
                    "Analizza la correlazione tra BMI e HbA1c",
                  ].map((ex) => (
                    <div key={ex} className="flex items-start gap-2">
                      <Sparkles className="h-3 w-3 text-blue-400 mt-0.5 shrink-0" />
                      <span className="italic">{ex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Dataset loaded ── */}
          {dataset && (
            <>
              {/* Suggestions */}
              {suggestions.length > 0 && session.length === 0 && (
                <div className="px-5 pt-4 pb-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-slate-500">Analisi suggerite</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { setQuery(s); runAnalysis(s); }}
                        disabled={loading}
                        className="text-xs bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-full px-3 py-1.5 transition-colors text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results area */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
                {session.map((entry, ei) => (
                  <div key={entry.id} ref={ei === session.length - 1 ? resultsEndRef : undefined}>
                    {/* Query header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-2 flex-1">
                        <div className="shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold mt-0.5">
                          {ei + 1}
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">
                            {entry.timestamp.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-sm font-medium text-slate-800 mt-0.5">{entry.query}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => saveEntry(entry)}
                          disabled={saving === entry.id || savedIds.has(entry.id)}
                          className={cn(
                            "flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors",
                            savedIds.has(entry.id)
                              ? "bg-green-50 border-green-200 text-green-600"
                              : "bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"
                          )}
                          title="Salva analisi"
                        >
                          {saving === entry.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : savedIds.has(entry.id) ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                          {savedIds.has(entry.id) ? "Salvata" : "Salva"}
                        </button>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="p-1 text-slate-300 hover:text-red-400 rounded transition-colors"
                          title="Rimuovi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Result cards */}
                    <div className="space-y-3 ml-8">
                      {entry.analyses.map((block, bi) => (
                        <ResultCard key={bi} block={block} index={bi} />
                      ))}
                    </div>

                    {/* Follow-up suggestions */}
                    {entry.suggestions.length > 0 && (
                      <div className="ml-8 mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Lightbulb className="h-3 w-3 text-amber-600" />
                          <span className="text-xs font-semibold text-amber-700">Analisi suggerite di follow-up</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.suggestions.map((s, si) => (
                            <button
                              key={si}
                              onClick={() => { setQuery(s); runAnalysis(s); }}
                              disabled={loading}
                              className="text-xs bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-amber-700 rounded-full px-2.5 py-1 transition-colors text-left"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading skeleton */}
                {loading && (
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Analisi in corso…</p>
                      <p className="text-xs text-slate-400 mt-0.5">Claude sta elaborando i dati e calcolando le statistiche</p>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
                    <span className="shrink-0 font-bold">⚠</span>
                    <div>
                      <p className="font-medium">Errore nell&apos;analisi</p>
                      <p className="text-xs mt-0.5 text-red-500">{error}</p>
                    </div>
                  </div>
                )}

                <div className="h-4" />
              </div>

              {/* ── Query input bar ── */}
              <div className="border-t border-slate-200 bg-white p-4">
                {/* Inline suggestion chips (after first analysis) */}
                {session.length > 0 && suggestions.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {suggestions.slice(0, 3).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { setQuery(s); }}
                        className="text-xs bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 rounded-full px-2.5 py-1 transition-colors"
                      >
                        {s.length > 60 ? s.slice(0, 58) + "…" : s}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Descrivi l'analisi statistica che vuoi eseguire… (Invio per analizzare)"
                      disabled={loading}
                      rows={2}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white disabled:opacity-50 transition-colors"
                    />
                    <p className="absolute bottom-2 right-3 text-[10px] text-slate-300">
                      Invio per analizzare · Shift+Invio per andare a capo
                    </p>
                  </div>
                  <Button
                    onClick={() => runAnalysis()}
                    disabled={loading || !query.trim()}
                    className="h-[72px] w-12 shrink-0 rounded-xl"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
