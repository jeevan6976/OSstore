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

export default function ToolCard({ tool }: { tool: Tool }) {
  const score = tool.trust_score?.overall ?? 0;
  const topics = parseTopics(tool.topics).slice(0, 5);

  return (
    <a
      href={`/tool/${tool.id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {tool.owner_avatar && (
            <img
              src={tool.owner_avatar}
              alt=""
              className="h-10 w-10 rounded-lg flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
              {tool.name}
            </h3>
            <p className="truncate text-sm text-gray-500">{tool.full_name}</p>
          </div>
        </div>

        <div className={`flex-shrink-0 rounded-lg border px-3 py-1.5 text-sm font-bold ${trustColor(score)}`}>
          {score.toFixed(0)}
          <span className="ml-1 text-xs font-normal">{trustLabel(score)}</span>
        </div>
      </div>

      {tool.description && (
        <p className="mt-3 line-clamp-2 text-sm text-gray-600">{tool.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {tool.language && (
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            {tool.language}
          </span>
        )}
        <span>⭐ {tool.stars.toLocaleString()}</span>
        <span>🍴 {tool.forks.toLocaleString()}</span>
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
    </a>
  );
}
