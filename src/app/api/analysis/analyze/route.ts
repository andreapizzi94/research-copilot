import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ColumnStat, AnalysisResult } from "@/types/database";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface AnalyzeRequest {
  query: string;
  headers: string[];
  rows: string[][];
  columnStats: ColumnStat[];
  datasetName: string;
  lang?: string;
}

function formatColumnStats(stats: ColumnStat[]): string {
  return stats
    .map((c) => {
      if (c.type === "numeric") {
        return `- "${c.name}" [Numeric]: n=${c.n}, missing=${c.missing}, mean=${c.mean?.toFixed(2)}, sd=${c.sd?.toFixed(2)}, median=${c.median}, Q1=${c.q1}, Q3=${c.q3}, min=${c.min}, max=${c.max}`;
      } else if (c.type === "categorical") {
        const cats =
          c.categories
            ?.slice(0, 6)
            .map((v) => `${v.value}(${v.count}, ${v.pct.toFixed(1)}%)`)
            .join(", ") ?? "";
        return `- "${c.name}" [Categorical]: n=${c.n}, missing=${c.missing}, unique=${c.nUnique}, frequencies: ${cats}`;
      } else if (c.type === "date") {
        return `- "${c.name}" [Date]: n=${c.n}, missing=${c.missing}`;
      }
      return `- "${c.name}" [${c.type}]: n=${c.n}`;
    })
    .join("\n");
}

function buildCsvSample(headers: string[], rows: string[][], maxRows = 100): string {
  const sample = rows.slice(0, maxRows);
  const lines = [headers.join(","), ...sample.map((r) => r.join(","))];
  return lines.join("\n");
}

function buildSystemPrompt(lang: string): string {
  const langInstruction =
    lang === "en"
      ? "Respond entirely in English with appropriate statistical and clinical terminology."
      : "Rispondi interamente in italiano con terminologia statistica e clinica appropriata.";

  return `You are an expert biomedical statistician with experience in clinical research and epidemiological data analysis. Your task is to analyze medical datasets and answer researcher questions with scientific rigor.

${langInstruction}

Rules:
1. Calculate statistics DIRECTLY from the raw data provided — do not use invented values
2. Choose the most appropriate statistical test based on variable type, distribution and hypothesis
3. Always report: n per group, central tendency and dispersion measures, 95% CI, p-value, effect size
4. Verify test assumptions (normality for n<50, homogeneity of variances, etc.)
5. Distinguish between statistical significance and clinical relevance
6. Suggest relevant follow-up analyses

For charts:
- "bar": group comparison (y=mean, error=SD)
- "boxplot": distribution per group (q1, q3, min, max required)
- "scatter": correlation between two numeric variables (numeric x and y)
- "histogram": variable distribution (x=range/bin, y=frequency)
- "frequency": categorical distribution (x=category, y=count or %)`;
}

export async function POST(request: Request) {
  try {
    const { query, headers, rows, columnStats, datasetName, lang = "it" }: AnalyzeRequest =
      await request.json();

    if (!rows?.length || !headers?.length) {
      return NextResponse.json({ error: "Nessun dato caricato" }, { status: 400 });
    }
    if (!query?.trim()) {
      return NextResponse.json({ error: "Domanda mancante" }, { status: 400 });
    }

    const colSummary = formatColumnStats(columnStats);
    const csvSample = buildCsvSample(headers, rows, 120);
    const nSample = Math.min(rows.length, 120);

    const userPrompt = `## DATASET: "${datasetName}"
Total rows: ${rows.length} | Columns: ${headers.length}
${rows.length > 120 ? `⚠️ Analysis on first ${nSample} records (dataset truncated).` : ""}

## COLUMN STATISTICS (pre-computed)
${colSummary}

## RAW DATA (CSV, first ${nSample} rows)
\`\`\`
${csvSample}
\`\`\`

## RESEARCHER QUESTION
${query}

## REQUIRED RESPONSE
Respond EXCLUSIVELY with valid JSON in the following format (no additional text before or after):

{
  "analyses": [
    {
      "type": "descriptive | comparison | correlation | regression | frequency | survival",
      "title": "Descriptive title",
      "test": "Statistical test name (null if descriptive only)",
      "pValue": 0.034,
      "significance": "*** | ** | * | NS | null",
      "effectSize": "Cohen's d = 0.45 (medium) | OR = 2.3 (95%CI: 1.1–4.8) | r = 0.67 | null",
      "statistics": [
        {
          "group": "Group or variable name",
          "n": 45,
          "rows": [
            {"label": "Mean (SD)", "value": "45.2 (±12.3)"},
            {"label": "Median [IQR]", "value": "43.0 [36–52]"},
            {"label": "Range", "value": "21–78"},
            {"label": "95% CI", "value": "42.5–48.0"}
          ]
        }
      ],
      "chart": {
        "type": "bar | scatter | histogram | boxplot | frequency",
        "title": "Chart title",
        "xLabel": "X axis label",
        "yLabel": "Y axis label",
        "data": [
          {
            "x": "Group A",
            "y": 45.2,
            "error": 12.3,
            "n": 45,
            "q1": 36,
            "q3": 52,
            "min": 21,
            "max": 78,
            "outliers": []
          }
        ]
      },
      "assumptions": "Assumption checks: Shapiro-Wilk normal (p=0.12); homogeneous variances (Levene p=0.34)",
      "interpretation": "Detailed clinical interpretation...",
      "conclusion": "Statistical summary: statistically significant difference (p=0.034, α=0.05), medium effect size"
    }
  ],
  "suggestions": [
    "Suggested analysis 1",
    "Suggested analysis 2",
    "Suggested analysis 3"
  ]
}

Format notes:
- pValue: decimal number (e.g. 0.034) or null for descriptive analyses
- significance: "***" if p<0.001, "**" if p<0.01, "*" if p<0.05, "NS" if p≥0.05
- chart.data for boxplot: include q1, q3, min, max
- chart.data for scatter: x and y are NUMERIC values
- If multiple analyses are needed, include all objects in the "analyses" array`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: buildSystemPrompt(lang),
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "{}";

    const jsonMatch =
      rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
      rawText.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      console.error("No JSON in response:", rawText.slice(0, 500));
      return NextResponse.json(
        { error: "Formato risposta non valido. Riprova." },
        { status: 500 }
      );
    }

    const result: AnalysisResult = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);

    if (!result.analyses || !Array.isArray(result.analyses)) {
      result.analyses = [];
    }
    if (!result.suggestions || !Array.isArray(result.suggestions)) {
      result.suggestions = [];
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Analysis error:", err);
    const msg =
      err instanceof SyntaxError
        ? "Errore nel parsing della risposta AI. Riprova."
        : "Errore durante l'analisi.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
