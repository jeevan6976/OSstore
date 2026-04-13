import { browseApps } from '@/lib/api';
import AISearchBar from '@/components/AISearchBar';
import ToolCard from '@/components/ToolCard';

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; source?: string }> | { q?: string; page?: string; source?: string };
}

const SOURCE_TABS = [
  { key: '', label: 'All', icon: '🌐', activeColor: 'bg-brand-600 text-white shadow-md shadow-brand-600/20' },
  { key: 'fdroid', label: 'F-Droid', icon: '📦', activeColor: 'bg-blue-600 text-white shadow-md shadow-blue-600/20' },
  { key: 'github', label: 'GitHub', icon: '🐙', activeColor: 'bg-gray-900 text-white shadow-md shadow-gray-900/20' },
];

export default async function AppsPage({ searchParams }: PageProps) {
  const sp = await Promise.resolve(searchParams);
  const query = sp.q || '';
  const page = parseInt(sp.page || '1', 10);
  const source = sp.source || '';

  let result = null;
  let error = null;

  try {
    result = await browseApps(page, 20, query, source || undefined);
  } catch {
    error = 'Failed to fetch apps. GitHub API may be rate limited — try again shortly.';
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-xl shadow-lg shadow-purple-500/20">
          📱
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">App Store</h1>
          <p className="text-sm text-gray-500">Open-source apps for every platform</p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="mb-8 space-y-4">
        <AISearchBar initialQuery={query} placeholder="Search Android apps, tools, utilities..." />

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {SOURCE_TABS.map((tab) => {
            const isActive = source === tab.key;
            const href = `/apps${tab.key ? `?source=${tab.key}` : ''}${query ? `${tab.key ? '&' : '?'}q=${encodeURIComponent(query)}` : ''}`;
            return (
              <a
                key={tab.key}
                href={href}
                className={`flex-shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  isActive ? tab.activeColor : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </a>
            );
          })}

          <div className="ml-auto hidden sm:flex items-center gap-2">
            {[
              { icon: '🤖', label: 'Android', color: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
              { icon: '🍎', label: 'Mac', color: 'bg-gray-50 border-gray-200 text-gray-600' },
              { icon: '🪟', label: 'Win', color: 'bg-blue-50 border-blue-200 text-blue-600' },
              { icon: '🐧', label: 'Linux', color: 'bg-amber-50 border-amber-200 text-amber-600' },
            ].map((p) => (
              <span key={p.label} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${p.color}`}>
                {p.icon} {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center mb-6">
          <p className="text-2xl mb-2">⚠️</p>
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {result && (
        <>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900 text-lg">{result.total.toLocaleString()}</span> apps available
            </p>
            <p className="text-xs text-gray-400">Page {page}</p>
          </div>

          {result.tools.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-lg font-semibold text-gray-700">No apps found</p>
              <p className="mt-2 text-sm text-gray-500">Try a different search or remove filters</p>
              <a href="/ai-search" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-all">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Try AI Search
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {result.tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}

          {result.total > result.per_page && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && (
                <a
                  href={`/apps?${source ? `source=${source}&` : ''}${query ? `q=${encodeURIComponent(query)}&` : ''}page=${page - 1}`}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  ← Prev
                </a>
              )}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(result.total / result.per_page)) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <a
                      key={p}
                      href={`/apps?${source ? `source=${source}&` : ''}${query ? `q=${encodeURIComponent(query)}&` : ''}page=${p}`}
                      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                        p === page ? 'bg-brand-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </a>
                  );
                })}
              </div>
              {result.tools.length === result.per_page && (
                <a
                  href={`/apps?${source ? `source=${source}&` : ''}${query ? `q=${encodeURIComponent(query)}&` : ''}page=${page + 1}`}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Next →
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
