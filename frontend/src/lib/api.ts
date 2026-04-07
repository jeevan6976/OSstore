const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface TrustScore {
  overall: number;
  activity_score: number;
  community_score: number;
  maintenance_score: number;
  popularity_score: number;
  computed_at: string;
}

export interface RiskFlag {
  flag_type: string;
  severity: string;
  message: string;
  detected_at: string;
}

export interface Tool {
  id: string;
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  watchers: number;
  license: string | null;
  topics: string | null;
  source: string;
  owner_avatar: string | null;
  last_pushed_at: string | null;
  last_commit_at: string | null;
  created_at: string;
  updated_at: string;
  trust_score: TrustScore | null;
  risk_flags: RiskFlag[];
}

export interface SearchResult {
  tools: Tool[];
  total: number;
  query: string;
  page: number;
  per_page: number;
}

export async function searchTools(
  query: string,
  page: number = 1,
  perPage: number = 20,
  language?: string,
): Promise<SearchResult> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    per_page: String(perPage),
  });
  if (language) params.set('language', language);

  const res = await fetch(`${API_URL}/api/search?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  return res.json();
}

export async function getTool(id: string): Promise<Tool> {
  const res = await fetch(`${API_URL}/api/tool/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Tool fetch failed: ${res.status}`);
  }

  return res.json();
}
