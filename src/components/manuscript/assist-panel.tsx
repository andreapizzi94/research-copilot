"use client";

import { useState } from "react";
import { Wand2, RefreshCw, Scissors, AlertCircle, Loader2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { getT } from "@/lib/i18n";
import type { ManuscriptSection, AssistAction, ResearchContext } from "@/types/database";

interface AssistPanelProps {
  section: ManuscriptSection;
  content: string;
  context: ResearchContext | null;
  onApply: (result: string) => void;
}

export function AssistPanel({ section, content, context, onApply }: AssistPanelProps) {
  const { lang } = useLanguage();
  const t = getT(lang);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<AssistAction | null>(null);
  const [copied, setCopied] = useState(false);

  const ACTIONS: { key: AssistAction; label: string; description: string; Icon: React.ElementType }[] = [
    { key: "expand",    label: t.ms_assist_expand,   description: t.ms_assist_expand_desc,   Icon: Wand2 },
    { key: "rewrite",   label: t.ms_assist_rewrite,  description: t.ms_assist_rewrite_desc,  Icon: RefreshCw },
    { key: "compress",  label: t.ms_assist_compress, description: t.ms_assist_compress_desc, Icon: Scissors },
    { key: "find_gaps", label: t.ms_assist_gaps,     description: t.ms_assist_gaps_desc,     Icon: AlertCircle },
  ];

  const runAction = async (action: AssistAction) => {
    if (!content.trim() || !context) return;

    setLoading(true);
    setActiveAction(action);
    setResult(null);

    try {
      const res = await fetch("/api/manuscript/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, content, action, context, lang }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.result);
    } catch {
      setResult(lang === "en" ? "Error during processing. Try again." : "Errore durante l'elaborazione. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-72 min-h-full border-l border-slate-200 bg-white flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-800">{t.ms_assist_title}</h3>
        </div>
        {!context && (
          <p className="text-xs text-amber-600 mt-1">{t.ms_assist_no_context}</p>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-b border-slate-200 space-y-1.5">
        {ACTIONS.map(({ key, label, description, Icon }) => (
          <button
            key={key}
            onClick={() => runAction(key)}
            disabled={loading || !content.trim() || !context}
            className={cn(
              "w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors",
              loading && activeAction === key
                ? "border-blue-300 bg-blue-50"
                : "border-slate-200 hover:border-blue-300 hover:bg-blue-50",
              (!content.trim() || !context) && "opacity-40 cursor-not-allowed"
            )}
          >
            {loading && activeAction === key ? (
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
            ) : (
              <Icon className="h-4 w-4 text-slate-500 shrink-0" />
            )}
            <div>
              <div className="text-sm font-medium text-slate-700">{label}</div>
              <div className="text-xs text-slate-400">{description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Result */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {result ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {ACTIONS.find((a) => a.key === activeAction)?.label}
              </p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
            <div className="p-3 border-t border-slate-100 flex gap-2">
              {activeAction !== "find_gaps" && (
                <Button size="sm" className="flex-1 gap-1.5" onClick={() => onApply(result)}>
                  <Check className="h-3.5 w-3.5" />
                  {t.ms_assist_apply}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className={cn("gap-1.5", activeAction === "find_gaps" && "flex-1")}
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t.ms_assist_copied : t.ms_assist_copy}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <Wand2 className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                {!content.trim() ? t.ms_assist_no_text : t.ms_assist_pick_action}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
