import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AnalysisResult } from "@/types/database";

interface SaveRequest {
  datasetName: string;
  nRows: number;
  nCols: number;
  query: string;
  result: AnalysisResult;
  suggestions: string[];
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

    const body: SaveRequest = await request.json();

    const { data, error } = await supabase
      .from("data_analyses")
      .insert({
        user_id: user.id,
        dataset_name: body.datasetName,
        n_rows: body.nRows,
        n_cols: body.nCols,
        query: body.query,
        result: body.result as unknown as Record<string, unknown>,
        suggestions: body.suggestions,
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error("Save analysis error:", err);
    return NextResponse.json({ error: "Errore nel salvataggio" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

    const { data, error } = await supabase
      .from("data_analyses")
      .select("id, dataset_name, n_rows, n_cols, query, suggestions, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ analyses: data ?? [] });
  } catch (err) {
    console.error("List analyses error:", err);
    return NextResponse.json({ error: "Errore nel caricamento" }, { status: 500 });
  }
}
