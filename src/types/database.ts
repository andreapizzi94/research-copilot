export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          institution: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          institution?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          institution?: string | null;
          updated_at?: string;
        };
      };
      research_contexts: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          population: string | null;
          outcomes: string | null;
          keywords: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          population?: string | null;
          outcomes?: string | null;
          keywords?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          topic?: string;
          population?: string | null;
          outcomes?: string | null;
          keywords?: string[];
          updated_at?: string;
        };
      };
      saved_papers: {
        Row: {
          id: string;
          user_id: string;
          pubmed_id: string;
          title: string;
          authors: string[];
          abstract: string | null;
          journal: string | null;
          year: number | null;
          doi: string | null;
          relevance_score: number | null;
          ai_summary: string | null;
          ai_relevance_note: string | null;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pubmed_id: string;
          title: string;
          authors?: string[];
          abstract?: string | null;
          journal?: string | null;
          year?: number | null;
          doi?: string | null;
          relevance_score?: number | null;
          ai_summary?: string | null;
          ai_relevance_note?: string | null;
          tags?: string[];
          created_at?: string;
        };
        Update: {
          ai_summary?: string | null;
          ai_relevance_note?: string | null;
          tags?: string[];
        };
      };
      manuscripts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          introduction: string | null;
          methods: string | null;
          results: string | null;
          discussion: string | null;
          status: string;
          cited_paper_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          introduction?: string | null;
          methods?: string | null;
          results?: string | null;
          discussion?: string | null;
          status?: string;
          cited_paper_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          introduction?: string | null;
          methods?: string | null;
          results?: string | null;
          discussion?: string | null;
          status?: string;
          cited_paper_ids?: string[];
          updated_at?: string;
        };
      };
      data_analyses: {
        Row: {
          id: string;
          user_id: string;
          dataset_name: string;
          n_rows: number | null;
          n_cols: number | null;
          query: string;
          result: Json;
          suggestions: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dataset_name?: string;
          n_rows?: number | null;
          n_cols?: number | null;
          query: string;
          result: Json;
          suggestions?: string[];
          created_at?: string;
        };
        Update: {
          dataset_name?: string;
          query?: string;
          result?: Json;
          suggestions?: string[];
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// ─── App-level types ──────────────────────────────────────────────────────────

export interface Paper {
  id?: string;
  pubmedId: string;
  title: string;
  authors: string[];
  abstract: string;
  journal: string;
  year: number;
  doi?: string;
  relevanceScore?: number;
  aiSummary?: string;
  aiRelevanceNote?: string;
  tags?: string[];
  saved?: boolean;
}

export interface ResearchContext {
  id?: string;
  topic: string;
  population: string;
  outcomes: string;
  keywords: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Manuscript ───────────────────────────────────────────────────────────────

export type ManuscriptSection = "introduction" | "methods" | "results" | "discussion";
export type ManuscriptStatus = "draft" | "review" | "final";
export type AssistAction = "expand" | "rewrite" | "compress" | "find_gaps";

export interface Manuscript {
  id?: string;
  title: string;
  introduction: string;
  methods: string;
  results: string;
  discussion: string;
  status: ManuscriptStatus;
  citedPaperIds: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ManuscriptSummary {
  id: string;
  title: string;
  status: ManuscriptStatus;
  updatedAt: string;
  introPreview: string;
}

// ─── Data Analysis ────────────────────────────────────────────────────────────

export type ColumnType = "numeric" | "categorical" | "date" | "boolean";
export type ChartType = "bar" | "scatter" | "histogram" | "boxplot" | "frequency";
export type AnalysisType =
  | "descriptive"
  | "comparison"
  | "correlation"
  | "regression"
  | "frequency"
  | "survival";

export interface ColumnStat {
  name: string;
  type: ColumnType;
  n: number;
  missing: number;
  // Numeric
  mean?: number;
  sd?: number;
  median?: number;
  q1?: number;
  q3?: number;
  min?: number;
  max?: number;
  // Categorical
  categories?: { value: string; count: number; pct: number }[];
  nUnique?: number;
}

export interface ParsedDataset {
  headers: string[];
  rows: string[][];
  columnStats: ColumnStat[];
  nRows: number;
  nCols: number;
  delimiter: string;
}

export interface ChartPoint {
  x: string | number;
  y: number;
  error?: number;  // SD / SEM for bar, null for others
  n?: number;
  group?: string;
  // Box plot fields
  q1?: number;
  q3?: number;
  min?: number;
  max?: number;
  outliers?: number[];
}

export interface ChartData {
  type: ChartType;
  title: string;
  xLabel?: string;
  yLabel?: string;
  data: ChartPoint[];
}

export interface StatGroup {
  group: string;
  n: number;
  rows: { label: string; value: string }[];
}

export interface AnalysisBlock {
  type: AnalysisType;
  title: string;
  test?: string;
  pValue?: number | null;
  significance?: "***" | "**" | "*" | "NS" | null;
  effectSize?: string | null;
  statistics: StatGroup[];
  chart?: ChartData | null;
  assumptions?: string;
  interpretation: string;
  conclusion: string;
}

export interface AnalysisResult {
  analyses: AnalysisBlock[];
  suggestions: string[];
}

export interface SavedAnalysis {
  id: string;
  datasetName: string;
  nRows: number;
  nCols: number;
  query: string;
  result: AnalysisResult;
  suggestions: string[];
  createdAt: string;
}
