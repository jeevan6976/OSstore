import { getTool } from '@/lib/api';
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
  try {
    return JSON.parse(topics);
  } catch {
    return [];
  }
}

interface PageProps {
  params: { id: string };
}

export default async function ToolDetailPage({ params }: PageProps) {
  const tool = await getTool(params.id).catch(() => null);

  if (!tool) {
    notFound();
    return; // unreachable but satisfies TS narrowing
  }

  const topics = parseTopics(tool.topics);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {tool.owner_avatar && (
          <img src={tool.owner_avatar} alt="" className="h-16 w-16 rounded-xl" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold text-gray-900">{tool.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{tool.full_name}</p>
          {tool.description && (
            <p className="mt-3 text-gray-600">{tool.description}</p>
          )}
        </div>
      </div>

      {/* Action links */}
      <div className="mt-6 flex flex-wrap gap-3">
        {tool.apk_url && (
          <a
            href={tool.apk_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            ⬇ Download APK {tool.latest_version ? `v${tool.latest_version}` : ''}
          </a>
        )}
        {tool.download_url && !tool.apk_url && (
          <a
            href={tool.download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            ⬇ Download {tool.latest_version ? `v${tool.latest_version}` : ''}
          </a>
        )}
        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          {tool.source === 'fdroid' ? 'View on F-Droid →' : 'View on GitHub →'}
        </a>
        {tool.homepage && (
          <a
            href={tool.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Homepage
          </a>
        )}
      </div>

      {/* Stats + Trust Score */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{tool.stars.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Stars</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{tool.forks.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Forks</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{tool.open_issues.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Open Issues</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{tool.watchers.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Watchers</p>
            </div>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Details</h2>
            <dl className="space-y-3 text-sm">
              {tool.language && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Language</dt>
                  <dd className="font-medium text-gray-900">{tool.language}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">License</dt>
                <dd className="font-medium text-gray-900">{tool.license || 'None'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Source</dt>
                <dd className="font-medium text-gray-900 capitalize">{tool.source}</dd>
              </div>
              {tool.package_name && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Package</dt>
                  <dd className="font-medium text-gray-900 text-xs">{tool.package_name}</dd>
                </div>
              )}
              {tool.latest_version && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Version</dt>
                  <dd className="font-medium text-gray-900">{tool.latest_version}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Last Push</dt>
                <dd className="font-medium text-gray-900">{timeAgo(tool.last_pushed_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Last Commit</dt>
                <dd className="font-medium text-gray-900">{timeAgo(tool.last_commit_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Topics */}
          {topics.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Topics</h2>
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <span key={t} className="rounded-lg bg-brand-50 px-3 py-1 text-sm text-brand-700 border border-brand-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Trust Score */}
        <div className="space-y-6">
          {tool.trust_score && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <TrustScoreChart score={tool.trust_score} />
            </div>
          )}

          {tool.risk_flags.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Risk Flags</h3>
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
                    <p className="font-medium capitalize">{flag.flag_type.replace(/_/g, ' ')}</p>
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
