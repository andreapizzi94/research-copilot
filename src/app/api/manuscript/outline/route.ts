import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const { context, papers, lang = "it" } = await request.json();

    const papersText = papers?.length
      ? papers
          .slice(0, 8)
          .map(
            (
              p: { title: string; authors: string[]; year: number; aiSummary?: string },
              i: number
            ) => `${i + 1}. ${p.title} (${p.authors?.[0] ?? ""}, ${p.year})\n${p.aiSummary ?? ""}`
          )
          .join("\n\n")
      : lang === "en"
      ? "No saved papers."
      : "Nessun paper salvato.";

    const langInstruction =
      lang === "en"
        ? "Generate all sections in English. Use formal academic medical writing style."
        : "Genera tutte le sezioni in italiano. Usa uno stile scientifico formale da articolo accademico medico.";

    const prompt = `You are an expert biomedical scientific writer. Generate a structured IMRaD draft for a scientific article based on this research context:

Topic: ${context.topic}
${context.population ? `Population: ${context.population}` : ""}
${context.outcomes ? `Outcomes: ${context.outcomes}` : ""}

Reference papers saved by the researcher:
${papersText}

${langInstruction}

Generate the 4 sections (introduction, methods, results, discussion) as structured drafts with ## subheadings and realistic placeholder content. For results use placeholders like [N=XXX], [p=0.XX], [95% CI: X-Y].

Respond ONLY with valid JSON:
{
  "introduction": "...",
  "methods": "...",
  "results": "...",
  "discussion": "..."
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response");

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Outline error:", error);
    return NextResponse.json({ error: "Errore nella generazione" }, { status: 500 });
  }
}
