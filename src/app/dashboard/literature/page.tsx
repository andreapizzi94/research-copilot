"use client";

import { useState } from "react";
import { ResearchContextForm } from "@/components/literature/research-context-form";
import { PaperCard } from "@/components/literature/paper-card";
import { LiteratureChat } from "@/components/literature/literature-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Search,
  Settings2,
  MessageSquare,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { Paper, ResearchContext } from "@/types/database";

type View = "search" | "chat";

export default function LiteraturePage() {
  const [context, setContext] = useState<ResearchContext | null>(null);
  const [showContextForm, setShowContextForm] = useState(true);
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("search");
  const [totalResults, setTotalResults] = useState(0);

  const handleContextSave = (ctx: ResearchContext) => {
    setContext(ctx);
    setShowContextForm(false);
    // Auto-search with context topic
    setQuery(ctx.topic);
    searchPapers(ctx.topic, ctx);
  };

  const searchPapers = async (searchQuery?: string, ctx?: ResearchContext) => {
    const q = searchQuery ?? query;
    const activeContext = ctx ?? context;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/literature/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, context: activeContext, maxResults: 20 }),
      });

      if (!res.ok) throw new Error("Errore nella ricerca");

      const data = await res.json();
      setPapers(data.papers);
      setTotalResults(data.total);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Errore durante la ricerca");
    } finally {
      setLoading(false);
    }
  };

  const handleSynthesizePaper = async (paper: Paper) => {
    const res = await fetch("/api/literature/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper, context }),
    });

    if (res.ok) {
      const data = await res.json();
      setPapers((prev) =>
        prev.map((p) =>
          p.pubmedId === paper.pubmedId
            ? { ...p, aiSummary: data.summary, aiRelevanceNote: data.relevanceNote }
            : p
        )
      );
    }
  };

  const handleSavePaper = async (paper: Paper) => {
    await fetch("/api/literature/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper }),
    });
    setPapers((prev) =>
      prev.map((p) => (p.pubmedId === paper.pubmedId ? { ...p, saved: true } : p))
    );
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Literature Intelligence</h1>
              {context && (
                <p className="text-xs text-slate-500 truncate max-w-md">{context.topic}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {context && (
              <>
                <Button
                  variant={view === "search" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("search")}
                  className="gap-1.5"
                >
                  <Search className="h-3.5 w-3.5" />
                  Ricerca
                </Button>
                <Button
                  variant={view === "chat" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("chat")}
                  className="gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContextForm(true)}
              className="gap-1.5"
            >
              <Settings2 className="h-3.5 w-3.5" />
              {context ? "Modifica contesto" : "Imposta contesto"}
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {showContextForm ? (
          /* Research Context Setup */
          <div className="max-w-2xl mx-auto p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Imposta il tuo contesto di ricerca</h2>
              <p className="text-slate-500 mt-1 text-sm">
                Definisci il tuo ambito per ottenere paper più rilevanti e sintesi personalizzate.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <ResearchContextForm
                initialContext={context}
                onSave={handleContextSave}
              />
            </div>
          </div>
        ) : view === "chat" && context ? (
          /* Literature Chat */
          <LiteratureChat context={context} />
        ) : (
          /* Search View */
          <div className="h-full flex flex-col">
            {/* Search bar */}
            <div className="bg-white border-b border-slate-100 p-4">
              <div className="flex gap-2 max-w-3xl">
                <Input
                  placeholder="Cerca paper su PubMed..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchPapers()}
                  className="flex-1"
                />
                <Button onClick={() => searchPapers()} disabled={loading || !query.trim()} className="gap-1.5">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Cerca
                </Button>
              </div>

              {context?.keywords && context.keywords.length > 0 && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-slate-400">Suggeriti:</span>
                  {context.keywords.map((kw) => (
                    <button
                      key={kw}
                      onClick={() => { setQuery(kw); searchPapers(kw); }}
                      className="text-xs"
                    >
                      <Badge variant="outline" className="hover:bg-blue-50 cursor-pointer">{kw}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {papers.length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {totalResults.toLocaleString()} risultati trovati su PubMed
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => searchPapers()} className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Aggiorna
                  </Button>
                </div>
              )}

              {papers.length === 0 && !loading && !error && (
                <div className="text-center py-16">
                  <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Nessun paper trovato</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Prova una ricerca o usa le keyword del tuo contesto
                  </p>
                </div>
              )}

              <div className="grid gap-3 max-w-4xl">
                {papers.map((paper) => (
                  <PaperCard
                    key={paper.pubmedId}
                    paper={paper}
                    onSave={handleSavePaper}
                    onSynthesize={handleSynthesizePaper}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
