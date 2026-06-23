"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, BookmarkCheck, ChevronDown, ChevronUp, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import type { Paper } from "@/types/database";

interface Props {
  paper: Paper;
  onSave?: (paper: Paper) => Promise<void>;
  onSynthesize?: (paper: Paper) => Promise<void>;
}

export function PaperCard({ paper, onSave, onSynthesize }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(paper.saved ?? false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [saving, setSaving] = useState(false);

  const relevanceColor =
    (paper.relevanceScore ?? 0) >= 80
      ? "bg-green-100 text-green-700 border-green-200"
      : (paper.relevanceScore ?? 0) >= 60
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-slate-100 text-slate-600 border-slate-200";

  const handleSave = async () => {
    if (!onSave || saved) return;
    setSaving(true);
    await onSave(paper);
    setSaved(true);
    setSaving(false);
  };

  const handleSynthesize = async () => {
    if (!onSynthesize || paper.aiSummary) return;
    setSynthesizing(true);
    await onSynthesize(paper);
    setSynthesizing(false);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {paper.year && (
                <span className="text-xs text-slate-500 font-medium">{paper.year}</span>
              )}
              {paper.journal && (
                <span className="text-xs text-slate-400 truncate max-w-[200px]">{paper.journal}</span>
              )}
              {paper.relevanceScore !== undefined && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${relevanceColor}`}>
                  {paper.relevanceScore}% rilevante
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-800 leading-snug">{paper.title}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {paper.authors.slice(0, 3).join(", ")}
              {paper.authors.length > 3 && ` +${paper.authors.length - 3}`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-1 shrink-0">
            {paper.doi && (
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSave}
              disabled={saved || saving}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : saved ? (
                <BookmarkCheck className="h-3.5 w-3.5 text-blue-500" />
              ) : (
                <BookmarkPlus className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* AI Summary */}
        {paper.aiSummary && (
          <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-medium text-blue-700">Sintesi AI</span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">{paper.aiSummary}</p>
            {paper.aiRelevanceNote && (
              <p className="text-xs text-blue-600 mt-1.5 italic">{paper.aiRelevanceNote}</p>
            )}
          </div>
        )}

        {/* Abstract (collapsible) */}
        {paper.abstract && (
          <div>
            <div className={`text-xs text-slate-600 leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}>
              {paper.abstract}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
              >
                {expanded ? (
                  <><ChevronUp className="h-3 w-3" /> Mostra meno</>
                ) : (
                  <><ChevronDown className="h-3 w-3" /> Leggi abstract</>
                )}
              </button>

              {!paper.aiSummary && (
                <button
                  onClick={handleSynthesize}
                  disabled={synthesizing}
                  className="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-0.5 ml-2"
                >
                  {synthesizing ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Sintetizzando...</>
                  ) : (
                    <><Sparkles className="h-3 w-3" /> Sintetizza con AI</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
