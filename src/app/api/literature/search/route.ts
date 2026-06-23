import { NextResponse } from "next/server";
import type { ResearchContext, Paper } from "@/types/database";

const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const API_KEY = process.env.PUBMED_API_KEY ? `&api_key=${process.env.PUBMED_API_KEY}` : "";

async function searchPubMed(query: string, maxResults: number): Promise<{ ids: string[]; total: number }> {
  const encodedQuery = encodeURIComponent(query);
  const url = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodedQuery}&retmax=${maxResults}&retmode=json&sort=relevance${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("PubMed search failed");
  const data = await res.json();
  return { ids: data.esearchresult.idlist, total: parseInt(data.esearchresult.count, 10) };
}

async function fetchPubMedDetails(ids: string[]): Promise<Paper[]> {
  if (ids.length === 0) return [];
  const summaryUrl = `${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json${API_KEY}`;
  const summaryRes = await fetch(summaryUrl);
  const summaryData = await summaryRes.json();
  const papers: Paper[] = [];
  for (const id of ids) {
    const article = summaryData.result?.[id];
    if (!article) continue;
    const authors = (article.authors || []).map((a: { name: string }) => a.name).filter(Boolean);
    const year = article.pubdate ? parseInt(article.pubdate.split(" ")[0], 10) : 0;
    papers.push({
      pubmedId: id,
      title: article.title || "Titolo non disponibile",
      authors,
      abstract: "",
      journal: article.source || "",
      year: year || 0,
      doi: article.elocationid?.replace("doi: ", "") || undefined,
    });
  }
  return papers;
}

async function fetchAbstracts(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const url = `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${ids.join(",")}&rettype=abstract&retmode=xml${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return {};
  const xml = await res.text();
  const abstracts: Record<string, string> = {};
  const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
  let match;
  while ((match = articleRegex.exec(xml)) !== null) {
    const articleXml = match[1];
    const idMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    const abstractMatch = articleXml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g);
    if (idMatch && abstractMatch) {
      abstracts[idMatch[1]] = abstractMatch.map((t) => t.replace(/<[^>]+>/g, "")).join(" ");
    }
  }
  return abstracts;
}

function scoreRelevance(paper: Paper, context: ResearchContext): number {
  const text = `${paper.title} ${paper.abstract}`.toLowerCase();
  let score = 50;
  const topicWords = context.topic.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
  const topicMatches = topicWords.filter((w) => text.includes(w)).length;
  score += Math.min(30, (topicMatches / Math.max(topicWords.length, 1)) * 30);
  const kwMatches = (context.keywords || []).filter((kw) => text.includes(kw.toLowerCase())).length;
  score += Math.min(15, kwMatches * 5);
  if (context.population && text.includes(context.population.toLowerCase().split(" ")[0])) score += 5;
  return Math.min(100, Math.round(score));
}

export async function POST(request: Request) {
  try {
    const { query, context, maxResults = 20 } = await request.json();
    if (!query?.trim()) return NextResponse.json({ error: "Query richiesta" }, { status: 400 });

    let enrichedQuery = query;
    if (context?.keywords?.length) {
      const kwString = context.keywords.slice(0, 3).join(" OR ");
      enrichedQuery = `(${query}) AND (${kwString})`;
    }

    let { ids, total } = await searchPubMed(enrichedQuery, maxResults);
    if (ids.length === 0) {
      const fallback = await searchPubMed(query, maxResults);
      ids = fallback.ids;
      total = fallback.total;
    }
    if (ids.length === 0) return NextResponse.json({ papers: [], total: 0 });

    const [papers, abstracts] = await Promise.all([fetchPubMedDetails(ids), fetchAbstracts(ids)]);
    const enrichedPapers = papers.map((p) => {
      const withAbstract = { ...p, abstract: abstracts[p.pubmedId] || "" };
      return { ...withAbstract, relevanceScore: context ? scoreRelevance(withAbstract, context) : undefined };
    });
    if (context) enrichedPapers.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

    return NextResponse.json({ papers: enrichedPapers, total });
  } catch (error) {
    console.error("Literature search error:", error);
    return NextResponse.json({ error: "Errore nella ricerca" }, { status: 500 });
  }
}