"use client";

import { useState, useRef } from "react";
import { Upload, Table2, RefreshCw, TrendingUp, List, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { parseCSV } from "./csv-utils";
import type { ParsedDataset, ColumnStat } from "@/types/database";

// ── Column type badge ─────────────────────────────────────────────────────────
function ColTypeBadge({ type }: { type: ColumnStat["type"] }) {
  const map = {
    numeric:     { label: "Num", color: "bg-blue-100 text-blue-700 border-blue-200" },
    categorical: { label: "Cat", color: "bg-green-100 text-green-700 border-green-200" },
    date:        { label: "Data", color: "bg-purple-100 text-purple-700 border-purple-200" },
    boolean:     { label: "Bool", color: "bg-amber-100 text-amber-700 border-amber-200" },
  };
  const { label, color } = map[type] ?? map.categorical;
  return (
    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", color)}>
      {label}
    </span>
  );
}

// ── Column card ───────────────────────────────────────────────────────────────
function ColumnCard({ stat }: { stat: ColumnStat }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors"
      >
        <ColTypeBadge type={stat.type} />
        <span className="flex-1 text-xs font-medium text-slate-700 truncate">{stat.name}</span>
        {stat.missing > 0 && (
          <span className="text-[10px] text-amber-600">
            {stat.missing} miss.
          </span>
        )}
        <span className="text-[10px] text-slate-400">n={stat.n}</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
          {stat.type === "numeric" ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {[
                ["Media", stat.mean?.toFixed(2)],
                ["DS", stat.sd?.toFixed(2)],
                ["Mediana", stat.median],
                ["IQR", stat.q1 !== undefined && stat.q3 !== undefined ? `${stat.q1}–${stat.q3}` : null],
                ["Min", stat.min],
                ["Max", stat.max],
              ]
                .filter(([, v]) => v !== undefined && v !== null)
                .map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between">
                    <span className="text-[10px] text-slate-400">{label}</span>
                    <span className="text-[10px] font-mono font-medium text-slate-700">{String(value)}</span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-400 mb-1">{stat.nUnique} valori unici</p>
              {stat.categories?.slice(0, 6).map((c) => (
                <div key={c.value} className="flex items-center gap-1.5">
                  <div
                    className="h-1.5 rounded-full bg-blue-400"
                    style={{ width: `${Math.round(c.pct)}%`, maxWidth: "80px", minWidth: "3px" }}
                  />
                  <span className="text-[10px] text-slate-600 truncate flex-1">{c.value}</span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {c.count} ({c.pct.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Preview table ─────────────────────────────────────────────────────────────
function PreviewTable({ dataset }: { dataset: ParsedDataset }) {
  const previewRows = dataset.rows.slice(0, 8);
  return (
    <div className="overflow-auto rounded-lg border border-slate-200 text-xs">
      <table className="min-w-full divide-y divide-slate-200">
        <thead>
          <tr className="bg-slate-50">
            {dataset.headers.map((h) => (
              <th
                key={h}
                className="px-2 py-1.5 text-left font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200 last:border-r-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {previewRows.map((row, ri) => (
            <tr key={ri} className="hover:bg-slate-50">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-2 py-1 text-slate-700 font-mono whitespace-nowrap border-r border-slate-100 last:border-r-0 max-w-[120px] truncate"
                >
                  {cell || <span className="text-slate-300 italic">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {dataset.nRows > 8 && (
        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400">
          + {dataset.nRows - 8} righe nascoste
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface DataPanelProps {
  dataset: ParsedDataset | null;
  datasetName: string;
  onDatasetChange: (ds: ParsedDataset | null, name: string) => void;
}

type TabType = "preview" | "columns";

export function DataPanel({ dataset, datasetName, onDatasetChange }: DataPanelProps) {
  const [rawText, setRawText] = useState("");
  const [tab, setTab] = useState<TabType>("columns");
  const [parseError, setParseError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePaste = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      onDatasetChange(null, "");
      setParseError(null);
      return;
    }
    const result = parseCSV(text);
    if (result) {
      setParseError(null);
      onDatasetChange(result, datasetName || "Dataset");
    } else {
      setParseError("Impossibile interpretare il CSV. Verifica il formato.");
      onDatasetChange(null, "");
    }
  };

  const handleFile = (file: File) => {
    const name = file.name.replace(/\.[^.]+$/, "");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawText(text);
      const result = parseCSV(text);
      if (result) {
        setParseError(null);
        onDatasetChange(result, name);
      } else {
        setParseError("File non riconosciuto. Usa CSV con intestazioni nella prima riga.");
        onDatasetChange(null, "");
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  // ── No data: input area ──────────────────────────────────────────────────
  if (!dataset) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Table2 className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">Dati</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Carica il tuo dataset CSV</p>
        </div>

        <div className="flex-1 flex flex-col p-4 gap-3">
          {/* File upload */}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
          >
            <Upload className="h-7 w-7 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-600">Carica file CSV</p>
              <p className="text-xs text-slate-400 mt-0.5">oppure incolla i dati qui sotto</p>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {/* Paste area */}
          <div className="flex-1 flex flex-col">
            <p className="text-xs font-medium text-slate-500 mb-1.5">Incolla CSV</p>
            <textarea
              className="flex-1 min-h-[180px] w-full rounded-lg border border-slate-200 p-3 text-xs font-mono text-slate-800 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-slate-300"
              placeholder={"età,sesso,gruppo,pressione\n45,M,A,120\n52,F,B,135\n..."}
              value={rawText}
              onChange={(e) => handlePaste(e.target.value)}
              spellCheck={false}
            />
          </div>

          {parseError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {parseError}
            </div>
          )}

          {/* Format hint */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-600">Formato supportato</p>
            <p>• CSV con intestazioni nella prima riga</p>
            <p>• Delimitatore: virgola, punto e virgola o tab</p>
            <p>• Valori mancanti: NA, N/A, o cella vuota</p>
            <p>• Max ~5.000 righe (analisi su prime 120)</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Data loaded ────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Table2 className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-semibold text-slate-700 truncate">{datasetName}</h3>
          </div>
          <button
            onClick={() => { onDatasetChange(null, ""); setRawText(""); }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
            title="Sostituisci dataset"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            {dataset.nRows.toLocaleString()} righe
          </Badge>
          <Badge variant="outline" className="text-xs">
            {dataset.nCols} colonne
          </Badge>
          <Badge variant="outline" className="text-xs text-slate-400">
            delim: {dataset.delimiter === "\t" ? "tab" : `"${dataset.delimiter}"`}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {(["columns", "preview"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-b-2",
              tab === t
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {t === "columns" ? <TrendingUp className="h-3 w-3" /> : <List className="h-3 w-3" />}
            {t === "columns" ? "Colonne" : "Anteprima"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === "columns" ? (
          <div className="space-y-1.5">
            {dataset.columnStats.map((stat) => (
              <ColumnCard key={stat.name} stat={stat} />
            ))}
          </div>
        ) : (
          <PreviewTable dataset={dataset} />
        )}
      </div>
    </div>
  );
}
