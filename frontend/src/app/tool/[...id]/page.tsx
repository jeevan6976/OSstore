import { getTool } from '@/lib/api';
import type { Tool } from '@/lib/api';
import { notFound } from 'next/navigation';
import TrustScoreChart from '@/components/TrustScoreChart';

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function parseTopics(topics: string | null): string[] {
  if (!topics) return [];
  try { return JSON.parse(topics); } catch { return []; }
}

/** Build platform install options */
function buildInstallOptions(tool: Tool) {
  const text = `${tool.topics || ''} ${tool.description || ''} ${tool.language || ''}`.toLowerCase();
  const opts: { label: string; sublabel: string; icon: string; url: string | null; color: string; primary?: boolean }[] = [];

  const releasesUrl = tool.source === 'github' ? `${tool.url}/releases/latest` : null;
  const fdroidUrl = tool.source === 'fdroid' ? `https://f-droid.org/packages/${tool.package_name || ''}` : null;

  // APK — direct download
  if (tool.apk_url) {
    opts.push({
      label: 'Download APK',
      sublabel: tool.latest_version ? `Version ${tool.latest_version}` : 'Latest release',
      icon: '🤖', url: tool.apk_url,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20',
      primary: true,
    });
  } else if (tool.download_url) {
    opts.push({
      label: 'Download',
      sublabel: tool.latest_version ? `Version ${tool.latest_version}` : 'Latest release',
      icon: '⬇️', url: tool.download_url,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20',
      primary: true,
    });
  }

  // F-Droid store page
  if (tool.source === 'fdroid' && tool.package_name) {
    opts.push({
      label: 'Get on F-Droid',
      sublabel: 'Open in F-Droid app',
      icon: '📦', url: fdroidUrl,
      color: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20',
    });
  }

  // Platform-specific from topics/desc
  const hasAndroid = text.includes('android') || text.includes('apk') || tool.app_type === 'app';
  const hasMac = text.includes('macos') || text.includes('darwin') || text.includes('homebrew') || text.includes('dmg');
  const hasWindows = text.includes('windows') || text.includes('win32') || text.includes('.exe') || text.includes('.msi');
  const hasLinux = text.includes('linux') || text.includes('flatpak') || text.includes('snap') || text.includes('appimage') || text.includes('deb');
  const hasWeb = text.includes('web app') || text.includes('pwa');

  if (hasMac && releasesUrl) {
    opts.push({ label: 'macOS', sublabel: '.dmg / Homebrew', icon: '🍎', url: releasesUrl, color: 'bg-gray-900 hover:bg-gray-800 text-white' });
  }
  if (hasWindows && releasesUrl) {
    opts.push({ label: 'Windows', sublabel: '.exe / .msi installer', icon: '🪟', url: releasesUrl, color: 'bg-blue-600 hover:bg-blue-700 text-white' });
  }
  if (hasLinux && releasesUrl) {
    opts.push({ label: 'Linux', sublabel: '.deb / .AppImage / Flatpak', icon: '🐧', url: releasesUrl, color: 'bg-amber-600 hover:bg-amber-700 text-white' });
  }
  if (hasAndroid && !tool.apk_url && releasesUrl) {
    opts.push({ label: 'Android', sublabel: 'Check releases for APK', icon: '🤖', url: fdroidUrl || releasesUrl, color: 'bg-emerald-600 hover:bg-emerald-700 text-white' });
  }
  if (hasWeb && tool.homepage) {
    opts.push({ label: 'Web App', sublabel: 'Open in browser', icon: '🌐', url: tool.homepage, color: 'bg-purple-600 hover:bg-purple-700 text-white' });
  }

  return opts;
}

interface PageProps {
  params: { id: string[] };
}

