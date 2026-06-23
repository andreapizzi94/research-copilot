import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

    const { manuscript } = await request.json();

    if (manuscript.id) {
      const { error } = await supabase
        .from("manuscripts")
        .update({
          title: manuscript.title,
          introduction: manuscript.introduction,
          methods: manuscript.methods,
          results: manuscript.results,
          discussion: manuscript.discussion,
          status: manuscript.status,
          cited_paper_ids: manuscript.citedPaperIds ?? [],
        })
        .eq("id", manuscript.id)
        .eq("user_id", user.id);
      if (error) throw error;
      return NextResponse.json({ id: manuscript.id });
    } else {
      const { data, error } = await supabase
        .from("manuscripts")
        .insert({
          user_id: user.id,
          title: manuscript.title,
          introduction: manuscript.introduction,
          methods: manuscript.methods,
          results: manuscript.results,
          discussion: manuscript.discussion,
          status: manuscript.status,
          cited_paper_ids: manuscript.citedPaperIds ?? [],
        })
        .select("id")
        .single();
      if (error) throw error;
      return NextResponse.json({ id: data.id });
    }
  } catch (error) {
    console.error("Manuscript save error:", error);
    return NextResponse.json({ error: "Errore nel salvataggio" }, { status: 500 });
  }
}
