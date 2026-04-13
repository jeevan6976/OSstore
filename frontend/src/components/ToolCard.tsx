import type { Tool } from '@/lib/api';

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatSize(bytes: number): string {
  if (bytes <= 0) return '';
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
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

function trustBadge(score: number) {
  if (score >= 75) return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Trusted' };
  if (score >= 50) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Fair' };
  return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', label: 'Low' };
}

export default function ToolCard({ tool }: { tool: Tool }) {
  const score = tool.trust_score?.overall ?? 0;
  const badge = trustBadge(score);
  const topics = parseTopics(tool.topics).slice(0, 3);
  // Show max 3 install options on card
  const installs = tool.install_options.slice(0, 3);
  const hasReleaseDownloads = installs.length > 0;

  return (
    <a href={`/tool/${tool.id}`} className="block group">
      <div className="rounded-xl border border-gray-200/80 bg-white p-5 transition-all duration-200 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/50">
        <div className="flex gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
              {(tool.icon_url || tool.owner_avatar) ? (
                <img src={tool.icon_url || tool.owner_avatar || ''} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-300">
                  {tool.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {tool.name}
                  </h3>
                  {tool.latest_version && (
                    <span className="flex-shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
                      v{tool.latest_version}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{tool.full_name}</p>
              </div>
              {/* Trust score */}
              <div className={`flex-shrink-0 flex items-center gap-1.5 rounded-lg border px-2 py-1 ${badge.bg} ${badge.border}`}>
                <span className={`text-sm font-bold ${badge.text}`}>{score.toFixed(0)}</span>
                <span className={`text-[10px] font-medium ${badge.text} opacity-70`}>{badge.label}</span>
              </div>
            </div>

            {/* Description */}
            {tool.description && (
              <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">{tool.description}</p>
            )}

            {/* Install options from release analysis */}
            {hasReleaseDownloads && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {installs.map((opt, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md bg-gray-50 border border-gray-150 px-2 py-0.5 text-[11px] text-gray-600"
                  >
                    <span>{opt.icon}</span>
                    <span className="font-medium">{opt.label}</span>
                    {opt.size > 0 && <span className="text-gray-400">· {formatSize(opt.size)}</span>}
                  </span>
                ))}
                {tool.install_options.length > 3 && (
                  <span className="inline-flex items-center rounded-md bg-gray-50 border border-gray-150 px-2 py-0.5 text-[11px] text-gray-400">
                    +{tool.install_options.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Meta row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
              {tool.language && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  {tool.language}
                </span>
              )}
              {tool.stars > 0 && <span>★ {formatNum(tool.stars)}</span>}
              {tool.forks > 0 && <span>⑂ {formatNum(tool.forks)}</span>}
              {tool.total_downloads > 0 && <span>↓ {formatNum(tool.total_downloads)}</span>}
              {topics.map((t) => (
                <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px]">{t}</span>
              ))}
              {tool.last_pushed_at && (
                <span className="ml-auto">Updated {timeAgo(tool.last_pushed_at)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