export default async function ToolDetailPage({ params }: PageProps) {
  const toolId = params.id.join('/');
  const tool = await getTool(toolId).catch(() => null);

  if (!tool) {
    notFound();
    return;
  }

  const topics = parseTopics(tool.topics);
  const installOptions = buildInstallOptions(tool);
  const score = tool.trust_score?.overall ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Back link */}
      <a href="/apps" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        ← Back to apps
      </a>

      {/* Header Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* App icon */}
          <div className="flex-shrink-0 h-20 w-20 rounded-2xl bg-gray-100 overflow-hidden shadow-md">
            {(tool.icon_url || tool.owner_avatar) ? (
              <img src={tool.icon_url || tool.owner_avatar || ''} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-400">
                {tool.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name + desc */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold text-gray-900">{tool.name}</h1>
              {tool.app_type === 'app' && (
                <span className="rounded-lg bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-semibold text-purple-700">
                  📱 App
                </span>
              )}
              {tool.source === 'fdroid' && (
                <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  📦 F-Droid
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">{tool.full_name}</p>
            {tool.description && (
              <p className="mt-3 text-gray-600 leading-relaxed">{tool.description}</p>
            )}

            {/* Quick stats inline */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
              {tool.stars > 0 && <span>⭐ {tool.stars.toLocaleString()} stars</span>}
              {tool.forks > 0 && <span>🍴 {tool.forks.toLocaleString()} forks</span>}
              {tool.language && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                  {tool.language}
                </span>
              )}
              {tool.latest_version && (
                <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700">
                  v{tool.latest_version}
                </span>
              )}
            </div>
          </div>

          {/* Trust score badge */}
          {tool.trust_score && (
            <div className={`flex-shrink-0 rounded-2xl border p-4 text-center min-w-[80px] ${
              score >= 75 ? 'border-emerald-200 bg-emerald-50' :
              score >= 50 ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'
            }`}>
              <div className={`text-3xl font-extrabold ${
                score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {score.toFixed(0)}
              </div>
              <div className="text-[10px] font-semibold text-gray-500 mt-1">TRUST</div>
            </div>
          )}
        </div>
      </div>

      {/* Install Section */}
      {installOptions.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📥 Install</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {installOptions.map((opt) => (
              <a
                key={opt.label}
                href={opt.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center gap-4 rounded-xl p-4 transition-all ${opt.color} ${opt.primary ? 'sm:col-span-2 lg:col-span-1' : ''}`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-xs opacity-80">{opt.sublabel}</div>
                </div>
                <svg className="ml-auto h-5 w-5 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </a>
            ))}
          </div>

          {/* Source link */}
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
            >
              {tool.source === 'fdroid' ? '📦 View on F-Droid' : '🐙 View on GitHub'}
            </a>
            {tool.homepage && tool.homepage !== tool.url && (
              <a
                href={tool.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
              >
                🌐 Homepage
              </a>
            )}
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Stars', value: tool.stars, icon: '⭐' },
              { label: 'Forks', value: tool.forks, icon: '🍴' },
              { label: 'Issues', value: tool.open_issues, icon: '🐛' },
              { label: 'Watchers', value: tool.watchers, icon: '👁' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                <div className="text-lg mb-1">{s.icon}</div>
                <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Details card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Details</h2>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Language', value: tool.language },
                { label: 'License', value: tool.license || 'None' },
                { label: 'Source', value: tool.source?.charAt(0).toUpperCase() + tool.source?.slice(1) },
                { label: 'Package', value: tool.package_name },
                { label: 'Version', value: tool.latest_version },
                { label: 'Last Push', value: timeAgo(tool.last_pushed_at) },
                { label: 'Last Commit', value: timeAgo(tool.last_commit_at) },
              ]
                .filter((d) => d.value)
                .map((d) => (
                  <div key={d.label} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                    <dt className="text-gray-500">{d.label}</dt>
                    <dd className="font-medium text-gray-900 text-right max-w-[60%] truncate">{d.value}</dd>
                  </div>
                ))}
            </dl>
          </div>

          {/* Topics */}
          {topics.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="mb-3 text-lg font-bold text-gray-900">Topics</h2>
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <a
                    key={t}
                    href={`/search?q=${encodeURIComponent(t)}`}
                    className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors"
                  >
                    {t}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {tool.trust_score && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <TrustScoreChart score={tool.trust_score} />
            </div>
          )}

          {tool.risk_flags.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="mb-3 text-sm font-bold text-gray-700">⚠️ Risk Flags</h3>
              <div className="space-y-2">
                {tool.risk_flags.map((flag, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 text-sm ${
                      flag.severity === 'high'
                        ? 'bg-red-50 border border-red-200 text-red-800'
                        : 'bg-amber-50 border border-amber-200 text-amber-800'
                    }`}
                  >
                    <p className="font-semibold capitalize">{flag.flag_type.replace(/_/g, ' ')}</p>
                    <p className="mt-0.5 text-xs opacity-80">{flag.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
