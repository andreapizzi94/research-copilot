import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Paper } from "@/types/database";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const { paper }: { paper: Paper } = await request.json();

    const { error } = await supabase.from("saved_papers").upsert({
      user_id: user.id,
      pubmed_id: paper.pubmedId,
      title: paper.title,
      authors: paper.authors,
      abstract: paper.abstract,
      journal: paper.journal,
      year: paper.year,
      doi: paper.doi,
      relevance_score: paper.relevanceScore,
      ai_summary: paper.aiSummary,
      ai_relevance_note: paper.aiRelevanceNote,
      tags: paper.tags ?? [],
    }, { onConflict: "user_id,pubmed_id" });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save paper error:", error);
    return NextResponse.json({ error: "Errore nel salvataggio" }, { status: 500 });
  }
}
