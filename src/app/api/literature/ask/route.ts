import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, ResearchContext } from "@/types/database";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface AskRequest {
  question: string;
  context: ResearchContext;
  history: ChatMessage[];
  lang?: string;
}

export async function POST(request: Request) {
  try {
    const { question, context, history, lang = "it" }: AskRequest = await request.json();

    const langInstruction =
      lang === "en"
        ? "Respond in English with appropriate technical medical terminology."
        : "Rispondi in italiano con terminologia tecnica appropriata.";

    const systemPrompt = `You are an expert medical research assistant helping researchers navigate scientific literature.

Research context:
- Topic: ${context.topic}
${context.population ? `- Population: ${context.population}` : ""}
${context.outcomes ? `- Outcomes: ${context.outcomes}` : ""}
${context.keywords?.length ? `- Keywords: ${context.keywords.join(", ")}` : ""}

Guidelines:
- ${langInstruction}
- Cite methodologies, evidence and limitations when relevant
- Identify literature gaps when possible
- Be concise but precise
- If you don't know a specific fact, say so clearly`;

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-6).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: question },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    });

    const answer = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Ask error:", error);
    return NextResponse.json({ error: "Errore nella risposta" }, { status: 500 });
  }
}
