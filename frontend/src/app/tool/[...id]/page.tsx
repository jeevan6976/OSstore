import { getTool } from '@/lib/api';
import { notFound } from 'next/navigation';
import TrustScoreChart from '@/components/TrustScoreChart';
import SecurityPanel from '@/components/SecurityPanel';

// ── Helpers ──────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes <= 0) return '';
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
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

  if (!tool) { notFound(); return; }

  const isFdroid = tool.source === 'fdroid';
  const topics = parseTopics(tool.topics);
  const score = tool.trust_score?.overall ?? 0;
  const installs = tool.install_options;
  const backHref = isFdroid ? '/apps?source=fdroid' : '/search?q=stars%3A%3E100';
  const backLabel = isFdroid ? '← F-Droid' : '← Back';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Back */}
      <a href={backHref} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        {backLabel}
      </a>

      {/* Header card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Icon */}
          <div className="flex-shrink-0 h-20 w-20 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shadow-sm">
            {(tool.icon_url || tool.owner_avatar) ? (
              <img
                src={tool.icon_url || tool.owner_avatar || ''}
                alt={tool.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-300">
                {tool.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{tool.name}</h1>
              {tool.latest_version && (
                <span className="rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs text-gray-600">
                  v{tool.latest_version}
                </span>
              )}
              {/* Source badge */}
              {isFdroid ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">
                  📦 F-Droid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                  🐙 GitHub
                </span>
              )}
            </div>

            {/* Subtitle: package name for F-Droid, repo path for GitHub */}
            <p className="mt-1 text-sm text-gray-400 font-mono">{tool.full_name}</p>

            {tool.description && (
              <p className="mt-3 text-gray-600 leading-relaxed">{tool.description}</p>
            )}

            {/* GitHub-specific meta */}
            {!isFdroid && (
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
            )}

            {/* F-Droid-specific meta */}
            {isFdroid && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {tool.license && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-medium text-green-700">
                    ⚖️ {tool.license}
                  </span>
                )}
                {tool.last_pushed_at && (
                  <span className="text-xs text-gray-400">Updated {timeAgo(tool.last_pushed_at)}</span>
                )}
              </div>
            )}
          </div>

          {/* Trust badge — GitHub only */}
          {tool.trust_score && !isFdroid && (
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

          {/* F-Droid verified badge */}
          {isFdroid && (
            <div className="flex-shrink-0 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center min-w-[80px]">
              <div className="text-2xl">✓</div>
              <div className="text-[10px] font-semibold text-blue-600 mt-1">VERIFIED</div>
              <div className="text-[9px] text-blue-400 mt-0.5">F-Droid</div>
            </div>
          )}
        </div>
      </div>

      {/* Download / Install */}
      {installs.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              {isFdroid ? 'Download APK' : 'Download & Install'}
            </h2>
            {tool.total_downloads > 0 && (
              <span className="text-xs text-gray-400 font-medium">
                {formatNum(tool.total_downloads)} total downloads
              </span>
            )}
          </div>

          {/* Primary download — biggest / most relevant asset */}
          {(() => {
            const primary = installs.find((o) => o.fileType !== 'web') || installs[0];
            if (!primary) return null;
            const isWeb = primary.fileType === 'web';
            const href = isWeb
              ? primary.url
              : `/api/download?url=${encodeURIComponent(primary.url)}&filename=${encodeURIComponent(primary.fileName || 'download')}`;
            return (
              <a
                href={href}
                {...(isWeb ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={`group mb-4 flex w-full items-center gap-4 rounded-2xl px-6 py-4 transition-all shadow-sm hover:shadow-md ${primary.color}`}
              >
                <span className="text-3xl flex-shrink-0">{primary.icon}</span>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-bold text-base leading-tight">{primary.label}</div>
                  <div className="text-xs opacity-75 mt-0.5">
                    {primary.fileName && <span className="font-mono">{primary.fileName}</span>}
                    {primary.size > 0 && <span> · {formatSize(primary.size)}</span>}
                  </div>
                </div>
                {isWeb ? (
                  <svg className="flex-shrink-0 h-5 w-5 opacity-70 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                ) : (
                  <svg className="flex-shrink-0 h-5 w-5 opacity-70 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                )}
              </a>
            );
          })()}

          {/* Other platform downloads */}
          {installs.length > 1 && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {installs.slice(1).map((opt, i) => {
                const isWeb = opt.fileType === 'web';
                const href = isWeb
                  ? opt.url
                  : `/api/download?url=${encodeURIComponent(opt.url)}&filename=${encodeURIComponent(opt.fileName || 'download')}`;
                return (
                  <a
                    key={i}
                    href={href}
                    {...(isWeb ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-all"
                  >
                    <span className="text-xl flex-shrink-0">{opt.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-gray-800">{opt.label}</div>
                      {opt.size > 0 && (
                        <div className="text-xs text-gray-400">{formatSize(opt.size)}</div>
                      )}
                    </div>
                    {isWeb ? (
                      <svg className="flex-shrink-0 h-3.5 w-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    ) : (
                      <svg className="flex-shrink-0 h-3.5 w-3.5 text-gray-400 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    )}
                  </a>
                );
              })}
            </div>
          )}

          {/* Action links */}
          <div className="mt-4 flex flex-wrap gap-3 pt-4 border-t border-gray-100">
            {isFdroid ? (
              <>
                <a
                  href={`https://f-droid.org/en/packages/${tool.full_name}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all"
                >
                  📦 View on F-Droid
                </a>
                {tool.url && !tool.url.includes('f-droid.org') && (
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    🐙 Source Code
                  </a>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}

      {/* No install options fallback */}
      {installs.length === 0 && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            {isFdroid ? 'App Page' : 'Source Code'}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {isFdroid
              ? 'Visit the F-Droid store page to install this app.'
              : 'No release binaries found. Build from source or check the project page.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {isFdroid ? (
              <a
                href={`https://f-droid.org/en/packages/${tool.full_name}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all"
              >
                📦 View on F-Droid
              </a>
            ) : (
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-all"
              >
                🐙 View on GitHub
              </a>
            )}
            {tool.homepage && tool.homepage !== tool.url && (
              <a
                href={tool.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
              >
                🌐 Homepage
              </a>
            )}
          </div>
        </div>
      )}

      {/* Content grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">

          {/* GitHub stats — hidden for F-Droid */}
          {!isFdroid && (
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
          )}

          {/* Details */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-bold text-gray-900">Details</h2>
            <dl className="space-y-2 text-sm">
              {[
                { label: 'Package', value: isFdroid ? tool.full_name : null },
                { label: 'Language', value: tool.language },
                { label: 'License', value: tool.license || (isFdroid ? null : 'None') },
                { label: 'Version', value: tool.latest_version },
                { label: 'Updated', value: timeAgo(tool.last_pushed_at) },
                { label: 'Source', value: isFdroid ? 'F-Droid Repository' : 'GitHub' },
              ]
                .filter((d) => d.value)
                .map((d) => (
                  <div key={d.label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <dt className="text-gray-400">{d.label}</dt>
                    <dd className="font-medium text-gray-900 text-right max-w-[60%] truncate">{d.value}</dd>
                  </div>
                ))}
            </dl>
          </div>

          {/* Categories / Topics */}
          {topics.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-3 text-base font-bold text-gray-900">
                {isFdroid ? 'Categories' : 'Topics'}
              </h2>
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <a
                    key={t}
                    href={`${isFdroid ? '/apps?source=fdroid&' : '/search?'}q=${encodeURIComponent(t)}`}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      isFdroid
                        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {t}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* README — GitHub only */}
          {tool.readme_html && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 overflow-hidden">
              <h2 className="mb-4 text-base font-bold text-gray-900">README</h2>
              <div
                className="readme-content max-w-none"
                dangerouslySetInnerHTML={{ __html: tool.readme_html }}
              />
            </div>
          )}

          {/* Releases — GitHub only */}
          {tool.versions && tool.versions.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-base font-bold text-gray-900">Releases</h2>
              <div className="space-y-2">
                {tool.versions.map((v, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-4 rounded-lg border p-3 ${
                      i === 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-100'
                    }`}
                  >
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

          {/* F-Droid install instructions */}
          {isFdroid && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6">
              <h2 className="mb-3 text-base font-bold text-gray-900">How to Install</h2>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold mt-0.5">1</span>
                  Install the <a href="https://f-droid.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">F-Droid app</a> on your Android device
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold mt-0.5">2</span>
                  Search for <strong className="text-gray-800">{tool.name}</strong> in the F-Droid app
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold mt-0.5">3</span>
                  Or download the APK directly using the button above
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trust score — GitHub only */}
          {tool.trust_score && !isFdroid && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <TrustScoreChart score={tool.trust_score} />
            </div>
          )}

          {/* F-Droid trust info */}
          {isFdroid && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-3">
              <h3 className="text-sm font-bold text-blue-900">Why F-Droid is Safe</h3>
              {[
                { icon: '🔍', text: 'Source code reviewed by F-Droid team' },
                { icon: '🏗️', text: 'Built from source — no binary blobs' },
                { icon: '🚫', text: 'No proprietary trackers or ads allowed' },
                { icon: '🔓', text: '100% Free & Open Source Software' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2.5">
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <p className="text-xs text-blue-800 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Risk flags — GitHub only */}
          {tool.risk_flags.length > 0 && !isFdroid && (
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

          {/* Security scan — GitHub only */}
          {tool.security_scan && !isFdroid && (
            <SecurityPanel scan={tool.security_scan} />
          )}

          {/* Quick links */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Links</h3>
            <div className="space-y-2">
              {isFdroid && (
                <a
                  href={`https://f-droid.org/en/packages/${tool.full_name}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <span>📦</span> F-Droid Store
                </a>
              )}
              {tool.url && (
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <span>{isFdroid ? '🐙' : '🐙'}</span>
                  {isFdroid ? 'Source Code' : 'GitHub Repo'}
                </a>
              )}
              {tool.homepage && tool.homepage !== tool.url && (
                <a
                  href={tool.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <span>🌐</span> Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
