/**
 * Direct GitHub API client — runs server-side in Next.js.
 * No backend dependency needed.
 */

const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'OSStore/1.0',
  };
  if (GITHUB_TOKEN) {
    h['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  }
  return h;
}

// ── Types ───────────────────────────────────────────────────

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  license: { spdx_id: string; name: string } | null;
  topics: string[];
  owner: { avatar_url: string; login: string };
  pushed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  assets: {
    name: string;
    browser_download_url: string;
    size: number;
    content_type: string;
  }[];
}

// ── Search ──────────────────────────────────────────────────

export async function searchRepos(
  query: string,
  page: number = 1,
  perPage: number = 20,
): Promise<{ items: GitHubRepo[]; total_count: number }> {
  const params = new URLSearchParams({
    q: query,
    sort: 'stars',
    order: 'desc',
    page: String(page),
    per_page: String(perPage),
  });

  const res = await fetch(`${GITHUB_API}/search/repositories?${params}`, {
    headers: headers(),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    console.error('GitHub search failed:', res.status, await res.text().catch(() => ''));
    return { items: [], total_count: 0 };
  }

  return res.json();
}

// ── Fetch single repo ───────────────────────────────────────

export async function fetchRepo(owner: string, repo: string): Promise<GitHubRepo | null> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: headers(),
    next: { revalidate: 120 },
  });

  if (!res.ok) return null;
  return res.json();
}

// ── Releases ────────────────────────────────────────────────

export async function fetchReleases(
  owner: string,
  repo: string,
  perPage: number = 10,
): Promise<GitHubRelease[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/releases?per_page=${perPage}`,
    {
      headers: headers(),
      next: { revalidate: 300 },
    },
  );

  if (!res.ok) return [];
  return res.json();
}

// ── README (rendered HTML) ──────────────────────────────────

export async function fetchReadme(owner: string, repo: string): Promise<string | null> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
    headers: {
      ...headers(),
      Accept: 'application/vnd.github.html+json',
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;

  const html = await res.text();
  // Cap at 100KB to avoid massive readmes
  return html.length > 100_000 ? html.slice(0, 100_000) + '...' : html;
}

// ── Trending (stars > 100, created recently or highly starred) ──

export async function fetchTrending(perPage: number = 10): Promise<GitHubRepo[]> {
  // Get repos that gained stars recently — use pushed:> last 7 days + stars > 500
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().split('T')[0];
  const params = new URLSearchParams({
    q: `stars:>500 pushed:>${weekAgo}`,
    sort: 'stars',
    order: 'desc',
    per_page: String(perPage),
  });

  const res = await fetch(`${GITHUB_API}/search/repositories?${params}`, {
    headers: headers(),
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

// ── Detect APK in release assets ────────────────────────────

export function findApkInRelease(release: GitHubRelease | null): {
  apk_url: string | null;
  download_url: string | null;
  latest_version: string | null;
} {
  if (!release || !release.assets) {
    return { apk_url: null, download_url: null, latest_version: null };
  }

  const apkAsset = release.assets.find((a) =>
    a.name.toLowerCase().endsWith('.apk'),
  );
  const anyAsset = release.assets.length > 0 ? release.assets[0] : null;

  return {
    apk_url: apkAsset?.browser_download_url || null,
    download_url: anyAsset?.browser_download_url || null,
    latest_version: release.tag_name?.replace(/^v/i, '') || null,
  };
}
