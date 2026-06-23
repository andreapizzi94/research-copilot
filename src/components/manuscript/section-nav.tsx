"use client";

import { BookOpen, FlaskConical, BarChart2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ManuscriptSection, Manuscript } from "@/types/database";

const SECTIONS: { key: ManuscriptSection; label: string; sublabel: string; Icon: React.ElementType }[] = [
  { key: "introduction", label: "Introduction", sublabel: "Background e obiettivi", Icon: BookOpen },
  { key: "methods", label: "Methods", sublabel: "Disegno e popolazione", Icon: FlaskConical },
  { key: "results", label: "Results", sublabel: "Dati e analisi", Icon: BarChart2 },
  { key: "discussion", label: "Discussion", sublabel: "Interpretazione e conclusioni", Icon: MessageSquare },
];

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

interface SectionNavProps {
  manuscript: Pick<Manuscript, "introduction" | "methods" | "results" | "discussion">;
  activeSection: ManuscriptSection;
  onSelect: (s: ManuscriptSection) => void;
}

export function SectionNav({ manuscript, activeSection, onSelect }: SectionNavProps) {
  return (
    <aside className="w-52 min-h-full bg-slate-50 border-r border-slate-200 flex flex-col">
      <div className="p-3 border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sezioni IMRaD</p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {SECTIONS.map(({ key, label, sublabel, Icon }) => {
          const wc = wordCount(manuscript[key]);
          const isActive = activeSection === key;
          const hasContent = wc > 0;

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={cn(
                "w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-md transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              )}
            >
              <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", isActive ? "text-blue-100" : "text-slate-400")} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{label}</div>
                <div className={cn("text-xs truncate", isActive ? "text-blue-200" : "text-slate-400")}>
                  {sublabel}
                </div>
                {hasContent && (
                  <div className={cn("text-xs mt-0.5", isActive ? "text-blue-200" : "text-slate-400")}>
                    {wc} parole
                  </div>
                )}
              </div>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                hasContent ? (isActive ? "bg-blue-200" : "bg-green-400") : (isActive ? "bg-blue-400" : "bg-slate-300")
              )} />
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
