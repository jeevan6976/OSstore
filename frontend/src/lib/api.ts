/**
 * API layer — calls GitHub API directly from Next.js server-side.
 * No external backend needed. Trust scores computed locally.
 */

import {
  searchRepos,
  fetchRepo,
  fetchReleases,
  fetchReadme,
  fetchTrending,
  analyzeRelease,
  type GitHubRepo,
  type GitHubRelease,
  type PlatformAsset,
  type ReleaseAnalysis,
} from './github';
import {
  computeTrustScore,
  computeRiskFlags,
  type TrustScore,
  type RiskFlag,
} from './trust';
import { getSecurityScan, type SecurityScan } from './security';

// ── Public Types ────────────────────────────────────────────

export type { TrustScore, RiskFlag, SecurityScan };

export interface Version {
  version: string;
  code: string;
  apk_url: string;
  size: number;
  added: string | null;
  download_url?: string;
}

export interface InstallOption {
  platform: string;
  label: string;
  fileName: string;
  url: string;
  size: number;
  downloads: number;
  fileType: string;
  icon: string;
  color: string;
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
  package_name: string | null;
  apk_url: string | null;
  download_url: string | null;
  app_type: string | null;
  icon_url: string | null;
  latest_version: string | null;
  readme_html: string | null;
  trust_score: TrustScore | null;
  risk_flags: RiskFlag[];
  versions: Version[];
  install_options: InstallOption[];
  total_downloads: number;
  security_scan: SecurityScan | null;
}

export interface SearchResult {
  tools: Tool[];
  total: number;
  query: string;
  page: number;
  per_page: number;
}

// ── Platform icon/color mapping ─────────────────────────────

