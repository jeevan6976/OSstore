import type { Tool } from '@/lib/api';

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatSize(bytes: number): string {
  if (bytes <= 0) return '';
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
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

export default function ToolCard({ tool }: { tool: Tool }) {
  const isFdroid = tool.source === 'fdroid';
  const score = tool.trust_score?.overall ?? 0;
  const topics = parseTopics(tool.topics).slice(0, 3);
  const installs = tool.install_options.slice(0, 3);

  return (
    <a href={`/tool/${tool.id}`} className="block group">
      <div className="rounded-xl border border-gray-200/80 bg-white p-4 sm:p-5 transition-all duration-150 hover:border-gray-300 hover:shadow-md hover:shadow-gray-100/80">
        <div className="flex gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
            {(tool.icon_url || tool.owner_avatar) ? (
              <img src={tool.icon_url || tool.owner_avatar || ''} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-300">
                {tool.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                    {tool.name}
                  </h3>
                  {tool.latest_version && (
                    <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
                      v{tool.latest_version}
                    </span>
                  )}
                  {/* Source badge */}
                  {isFdroid ? (
                    <span className="flex-shrink-0 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                      F-Droid
                    </span>
                  ) : (
                    <span className="flex-shrink-0 rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                      GitHub
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{tool.full_name}</p>
              </div>

              {/* Trust score — GitHub only */}
              {!isFdroid && tool.trust_score && (
                <div className={`flex-shrink-0 rounded-lg border px-2 py-1 text-center ${
                  score >= 75 ? 'bg-emerald-50 border-emerald-200' :
                  score >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`text-sm font-bold leading-none ${
                    score >= 75 ? 'text-emerald-600' :
                    score >= 50 ? 'text-amber-600' : 'text-red-500'
                  }`}>{score.toFixed(0)}</div>
                  <div className="text-[9px] text-gray-400 mt-0.5">trust</div>
                </div>
              )}

              {/* F-Droid verified */}
              {isFdroid && (
                <div className="flex-shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-center">
                  <div className="text-xs font-bold text-blue-600">✓</div>
                  <div className="text-[9px] text-blue-400 mt-0.5">verified</div>
                </div>
              )}
            </div>

            {/* Description */}
            {tool.description && (
              <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">{tool.description}</p>
            )}

            {/* Platform / install badges */}
            {installs.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1">
                {installs.map((opt, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600"
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                    {opt.size > 0 && <span className="text-gray-400">· {formatSize(opt.size)}</span>}
                  </span>
                ))}
                {tool.install_options.length > 3 && (
                  <span className="inline-flex items-center rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-[11px] text-gray-400">
                    +{tool.install_options.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Meta row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
              {!isFdroid && tool.language && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  {tool.language}
                </span>
              )}
              {tool.stars > 0 && <span>★ {formatNum(tool.stars)}</span>}
              {tool.forks > 0 && <span>⑂ {formatNum(tool.forks)}</span>}
              {tool.total_downloads > 0 && <span>↓ {formatNum(tool.total_downloads)}</span>}
              {isFdroid && tool.license && <span>⚖️ {tool.license}</span>}
              {topics.map((t) => (
                <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px]">{t}</span>
              ))}
              {tool.last_pushed_at && (
                <span className="ml-auto">{timeAgo(tool.last_pushed_at)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
