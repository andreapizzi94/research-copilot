import type { ColumnStat, ColumnType, ParsedDataset } from "@/types/database";

// ── Delimiter detection ────────────────────────────────────────────────────────

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] ?? "";
  const counts = {
    ",": (firstLine.match(/,/g) ?? []).length,
    ";": (firstLine.match(/;/g) ?? []).length,
    "\t": (firstLine.match(/\t/g) ?? []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// ── CSV line parser (handles quoted fields) ───────────────────────────────────

function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ── Type detection ────────────────────────────────────────────────────────────

const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{2}[/\-\.]\d{2}[/\-\.]\d{4}$/,
  /^\d{2}[/\-\.]\d{2}[/\-\.]\d{2}$/,
];

function detectType(values: string[]): ColumnType {
  const nonEmpty = values.filter((v) => v !== "" && v !== "NA" && v !== "N/A" && v !== "null");
  if (nonEmpty.length === 0) return "categorical";

  const numericCount = nonEmpty.filter((v) => !isNaN(Number(v)) && v !== "").length;
  if (numericCount / nonEmpty.length > 0.8) return "numeric";

  const boolValues = new Set(["true", "false", "yes", "no", "si", "sì", "1", "0"]);
  const boolCount = nonEmpty.filter((v) => boolValues.has(v.toLowerCase())).length;
  if (boolCount / nonEmpty.length > 0.9) return "boolean";

  const dateCount = nonEmpty.filter((v) => DATE_PATTERNS.some((p) => p.test(v))).length;
  if (dateCount / nonEmpty.length > 0.8) return "date";

  return "categorical";
}

// ── Column statistics ─────────────────────────────────────────────────────────

function computeNumericStats(values: number[]): Partial<ColumnStat> {
  if (values.length === 0) return {};
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];

  return {
    mean: +mean.toFixed(4),
    sd: +sd.toFixed(4),
    median: +median.toFixed(4),
    q1: +q1.toFixed(4),
    q3: +q3.toFixed(4),
    min: sorted[0],
    max: sorted[n - 1],
  };
}

function computeCategoricalStats(values: string[]): Partial<ColumnStat> {
  const freq: Record<string, number> = {};
  for (const v of values) {
    freq[v] = (freq[v] ?? 0) + 1;
  }
  const total = values.length;
  const categories = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([value, count]) => ({ value, count, pct: (count / total) * 100 }));

  return { categories, nUnique: Object.keys(freq).length };
}

// ── Main parse function ───────────────────────────────────────────────────────

export function parseCSV(text: string): ParsedDataset | null {
  try {
    const delimiter = detectDelimiter(text);
    const allLines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (allLines.length < 2) return null;

    const headers = parseLine(allLines[0], delimiter).filter((h) => h.length > 0);
    if (headers.length === 0) return null;

    const rows: string[][] = [];
    for (let i = 1; i < allLines.length; i++) {
      const row = parseLine(allLines[i], delimiter);
      // Pad or trim to header count
      while (row.length < headers.length) row.push("");
      rows.push(row.slice(0, headers.length));
    }

    // Compute per-column stats
    const columnStats: ColumnStat[] = headers.map((name, ci) => {
      const rawValues = rows.map((r) => r[ci] ?? "");
      const nonEmptyRaw = rawValues.filter(
        (v) => v !== "" && v.toLowerCase() !== "na" && v.toLowerCase() !== "n/a" && v.toLowerCase() !== "null"
      );
      const missing = rawValues.length - nonEmptyRaw.length;
      const type = detectType(nonEmptyRaw);

      const base: ColumnStat = { name, type, n: nonEmptyRaw.length, missing };

      if (type === "numeric") {
        const nums = nonEmptyRaw.map(Number).filter((n) => !isNaN(n));
        return { ...base, n: nums.length, ...computeNumericStats(nums) };
      } else {
        return { ...base, ...computeCategoricalStats(nonEmptyRaw) };
      }
    });

    return { headers, rows, columnStats, nRows: rows.length, nCols: headers.length, delimiter };
  } catch {
    return null;
  }
}

// ── Suggested queries based on column structure ───────────────────────────────

export function generateSuggestions(stats: ColumnStat[]): string[] {
  const numeric = stats.filter((c) => c.type === "numeric");
  const categorical = stats.filter((c) => c.type === "categorical");
  const suggestions: string[] = [];

  if (numeric.length >= 1) {
    suggestions.push(
      `Calcola le statistiche descrittive per ${numeric.map((c) => `"${c.name}"`).join(", ")}`
    );
  }

  if (categorical.length >= 1 && numeric.length >= 1) {
    const cat = categorical[0];
    const num = numeric[0];
    const nGroups = cat.nUnique ?? 0;
    const test = nGroups === 2 ? "t-test (o Mann-Whitney)" : "ANOVA (o Kruskal-Wallis)";
    suggestions.push(
      `Confronta "${num.name}" tra i gruppi di "${cat.name}" con ${test}`
    );
  }

  if (categorical.length >= 2) {
    suggestions.push(
      `Analizza l'associazione tra "${categorical[0].name}" e "${categorical[1].name}" con chi-quadro`
    );
  }

  if (numeric.length >= 2) {
    suggestions.push(
      `Calcola la correlazione tra "${numeric[0].name}" e "${numeric[1].name}"`
    );
  }

  if (numeric.length >= 2 && categorical.length >= 1) {
    suggestions.push(
      `Regressione logistica: predici "${categorical[0].name}" usando ${numeric.slice(0, 3).map((c) => `"${c.name}"`).join(", ")}`
    );
  }

  if (numeric.length >= 3) {
    suggestions.push(
      `Analisi della distribuzione di "${numeric[0].name}": istogramma e test di normalità`
    );
  }

  return suggestions.slice(0, 5);
}
