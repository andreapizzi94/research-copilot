"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import type { ResearchContext } from "@/types/database";

interface Props {
  initialContext?: ResearchContext | null;
  onSave: (context: ResearchContext) => void;
}

export function ResearchContextForm({ initialContext, onSave }: Props) {
  const [topic, setTopic] = useState(initialContext?.topic ?? "");
  const [population, setPopulation] = useState(initialContext?.population ?? "");
  const [outcomes, setOutcomes] = useState(initialContext?.outcomes ?? "");
  const [keywords, setKeywords] = useState<string[]>(initialContext?.keywords ?? []);
  const [newKeyword, setNewKeyword] = useState("");
  const [saving, setSaving] = useState(false);

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (kw: string) => setKeywords(keywords.filter((k) => k !== kw));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addKeyword(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const context: ResearchContext = { topic, population, outcomes, keywords };
    try {
      await fetch("/api/research-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });
    } catch (err) {
      console.error("Errore salvataggio contesto:", err);
    } finally {
      setSaving(false);
    }
    onSave(context);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Topic di ricerca *</label>
        <Textarea
          placeholder="Es: effetti della metformina sul rischio cardiovascolare in pazienti diabetici tipo 2"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          className="resize-none"
          rows={2}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Popolazione di interesse</label>
        <Input
          placeholder="Es: adulti >60 anni con diabete tipo 2 e comorbidità"
          value={population}
          onChange={(e) => setPopulation(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Outcome primari</label>
        <Input
          placeholder="Es: incidenza MACE, mortalità cardiovascolare, ospedalizzazioni"
          value={outcomes}
          onChange={(e) => setOutcomes(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Keywords di ricerca</label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Aggiungi keyword..."
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button type="button" variant="outline" size="icon" onClick={addKeyword}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <Badge key={kw} variant="secondary" className="gap-1">
                {kw}
                <button type="button" onClick={() => removeKeyword(kw)} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={!topic.trim() || saving}>
        {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : "Salva contesto e inizia ricerca"}
      </Button>
    </form>
  );
}
