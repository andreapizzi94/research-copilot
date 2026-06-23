import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ManuscriptMeta {
  title: string;
  journal: string;
  articleType: string;
  topic: string;
  population?: string;
  intervention?: string;
  outcomes?: string;
  keyFindings?: string;
}

const SECTION_PROMPTS: Record<string, (meta: ManuscriptMeta, existing: Record<string, string>) => string> = {
  abstract: (meta) => `Scrivi un abstract strutturato in italiano per un articolo scientifico con queste caratteristiche:
- Titolo: ${meta.title}
- Rivista target: ${meta.journal}
- Tipo articolo: ${meta.articleType}
- Topic: ${meta.topic}
${meta.population ? `- Popolazione: ${meta.population}` : ""}
${meta.intervention ? `- Intervento/Esposizione: ${meta.intervention}` : ""}
${meta.outcomes ? `- Outcome primari: ${meta.outcomes}` : ""}
${meta.keyFindings ? `- Risultati chiave: ${meta.keyFindings}` : ""}

Struttura: Background, Obiettivi, Metodi, Risultati, Conclusioni. Max 250 parole. Linguaggio tecnico-scientifico.`,

  introduction: (meta, existing) => `Scrivi l'Introduction di un articolo scientifico in italiano.
- Titolo: ${meta.title}
- Topic: ${meta.topic}
${meta.population ? `- Popolazione: ${meta.population}` : ""}
${meta.intervention ? `- Intervento: ${meta.intervention}` : ""}
${existing.abstract ? `\nAbstract già scritto:\n${existing.abstract}` : ""}

Struttura classica: (1) contesto e rilevanza clinica, (2) stato dell'arte con gap identificato, (3) razionale e obiettivo dello studio. Circa 400-500 parole. Non citare riferimenti specifici, usa frasi come "studi precedenti hanno dimostrato...".`,

  methods: (meta, existing) => `Scrivi la sezione Methods di un articolo scientifico in italiano.
- Tipo di studio: ${meta.articleType}
- Popolazione: ${meta.population || "non specificata"}
- Intervento/Esposizione: ${meta.intervention || "non specificato"}
- Outcome: ${meta.outcomes || "non specificati"}
${existing.abstract ? `\nAbstract:\n${existing.abstract}` : ""}

Includi: disegno dello studio, criteri inclusione/esclusione, variabili misurate, analisi statistica (placeholder appropriati). Circa 400 parole. Usa sottotitoli: Disegno dello studio, Popolazione, Variabili, Analisi statistica.`,

  results: (meta, existing) => `Scrivi la sezione Results di un articolo scientifico in italiano.
- Topic: ${meta.topic}
- Outcome: ${meta.outcomes || "non specificati"}
- Risultati chiave: ${meta.keyFindings || "non specificati"}
${existing.methods ? `\nMetodi:\n${existing.methods}` : ""}

Presenta i risultati in modo logico: prima le caratteristiche baseline della popolazione, poi i risultati principali, poi le analisi secondarie. Usa placeholder come [N=XXX], [p<0.05], [95% CI: X-Y] dove appropriato. Circa 350 parole.`,

  discussion: (meta, existing) => `Scrivi la Discussion di un articolo scientifico in italiano.
- Topic: ${meta.topic}
- Risultati chiave: ${meta.keyFindings || "vedere results"}
${existing.results ? `\nResults:\n${existing.results}` : ""}
${existing.introduction ? `\nIntroduzione (per coerenza):\n${existing.introduction.slice(0, 500)}` : ""}

Struttura: (1) sintesi del finding principale, (2) confronto con letteratura esistente, (3) meccanismi plausibili, (4) implicazioni cliniche, (5) limitazioni dello studio, (6) conclusione. Circa 500-600 parole.`,
};

export async function POST(request: Request) {
  try {
    const { section, meta, existingSections } = await request.json() as {
      section: string;
      meta: ManuscriptMeta;
      existingSections: Record<string, string>;
    };

    const promptFn = SECTION_PROMPTS[section];
    if (!promptFn) {
      return NextResponse.json({ error: "Sezione non valida" }, { status: 400 });
    }

    const prompt = promptFn(meta, existingSections);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Sei un esperto redattore di articoli scientifici biomedici. ${prompt}\n\nRispondi SOLO con il testo della sezione, senza titoli aggiuntivi o commenti.`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ text });
  } catch (error) {
    console.error("Manuscript generate error:", error);
    return NextResponse.json({ error: "Errore nella generazione" }, { status: 500 });
  }
}
