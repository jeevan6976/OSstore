import { NextRequest, NextResponse } from 'next/server';

// Uses your existing GITHUB_TOKEN — GitHub Models API is free with any GitHub account.
// Model: gpt-4o-mini (free tier, no credit card needed)
// Docs: https://docs.github.com/en/github-models
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const AI_MODEL = 'gpt-4o-mini';
const AI_ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';

// ── AI helper (GitHub Models — free, uses existing GITHUB_TOKEN) ─────

async function ask(prompt: string, maxTokens = 512): Promise<string> {
  const res = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub Models API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content as string) ?? '';
}

// ── GitHub repo search ───────────────────────────────────────

interface GHRepo {
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  license: { spdx_id: string } | null;
  topics: string[];
  owner: { avatar_url: string; login: string };
  pushed_at: string | null;
  updated_at: string | null;
}

async function searchGitHub(query: string, perPage = 15): Promise<GHRepo[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'OSStore/1.0',
  };
  if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;

  const res = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}`,
    { headers },
  );

  if (!res.ok) return [];
  const data = await res.json();
  return (data.items as GHRepo[]) || [];
}

// ── Route handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not set. Add it to .env.local' },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const query: string = body.query?.trim() || '';
  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  // ── Step 1: Parse natural language → GitHub search query ──
  let intent = query;
  let githubQuery = query;
  let criteria: string[] = [];

  try {
    const raw = await ask(
      `You are an open-source software discovery expert.

User request: "${query}"

Generate the best GitHub search query to find relevant open-source tools/libraries.

Reply with ONLY valid JSON (no markdown, no explanation):
{
  "intent": "one sentence describing what the user actually needs",
  "github_query": "optimized GitHub keyword search (no natural language)",
  "criteria": ["criterion 1", "criterion 2", "criterion 3"]
}`,
      256,
    );

    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      intent = parsed.intent || query;
      githubQuery = parsed.github_query || query;
      criteria = parsed.criteria || [];
    }
  } catch {
    // fallback to raw query
  }

  // ── Step 2: Fetch GitHub repos ────────────────────────────
  const repos = await searchGitHub(githubQuery, 15);
  if (repos.length === 0) {
    return NextResponse.json({ intent, criteria, tools: [] });
  }

  // ── Step 3: Rank results + explain why each fits ──────────
  const repoList = repos.slice(0, 15).map((r, i) => {
    const topics = r.topics?.slice(0, 4).join(', ');
    return `${i + 1}. ${r.full_name} — ${r.description || 'No description'} (${r.stargazers_count.toLocaleString()} stars, ${r.language || 'unknown'}${topics ? `, topics: ${topics}` : ''})`;
  });

  // Build a lowercase map for fuzzy ID matching
  const repoMap = new Map(repos.map((r) => [r.full_name.toLowerCase(), r]));

  const defaultRanked = repos.slice(0, 5).map((r) => ({
    id: r.full_name,
    reason: 'Highly relevant open-source project',
    score: 75,
  }));

  let ranked: Array<{ id: string; reason: string; score: number }> = defaultRanked;

  try {
    const rankRaw = await ask(
      `User wants: "${query}"
Understood as: "${intent}"

GitHub repos found (use exact owner/repo ids from this list):
${repoList.join('\n')}

Pick the best 5. For each, write a short reason (max 12 words) why it fits the user's need.
Score 0–100.

Respond with ONLY a raw JSON array, no markdown fences:
[{"id":"owner/repo","reason":"why it fits","score":90}]`,
      512,
    );

    // Strip markdown fences if model wraps anyway
    const cleaned = rankRaw.replace(/```[a-z]*\n?/gi, '').trim();
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      const parsed = JSON.parse(arrMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) ranked = parsed;
    }
  } catch {
    // keep defaultRanked
  }

  // ── Step 4: Merge with full repo data ─────────────────────
  const tools = ranked
    .map((r) => {
      // Try exact match first, then lowercase, then partial match
      const repo =
        repoMap.get(r.id.toLowerCase()) ||
        repos.find((x) => x.full_name.toLowerCase().includes(r.id.toLowerCase().split('/')[1] || ''));
      if (!repo) return null;
      return {
        id: repo.full_name,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        homepage: repo.homepage || null,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        open_issues: repo.open_issues_count,
        watchers: repo.watchers_count,
        license: repo.license?.spdx_id || null,
        topics: repo.topics?.length ? JSON.stringify(repo.topics) : null,
        owner_avatar: repo.owner?.avatar_url || null,
        last_pushed_at: repo.pushed_at,
        icon_url: repo.owner?.avatar_url || null,
        match_reason: r.reason,
        match_score: r.score,
      };
    })
    .filter(Boolean);

  // Last resort — if still empty, return top 5 unranked
  if (tools.length === 0) {
    const fallback = repos.slice(0, 5).map((repo) => ({
      id: repo.full_name,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      homepage: repo.homepage || null,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      open_issues: repo.open_issues_count,
      watchers: repo.watchers_count,
      license: repo.license?.spdx_id || null,
      topics: repo.topics?.length ? JSON.stringify(repo.topics) : null,
      owner_avatar: repo.owner?.avatar_url || null,
      last_pushed_at: repo.pushed_at,
      icon_url: repo.owner?.avatar_url || null,
      match_reason: 'Matches your requirements',
      match_score: 75,
    }));
    return NextResponse.json({ intent, criteria, tools: fallback });
  }

  return NextResponse.json({ intent, criteria, tools });
}