const PLATFORM_STYLE: Record<string, { icon: string; color: string }> = {
  android: { icon: '🤖', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  macos: { icon: '🍎', color: 'bg-gray-900 hover:bg-gray-800 text-white' },
  windows: { icon: '🪟', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  linux: { icon: '🐧', color: 'bg-amber-600 hover:bg-amber-700 text-white' },
  ios: { icon: '📱', color: 'bg-gray-900 hover:bg-gray-800 text-white' },
  web: { icon: '🌐', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  other: { icon: '📦', color: 'bg-gray-600 hover:bg-gray-700 text-white' },
};

function platformAssetsToInstallOptions(platforms: PlatformAsset[]): InstallOption[] {
  return platforms.map((p) => {
    const style = PLATFORM_STYLE[p.platform] || PLATFORM_STYLE.other;
    return { ...p, icon: style.icon, color: style.color };
  });
}

// ── Transform GitHub Repo → Tool ────────────────────────────

function repoToTool(repo: GitHubRepo, analysis?: ReleaseAnalysis): Tool {
  const trust = computeTrustScore(
    repo.stargazers_count,
    repo.forks_count,
    repo.watchers_count,
    repo.open_issues_count,
    repo.pushed_at,
    repo.updated_at,
  );

  const risks = computeRiskFlags(
    repo.stargazers_count,
    repo.forks_count,
    repo.open_issues_count,
    repo.license?.spdx_id || null,
    repo.pushed_at,
  );

  const hasApk = !!(analysis?.apk_url);

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
    source: 'github',
    owner_avatar: repo.owner?.avatar_url || null,
    last_pushed_at: repo.pushed_at,
    last_commit_at: repo.updated_at,
    package_name: null,
    apk_url: analysis?.apk_url || null,
    download_url: analysis?.download_url || null,
    app_type: hasApk ? 'app' : 'tool',
    icon_url: repo.owner?.avatar_url || null,
    latest_version: analysis?.latest_version || null,
    readme_html: null,
    trust_score: trust,
    risk_flags: risks,
    versions: [],
    install_options: platformAssetsToInstallOptions(analysis?.platforms || []),
    total_downloads: analysis?.total_downloads || 0,
    security_scan: null,
  };
}

// ── Convert GitHub Releases → Version[] ─────────────────────

function releasesToVersions(releases: GitHubRelease[]): Version[] {
  return releases.map((r) => {
    const apk = r.assets?.find((a) => a.name.toLowerCase().endsWith('.apk'));
    const firstAsset = r.assets?.[0];
    return {
      version: r.tag_name?.replace(/^v/i, '') || 'unknown',
      code: r.tag_name || '',
      apk_url: apk?.browser_download_url || '',
      size: apk?.size || firstAsset?.size || 0,
      added: r.published_at || null,
      download_url: firstAsset?.browser_download_url || '',
    };
  });
}

// ── Public API Functions ────────────────────────────────────

/**
 * Search GitHub repos directly.
 */
export async function searchTools(
  query: string,
  page: number = 1,
  perPage: number = 20,
): Promise<SearchResult> {
  const data = await searchRepos(query, page, perPage);

  const tools = await Promise.all(
    data.items.map(async (repo) => {
      try {
        const releases = await fetchReleases(repo.owner.login, repo.name, 1);
        const analysis = analyzeRelease(releases[0] || null);
        return repoToTool(repo, analysis);
      } catch {
        return repoToTool(repo);
      }
    }),
  );

  return {
    tools,
    total: data.total_count,
    query,
    page,
    per_page: perPage,
  };
}

/**
 * Browse apps — search GitHub with a broad query.
 */
export async function browseApps(
  page: number = 1,
  perPage: number = 20,
  query: string = '',
  source?: string,
): Promise<SearchResult> {
  const q = query || 'stars:>100';
  const data = await searchRepos(q, page, perPage);

  const tools = await Promise.all(
    data.items.map(async (repo) => {
      try {
        const releases = await fetchReleases(repo.owner.login, repo.name, 1);
        const analysis = analyzeRelease(releases[0] || null);
        return repoToTool(repo, analysis);
      } catch {
        return repoToTool(repo);
      }
    }),
  );

  return {
    tools,
    total: data.total_count,
    query: query || 'Popular',
    page,
    per_page: perPage,
  };
}

/**
 * Get a single tool by its GitHub owner/repo id.
 */
export async function getTool(id: string): Promise<Tool> {
  const parts = id.split('/');
  if (parts.length < 2) throw new Error('Invalid tool id');

  const owner = parts[0];
  const repo = parts[1];

  const [repoData, releases, readmeHtml, securityScan] = await Promise.all([
    fetchRepo(owner, repo),
    fetchReleases(owner, repo, 10),
    fetchReadme(owner, repo),
    getSecurityScan(owner, repo),
  ]);

  if (!repoData) throw new Error('Repo not found');

  const analysis = analyzeRelease(releases[0] || null);
  const tool = repoToTool(repoData, analysis);

  tool.readme_html = readmeHtml;
  tool.security_scan = securityScan;
  tool.versions = releasesToVersions(releases);

  if (!tool.latest_version && releases.length > 0) {
    tool.latest_version = releases[0].tag_name?.replace(/^v/i, '') || null;
  }

  if (tool.homepage && tool.homepage !== tool.url) {
    tool.install_options.push({
      platform: 'web',
      label: 'Website',
      fileName: '',
      url: tool.homepage,
      size: 0,
      downloads: 0,
      fileType: 'web',
      icon: '🌐',
      color: 'bg-purple-600 hover:bg-purple-700 text-white',
    });
  }

  return tool;
}

/**
 * Get trending repos from GitHub.
 */
export async function getTrending(): Promise<SearchResult> {
  const repos = await fetchTrending(12);

  const tools = await Promise.all(
    repos.map(async (repo) => {
      try {
        const releases = await fetchReleases(repo.owner.login, repo.name, 1);
        const analysis = analyzeRelease(releases[0] || null);
        return repoToTool(repo, analysis);
      } catch {
        return repoToTool(repo);
      }
    }),
  );

  return {
    tools,
    total: repos.length,
    query: 'trending',
    page: 1,
    per_page: 12,
  };
}
