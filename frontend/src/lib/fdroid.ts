/**
 * F-Droid client — fetches the public index and returns normalized app data.
 * Index is cached by Next.js for 6 hours so the large JSON (~15MB) is only
 * downloaded once per revalidation window.
 */

const REPO = 'https://f-droid.org/repo';
const INDEX_URL = `${REPO}/index-v1.json`;

// ── Raw F-Droid index types ───────────────────────────────────

interface FDroidApp {
  packageName: string;
  name: string;
  summary?: string;
  description?: string;
  categories?: string[];
  icon?: string;
  license?: string;
  webSite?: string;
  sourceCode?: string;
  suggestedVersionName?: string;
  lastUpdated?: number; // ms timestamp
  added?: number;
}

interface FDroidPackage {
  versionName: string;
  apkName: string;
  size?: number;
  added?: number;
}

interface FDroidIndex {
  apps: FDroidApp[];
  packages: Record<string, FDroidPackage[]>;
}

// ── Normalized output type ────────────────────────────────────

export interface FDroidTool {
  id: string;
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: null;
  stars: 0;
  forks: 0;
  open_issues: 0;
  watchers: 0;
  license: string | null;
  topics: string | null;
  source: 'fdroid';
  owner_avatar: null;
  last_pushed_at: string | null;
  last_commit_at: null;
  package_name: string;
  apk_url: string | null;
  download_url: string | null;
  app_type: 'app';
  icon_url: string | null;
  latest_version: string | null;
  readme_html: null;
  trust_score: null;
  risk_flags: [];
  versions: [];
  install_options: InstallOpt[];
  total_downloads: 0;
  security_scan: null;
}

interface InstallOpt {
  platform: string;
  label: string;
  fileName: string;
  url: string;
  size: number;
  downloads: 0;
  fileType: string;
  icon: string;
  color: string;
}

// ── Index fetch (cached 6h by Next.js) ───────────────────────

let _indexCache: FDroidIndex | null = null;
let _indexFetchedAt = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h in ms

async function getIndex(): Promise<FDroidIndex> {
  const now = Date.now();
  if (_indexCache && now - _indexFetchedAt < CACHE_TTL) return _indexCache;

  const res = await fetch(INDEX_URL, { next: { revalidate: 21600 } });
  if (!res.ok) throw new Error(`F-Droid index fetch failed: ${res.status}`);
  _indexCache = await res.json();
  _indexFetchedAt = now;
  return _indexCache!;
}

// ── Normalize one app ─────────────────────────────────────────

function normalize(app: FDroidApp, pkgs: FDroidPackage[] = []): FDroidTool {
  const latest = pkgs[0];
  const apkUrl = latest?.apkName ? `${REPO}/${latest.apkName}` : null;
  const iconUrl = app.icon ? `${REPO}/icons-640/${app.icon}` : null;
  const storeUrl = `https://f-droid.org/en/packages/${app.packageName}/`;

  const installOptions: InstallOpt[] = apkUrl
    ? [{
        platform: 'android',
        label: 'Download APK',
        fileName: latest?.apkName || '',
        url: apkUrl,
        size: latest?.size || 0,
        downloads: 0,
        fileType: 'apk',
        icon: '🤖',
        color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      }]
    : [];

  return {
    id: `fdroid/${app.packageName}`,
    name: app.name || app.packageName,
    full_name: app.packageName,
    description: app.summary || null,
    url: app.sourceCode || storeUrl,
    homepage: app.webSite || storeUrl,
    language: null,
    stars: 0,
    forks: 0,
    open_issues: 0,
    watchers: 0,
    license: app.license || null,
    topics: app.categories?.length ? JSON.stringify(app.categories) : null,
    source: 'fdroid',
    owner_avatar: null,
    last_pushed_at: app.lastUpdated ? new Date(app.lastUpdated).toISOString() : null,
    last_commit_at: null,
    package_name: app.packageName,
    apk_url: apkUrl,
    download_url: apkUrl,
    app_type: 'app',
    icon_url: iconUrl,
    latest_version: app.suggestedVersionName || null,
    readme_html: null,
    trust_score: null,
    risk_flags: [],
    versions: [],
    install_options: installOptions,
    total_downloads: 0,
    security_scan: null,
  };
}

// ── Public API ────────────────────────────────────────────────

export async function getFdroidApps(
  page = 1,
  perPage = 20,
): Promise<{ tools: FDroidTool[]; total: number }> {
  const { apps, packages } = await getIndex();
  const total = apps.length;
  const offset = (page - 1) * perPage;
  const paged = apps.slice(offset, offset + perPage);
  return { tools: paged.map((a) => normalize(a, packages[a.packageName])), total };
}

export async function searchFdroid(
  query: string,
  page = 1,
  perPage = 20,
): Promise<{ tools: FDroidTool[]; total: number }> {
  const { apps, packages } = await getIndex();
  const q = query.toLowerCase();

  const filtered = apps.filter(
    (a) =>
      a.name?.toLowerCase().includes(q) ||
      a.summary?.toLowerCase().includes(q) ||
      a.packageName?.toLowerCase().includes(q) ||
      a.categories?.some((c) => c.toLowerCase().includes(q)),
  );

  const total = filtered.length;
  const offset = (page - 1) * perPage;
  const paged = filtered.slice(offset, offset + perPage);
  return { tools: paged.map((a) => normalize(a, packages[a.packageName])), total };
}

export async function getFdroidApp(packageName: string): Promise<FDroidTool | null> {
  const { apps, packages } = await getIndex();
  const app = apps.find((a) => a.packageName === packageName);
  if (!app) return null;
  return normalize(app, packages[packageName]);
}
