import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Lang = "it" | "en";

function buildPrompt(
  action: string,
  section: string,
  content: string,
  contextStr: string,
  lang: Lang
): string {
  const isEn = lang === "en";

  const intro = isEn
    ? `You are an expert biomedical scientific writer. `
    : `Sei un esperto redattore di articoli scientifici biomedici. `;

  const replyInstruction = isEn
    ? `Respond ONLY with the result, no additional commentary.`
    : `Rispondi SOLO con il risultato, senza commenti aggiuntivi.`;

  const contextLine = isEn
    ? `Research context: ${contextStr}`
    : `Contesto di ricerca: ${contextStr}`;

  const originalLine = isEn ? `Original text:` : `Testo originale:`;

  const actions: Record<string, string> = {
    expand: isEn
      ? `${intro}Expand and deepen the following text from the "${section}" section of a scientific article, adding scientific details, literature references (use placeholder [Author, year]), biological mechanisms and relevant epidemiological data. Maintain a formal scientific tone.\n\n${contextLine}\n\n${originalLine}\n${content}\n\n${replyInstruction}`
      : `${intro}Espandi e approfondisci il seguente testo della sezione "${section}" di un articolo scientifico, aggiungendo dettagli scientifici, riferimenti alla letteratura (usa placeholder [Autore, anno]), meccanismi biologici e dati epidemiologici rilevanti. Mantieni il tono formale e scientifico.\n\n${contextLine}\n\n${originalLine}\n${content}\n\n${replyInstruction}`,

    rewrite: isEn
      ? `${intro}Rewrite the following text from the "${section}" section improving scientific formality, terminological precision and readability. Keep all original information but improve writing quality.\n\n${contextLine}\n\n${originalLine}\n${content}\n\n${replyInstruction}`
      : `${intro}Riscrivi il seguente testo della sezione "${section}" migliorando la formalità scientifica, la precisione terminologica e la scorrevolezza del testo. Mantieni tutte le informazioni originali ma migliora la qualità della scrittura.\n\n${contextLine}\n\n${originalLine}\n${content}\n\n${replyInstruction}`,

    compress: isEn
      ? `${intro}Summarize the following text from the "${section}" section keeping all essential concepts and eliminating redundancies. The result should be about 60% of the original length.\n\n${contextLine}\n\n${originalLine}\n${content}\n\n${replyInstruction}`
      : `${intro}Sintetizza il seguente testo della sezione "${section}" mantenendo tutti i concetti essenziali ed eliminando ridondanze. Il testo risultante deve essere circa il 60% dell'originale.\n\n${contextLine}\n\n${originalLine}\n${content}\n\n${replyInstruction}`,

    find_gaps: isEn
      ? `${intro}Analyze the following text from the "${section}" section and identify:\n1. Missing or insufficiently developed points\n2. Claims that require bibliographic citations\n3. Weak or unsupported arguments\n4. Methodological or scientific aspects to deepen\n\n${contextLine}\n\nText to analyze:\n${content}\n\nProvide a structured critical analysis with concrete suggestions.`
      : `${intro}Analizza il seguente testo della sezione "${section}" e identifica:\n1. Punti mancanti o insufficientemente sviluppati\n2. Affermazioni che richiedono citazioni bibliografiche\n3. Argomentazioni deboli o non supportate\n4. Aspetti metodologici o scientifici da approfondire\n\n${contextLine}\n\nTesto da analizzare:\n${content}\n\nFornisci un'analisi critica strutturata con suggerimenti concreti.`,
  };

  return actions[action] ?? actions.rewrite;
}

export async function POST(request: Request) {
  try {
    const { section, content, action, context, lang = "it" } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Nessun testo da elaborare" }, { status: 400 });
    }

    const contextStr = context
      ? `Topic: ${context.topic}${context.population ? `, Population: ${context.population}` : ""}${context.outcomes ? `, Outcomes: ${context.outcomes}` : ""}`
      : "Not specified";

    const prompt = buildPrompt(action, section, content, contextStr, lang as Lang);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const result = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Assist error:", error);
    return NextResponse.json({ error: "Errore durante l'elaborazione" }, { status: 500 });
  }
}
