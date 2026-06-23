"use client";

import { useState } from "react";
import {
  ChevronDown, ChevronUp, Copy, Check, BookOpen,
  TrendingUp, Activity, BarChart2, PieChart, GitBranch
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MiniChart } from "./mini-chart";
import { cn } from "@/lib/utils";
import type { AnalysisBlock } from "@/types/database";

// ── P-value badge ─────────────────────────────────────────────────────────────
function PValueBadge({ p, sig }: { p?: number | null; sig?: string | null }) {
  if (p === undefined || p === null) return null;

  const formatted = p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(3)}`;
  const color =
    (sig === "***" || sig === "**") ? "bg-green-100 text-green-800 border-green-300" :
    sig === "*"                      ? "bg-amber-100 text-amber-800 border-amber-300" :
    sig === "NS"                     ? "bg-slate-100 text-slate-600 border-slate-300" :
                                       "bg-slate-100 text-slate-600 border-slate-300";

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-full border", color)}>
      {sig && sig !== "NS" && <span>{sig}</span>}
      {formatted}
      {sig === "NS" && <span className="font-normal">NS</span>}
    </span>
  );
}

// ── Type icon + label ─────────────────────────────────────────────────────────
const TYPE_META = {
  descriptive: { Icon: BarChart2, label: "Descrittiva", color: "text-blue-600 bg-blue-50 border-blue-200" },
  comparison:  { Icon: TrendingUp, label: "Confronto", color: "text-purple-600 bg-purple-50 border-purple-200" },
  correlation: { Icon: Activity, label: "Correlazione", color: "text-teal-600 bg-teal-50 border-teal-200" },
  regression:  { Icon: GitBranch, label: "Regressione", color: "text-orange-600 bg-orange-50 border-orange-200" },
  frequency:   { Icon: PieChart, label: "Frequenze", color: "text-pink-600 bg-pink-50 border-pink-200" },
  survival:    { Icon: BookOpen, label: "Sopravvivenza", color: "text-red-600 bg-red-50 border-red-200" },
};

// ── Main component ────────────────────────────────────────────────────────────
interface ResultCardProps {
  block: AnalysisBlock;
  index: number;
}

export function ResultCard({ block, index }: ResultCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const meta = TYPE_META[block.type] ?? TYPE_META.descriptive;
  const { Icon } = meta;

  const copyAsText = () => {
    const lines: string[] = [
      `=== ${block.title} ===`,
      block.test ? `Test: ${block.test}` : "",
      block.pValue !== null && block.pValue !== undefined ? `p-value: ${block.pValue < 0.001 ? "< 0.001" : block.pValue.toFixed(3)} ${block.significance ?? ""}` : "",
      block.effectSize ? `Effect size: ${block.effectSize}` : "",
      "",
      ...block.statistics.flatMap((g) => [
        `${g.group} (n=${g.n})`,
        ...g.rows.map((r) => `  ${r.label}: ${r.value}`),
        "",
      ]),
      block.assumptions ? `Assunzioni: ${block.assumptions}` : "",
      `Interpretazione: ${block.interpretation}`,
      `Conclusione: ${block.conclusion}`,
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold shrink-0 mt-0.5">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border", meta.color)}>
              <Icon className="h-3 w-3" />
              {meta.label}
            </span>
            {block.test && (
              <span className="text-xs text-slate-500 font-mono">{block.test}</span>
            )}
            <PValueBadge p={block.pValue} sig={block.significance} />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 leading-snug">{block.title}</h4>
          {block.effectSize && (
            <p className="text-xs text-slate-500 mt-0.5">{block.effectSize}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); copyAsText(); }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
            title="Copia come testo"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="border-t border-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            {/* Statistics table */}
            <div className="p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Statistiche
              </p>
              <div className="space-y-3">
                {block.statistics.map((group, gi) => (
                  <div key={gi}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-700">{group.group}</span>
                      <Badge variant="outline" className="text-xs text-slate-500">
                        n = {group.n}
                      </Badge>
                    </div>
                    <div className="bg-slate-50 rounded-lg divide-y divide-slate-100 overflow-hidden">
                      {group.rows.map((row, ri) => (
                        <div key={ri} className="flex items-center justify-between px-3 py-1.5">
                          <span className="text-xs text-slate-500">{row.label}</span>
                          <span className="text-xs font-mono font-medium text-slate-800">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="p-4">
              {block.chart ? (
                <MiniChart chart={block.chart} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-slate-300">Nessun grafico disponibile</p>
                </div>
              )}
            </div>
          </div>

          {/* Interpretation + Assumptions */}
          <div className="border-t border-slate-100 px-4 py-3 space-y-2">
            {block.assumptions && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-blue-700 mb-0.5">Verifica assunzioni</p>
                <p className="text-xs text-blue-600">{block.assumptions}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Interpretazione clinica</p>
              <p className="text-sm text-slate-700 leading-relaxed">{block.interpretation}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-slate-500 mb-0.5">Conclusione</p>
              <p className="text-sm font-medium text-slate-800">{block.conclusion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
