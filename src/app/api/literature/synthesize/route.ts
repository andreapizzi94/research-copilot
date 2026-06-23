import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Paper, ResearchContext } from "@/types/database";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface SynthesizeRequest {
  paper: Paper;
  context?: ResearchContext | null;
  lang?: string;
}

export async function POST(request: Request) {
  try {
    const { paper, context, lang = "it" }: SynthesizeRequest = await request.json();

    if (!paper?.abstract) {
      return NextResponse.json({ error: "Abstract mancante" }, { status: 400 });
    }

    const contextBlock = context
      ? lang === "en"
        ? `The researcher is studying: "${context.topic}"${context.population ? `, population: ${context.population}` : ""}${context.outcomes ? `, outcomes: ${context.outcomes}` : ""}.`
        : `Il ricercatore studia: "${context.topic}"${context.population ? `, popolazione: ${context.population}` : ""}${context.outcomes ? `, outcome: ${context.outcomes}` : ""}.`
      : "";

    const langInstruction =
      lang === "en"
        ? "Respond in English. Provide: 1. A 2-3 sentence summary of the abstract (clear and technical). 2. A relevance note (1 sentence) on how this paper relates to the researcher's context."
        : "Rispondi in italiano. Fornisci: 1. Una sintesi in 2-3 frasi dell'abstract (chiara e tecnica). 2. Una nota di rilevanza (1 frase) su come questo paper si collega al contesto di ricerca.";

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are a medical research assistant. ${contextBlock}

${langInstruction}

Title: ${paper.title}
Authors: ${paper.authors.slice(0, 3).join(", ")}
Year: ${paper.year}
Journal: ${paper.journal}
Abstract: ${paper.abstract}

Respond ONLY with valid JSON:
{
  "summary": "...",
  "relevanceNote": "..."
}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ summary: result.summary, relevanceNote: result.relevanceNote });
  } catch (error) {
    console.error("Synthesize error:", error);
    return NextResponse.json({ error: "Errore nella sintesi" }, { status: 500 });
  }
}
