import { getTool } from '@/lib/api';
import { notFound } from 'next/navigation';
import TrustScoreChart from '@/components/TrustScoreChart';

function formatSize(bytes: number): string {
  if (bytes <= 0) return '';
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function parseTopics(topics: string | null): string[] {
  if (!topics) return [];
  try { return JSON.parse(topics); } catch { return []; }
}

interface PageProps {
  params: Promise<{ id: string[] }> | { id: string[] };
}

export default async function ToolDetailPage({ params }: PageProps) {
  const p = await Promise.resolve(params);
  const toolId = p.id.join('/');
  const tool = await getTool(toolId).catch(() => null);

  if (!tool) {
    notFound();
    return;
  }

  const topics = parseTopics(tool.topics);
  const score = tool.trust_score?.overall ?? 0;
  const installs = tool.install_options;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Back */}
      <a href="/apps" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        ← Back
      </a>

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
            {(tool.icon_url || tool.owner_avatar) ? (
              <img src={tool.icon_url || tool.owner_avatar || ''} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-300">
                {tool.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{tool.name}</h1>
              {tool.latest_version && (
                <span className="rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs text-gray-600">
                  v{tool.latest_version}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-400">{tool.full_name}</p>
            {tool.description && (
              <p className="mt-3 text-gray-600 leading-relaxed">{tool.description}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {tool.language && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                  {tool.language}
                </span>
              )}
              {tool.stars > 0 && <span>★ {formatNum(tool.stars)}</span>}
              {tool.forks > 0 && <span>⑂ {formatNum(tool.forks)}</span>}
              {tool.total_downloads > 0 && <span>↓ {formatNum(tool.total_downloads)} downloads</span>}
            </div>
          </div>

          {/* Trust badge */}
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

      {/* Install Section — data-driven from actual release assets */}
      {installs.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Download & Install</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {installs.map((opt, i) => (
              <a
                key={i}
                href={opt.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center gap-3 rounded-xl p-4 transition-all ${opt.color}`}
              >
                <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-xs opacity-80 truncate">
                    {opt.fileName && <span>{opt.fileName}</span>}
                    {opt.size > 0 && <span> · {formatSize(opt.size)}</span>}
                    {opt.downloads > 0 && <span> · {formatNum(opt.downloads)} downloads</span>}
                  </div>
                </div>
                <svg className="flex-shrink-0 h-4 w-4 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </a>
            ))}
          </div>

          {/* Source links */}
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
            >
              🐙 View on GitHub
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

      {/* If no install options, show a "View Source" fallback */}
      {installs.length === 0 && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Source Code</h2>
          <p className="text-sm text-gray-500 mb-4">No release binaries found. You can build from source or check the project page.</p>
          <div className="flex flex-wrap gap-3">
            <a href={tool.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-all">
              🐙 View on GitHub
            </a>
            {tool.homepage && tool.homepage !== tool.url && (
              <a href={tool.homepage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
                🌐 Homepage
              </a>
            )}
          </div>
        </div>
      )}

      {/* Content grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Stars', value: tool.stars, icon: '★' },
              { label: 'Forks', value: tool.forks, icon: '⑂' },
              { label: 'Issues', value: tool.open_issues, icon: '●' },
              { label: 'Watchers', value: tool.watchers, icon: '◉' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{formatNum(s.value)}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-bold text-gray-900">Details</h2>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Language', value: tool.language },
                { label: 'License', value: tool.license || 'None' },
                { label: 'Version', value: tool.latest_version },
                { label: 'Updated', value: timeAgo(tool.last_pushed_at) },
              ]
                .filter((d) => d.value)
                .map((d) => (
                  <div key={d.label} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
                    <dt className="text-gray-400">{d.label}</dt>
                    <dd className="font-medium text-gray-900">{d.value}</dd>
                  </div>
                ))}
            </dl>
          </div>

          {/* Topics */}
          {topics.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-3 text-base font-bold text-gray-900">Topics</h2>
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <a
                    key={t}
                    href={`/search?q=${encodeURIComponent(t)}`}
                    className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    {t}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* README */}
          {tool.readme_html && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 overflow-hidden">
              <h2 className="mb-4 text-base font-bold text-gray-900">README</h2>
              <div
                className="readme-content max-w-none"
                dangerouslySetInnerHTML={{ __html: tool.readme_html }}
              />
            </div>
          )}

          {/* Version History */}
          {tool.versions && tool.versions.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-base font-bold text-gray-900">Releases</h2>
              <div className="space-y-2">
                {tool.versions.map((v, i) => (
                  <div key={i} className={`flex items-center justify-between gap-4 rounded-lg border p-3 ${i === 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-100'}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm text-gray-900">{v.version}</span>
                        {i === 0 && (
                          <span className="rounded bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            LATEST
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                        {v.added && <span>{timeAgo(v.added)}</span>}
                        {v.size > 0 && <span>{formatSize(v.size)}</span>}
                      </div>
                    </div>
                    {(v.apk_url || v.download_url) && (
                      <a
                        href={v.apk_url || v.download_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-all"
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {tool.trust_score && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <TrustScoreChart score={tool.trust_score} />
            </div>
          )}

          {tool.risk_flags.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-3 text-sm font-bold text-gray-700">Risk Flags</h3>
              <div className="space-y-2">
                {tool.risk_flags.map((flag, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 text-sm ${
                      flag.severity === 'high'
                        ? 'bg-red-50 border border-red-200 text-red-800'
                        : 'bg-amber-50 border border-amber-200 text-amber-800'
                    }`}
                  >
                    <p className="font-semibold capitalize text-xs">{flag.flag_type.replace(/_/g, ' ')}</p>
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
