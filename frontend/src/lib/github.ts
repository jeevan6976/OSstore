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
  body: string | null;
  prerelease: boolean;
  assets: {
    name: string;
    browser_download_url: string;
    size: number;
    content_type: string;
    download_count: number;
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

// ── Analyze release assets by platform ──────────────────────

export interface PlatformAsset {
  platform: 'android' | 'macos' | 'windows' | 'linux' | 'ios' | 'web' | 'other';
  label: string;
  fileName: string;
  url: string;
  size: number;
  downloads: number;
  fileType: string;
}

export interface ReleaseAnalysis {
  apk_url: string | null;
  download_url: string | null;
  latest_version: string | null;
  platforms: PlatformAsset[];
  total_downloads: number;
}

const PLATFORM_PATTERNS: {
  platform: PlatformAsset['platform'];
  label: string;
  patterns: RegExp[];
  fileType: string;
}[] = [
  // Android
  { platform: 'android', label: 'Android APK', patterns: [/\.apk$/i], fileType: '.apk' },
  { platform: 'android', label: 'Android AAB', patterns: [/\.aab$/i], fileType: '.aab' },
  // macOS
  { platform: 'macos', label: 'macOS DMG', patterns: [/\.dmg$/i], fileType: '.dmg' },
  { platform: 'macos', label: 'macOS App', patterns: [/mac.*\.zip$/i, /darwin.*\.zip$/i, /osx.*\.zip$/i, /macos.*\.zip$/i], fileType: '.zip' },
  { platform: 'macos', label: 'macOS PKG', patterns: [/\.pkg$/i], fileType: '.pkg' },
  { platform: 'macos', label: 'macOS (Apple Silicon)', patterns: [/arm64.*darwin/i, /aarch64.*darwin/i, /darwin.*arm64/i, /macos.*arm64/i], fileType: 'binary' },
  { platform: 'macos', label: 'macOS (Intel)', patterns: [/x86_64.*darwin/i, /amd64.*darwin/i, /darwin.*amd64/i, /darwin.*x86_64/i, /macos.*x64/i], fileType: 'binary' },
  // Windows
  { platform: 'windows', label: 'Windows Installer', patterns: [/\.msi$/i], fileType: '.msi' },
  { platform: 'windows', label: 'Windows Setup', patterns: [/setup.*\.exe$/i, /installer.*\.exe$/i, /\.exe$/i], fileType: '.exe' },
  { platform: 'windows', label: 'Windows', patterns: [/win.*\.zip$/i, /windows.*\.zip$/i, /win64.*\.zip$/i, /win32.*\.zip$/i], fileType: '.zip' },
  // Linux
  { platform: 'linux', label: 'Debian Package', patterns: [/\.deb$/i], fileType: '.deb' },
  { platform: 'linux', label: 'RPM Package', patterns: [/\.rpm$/i], fileType: '.rpm' },
  { platform: 'linux', label: 'AppImage', patterns: [/\.appimage$/i], fileType: '.AppImage' },
  { platform: 'linux', label: 'Flatpak', patterns: [/\.flatpak$/i], fileType: '.flatpak' },
  { platform: 'linux', label: 'Snap', patterns: [/\.snap$/i], fileType: '.snap' },
  { platform: 'linux', label: 'Linux', patterns: [/linux.*\.tar\.gz$/i, /linux.*\.tar\.xz$/i, /linux.*\.zip$/i], fileType: '.tar.gz' },
  { platform: 'linux', label: 'Linux (x64)', patterns: [/linux.*amd64/i, /linux.*x86_64/i, /amd64.*linux/i], fileType: 'binary' },
  { platform: 'linux', label: 'Linux (ARM)', patterns: [/linux.*arm64/i, /linux.*aarch64/i], fileType: 'binary' },
];

function classifyAsset(asset: { name: string; browser_download_url: string; size: number; download_count: number }): PlatformAsset | null {
  const name = asset.name.toLowerCase();
  // Skip checksums, signatures, source archives
  if (/\.(sha256|sha512|sig|asc|md5|txt|json|yaml|yml)$/i.test(name)) return null;
  if (/^source\b/i.test(name)) return null;
  if (name === 'source code (zip)' || name === 'source code (tar.gz)') return null;

  for (const rule of PLATFORM_PATTERNS) {
    for (const pattern of rule.patterns) {
      if (pattern.test(asset.name)) {
        return {
          platform: rule.platform,
          label: rule.label,
          fileName: asset.name,
          url: asset.browser_download_url,
          size: asset.size,
          downloads: asset.download_count || 0,
          fileType: rule.fileType,
        };
      }
    }
  }

  return null;
}

export function analyzeRelease(release: GitHubRelease | null): ReleaseAnalysis {
  if (!release || !release.assets) {
    return { apk_url: null, download_url: null, latest_version: null, platforms: [], total_downloads: 0 };
  }

  const platforms: PlatformAsset[] = [];
  let totalDownloads = 0;

  for (const asset of release.assets) {
    totalDownloads += asset.download_count || 0;
    const classified = classifyAsset(asset);
    if (classified) {
      // Don't add duplicate platforms of same type (keep largest/most downloaded)
      const existing = platforms.find(p => p.platform === classified.platform && p.fileType === classified.fileType);
      if (!existing) {
        platforms.push(classified);
      } else if (classified.downloads > existing.downloads) {
        const idx = platforms.indexOf(existing);
        platforms[idx] = classified;
      }
    }
  }

  const apkAsset = platforms.find(p => p.platform === 'android' && p.fileType === '.apk');
  const firstAsset = release.assets.length > 0 ? release.assets[0] : null;

  return {
    apk_url: apkAsset?.url || null,
    download_url: firstAsset?.browser_download_url || null,
    latest_version: release.tag_name?.replace(/^v/i, '') || null,
    platforms,
    total_downloads: totalDownloads,
  };
}
