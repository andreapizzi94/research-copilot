import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

    const { context } = await request.json();

    const { data, error } = await supabase
      .from("research_contexts")
      .upsert({
        user_id: user.id,
        topic: context.topic,
        population: context.population ?? "",
        outcomes: context.outcomes ?? "",
        keywords: context.keywords ?? [],
      }, { onConflict: "user_id" })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("Research context save error:", error);
    return NextResponse.json({ error: "Errore nel salvataggio" }, { status: 500 });
  }
}
