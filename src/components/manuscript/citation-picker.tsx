"use client";

import { useState } from "react";
import { Search, X, BookOpen, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Paper } from "@/types/database";

interface CitationPickerProps {
  papers: Paper[];
  onInsert: (citation: string, paperId: string) => void;
  onClose: () => void;
}

function formatCitation(paper: Paper): string {
  const firstAuthor = paper.authors?.[0] ?? "Autore";
  const lastName = firstAuthor.split(",")[0].split(" ").pop() ?? firstAuthor;
  const et = paper.authors?.length > 1 ? " et al." : "";
  return `[${lastName}${et}, ${paper.year}]`;
}

export function CitationPicker({ papers, onInsert, onClose }: CitationPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = papers.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.authors?.some((a) => a.toLowerCase().includes(q)) ||
      String(p.year).includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-96 max-h-[70vh] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-800">Inserisci citazione</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Cerca per titolo, autore o anno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Paper list */}
        <div className="flex-1 overflow-y-auto">
          {papers.length === 0 ? (
            <div className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nessun paper salvato.</p>
              <p className="text-xs text-slate-400 mt-1">
                Salva paper dal modulo Literature per usarli come citazioni.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-slate-400">Nessun risultato per &quot;{search}&quot;</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((paper) => {
                const citation = formatCitation(paper);
                return (
                  <li key={paper.pubmedId}>
                    <button
                      onClick={() => onInsert(citation, paper.id ?? paper.pubmedId)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 line-clamp-2 group-hover:text-blue-700">
                            {paper.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400">
                              {paper.authors?.[0]?.split(",")[0]}{paper.authors?.length > 1 ? " et al." : ""}
                            </span>
                            <span className="text-xs text-slate-300">·</span>
                            <span className="text-xs text-slate-400">{paper.year}</span>
                            {paper.journal && (
                              <>
                                <span className="text-xs text-slate-300">·</span>
                                <span className="text-xs text-slate-400 truncate">{paper.journal}</span>
                              </>
                            )}
                          </div>
                          <Badge variant="outline" className="mt-1 text-xs text-blue-600 border-blue-200 bg-blue-50">
                            {citation}
                          </Badge>
                        </div>
                        <Plus className="h-4 w-4 text-blue-400 shrink-0 opacity-0 group-hover:opacity-100 mt-0.5" />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
