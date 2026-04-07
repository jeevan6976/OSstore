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
  package_name: string | null;
  apk_url: string | null;
  download_url: string | null;
  app_type: string | null;
  icon_url: string | null;
  latest_version: string | null;
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
  source?: string,
  appType?: string,
): Promise<SearchResult> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    per_page: String(perPage),
  });
  if (language) params.set('language', language);
  if (source) params.set('source', source);
  if (appType) params.set('app_type', appType);

  const res = await fetch(`${API_URL}/api/search?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  return res.json();
}

export async function browseApps(
  page: number = 1,
  perPage: number = 20,
  query: string = '',
  source?: string,
): Promise<SearchResult> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (query) params.set('q', query);
  if (source) params.set('source', source);

  const res = await fetch(`${API_URL}/api/apps?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Apps fetch failed: ${res.status}`);
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
