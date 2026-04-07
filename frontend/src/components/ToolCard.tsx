import type { Tool } from '@/lib/api';

function trustColor(score: number): string {
  if (score >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function trustLabel(score: number): string {
  if (score >= 75) return 'High Trust';
  if (score >= 50) return 'Moderate';
  return 'Low Trust';
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function parseTopics(topics: string | null): string[] {
  if (!topics) return [];
  try {
    return JSON.parse(topics);
  } catch {
    return [];
  }
}

function sourceBadge(source: string) {
  if (source === 'fdroid') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
        📦 F-Droid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
      🐙 GitHub
    </span>
  );
}

export default function ToolCard({ tool }: { tool: Tool }) {
  const score = tool.trust_score?.overall ?? 0;
  const topics = parseTopics(tool.topics).slice(0, 5);
  const hasApk = !!(tool.apk_url || tool.download_url);
  const isApp = tool.app_type === 'app';

  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <a href={`/tool/${tool.id}`} className="flex items-center gap-3 min-w-0 flex-1">
          {(tool.icon_url || tool.owner_avatar) && (
            <img
              src={tool.icon_url || tool.owner_avatar || ''}
              alt=""
              className="h-10 w-10 rounded-lg flex-shrink-0 object-cover"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                {tool.name}
              </h3>
              {sourceBadge(tool.source)}
              {isApp && (
                <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-xs font-medium text-purple-700">
                  📱 App
                </span>
              )}
            </div>
            <p className="truncate text-sm text-gray-500">{tool.full_name}</p>
          </div>
        </a>

        <div className="flex items-center gap-2 flex-shrink-0">
          {hasApk && (
            <a
              href={tool.apk_url || tool.download_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              ⬇ APK
            </a>
          )}
          <div className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${trustColor(score)}`}>
            {score.toFixed(0)}
            <span className="ml-1 text-xs font-normal">{trustLabel(score)}</span>
          </div>
        </div>
      </div>

      {tool.description && (
        <a href={`/tool/${tool.id}`}>
          <p className="mt-3 line-clamp-2 text-sm text-gray-600">{tool.description}</p>
        </a>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {tool.language && (
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            {tool.language}
          </span>
        )}
        {tool.stars > 0 && <span>⭐ {tool.stars.toLocaleString()}</span>}
        {tool.forks > 0 && <span>🍴 {tool.forks.toLocaleString()}</span>}
        {tool.latest_version && (
          <span className="font-medium text-gray-700">v{tool.latest_version}</span>
        )}
        <span>Updated {timeAgo(tool.last_pushed_at)}</span>
      </div>

      {topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <span key={t} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {t}
            </span>
          ))}
        </div>
      )}

      {tool.risk_flags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tool.risk_flags.map((flag, i) => (
            <span
              key={i}
              className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                flag.severity === 'high'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              ⚠ {flag.flag_type.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
