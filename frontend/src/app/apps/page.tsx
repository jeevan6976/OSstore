import { browseApps } from '@/lib/api';
import SearchBar from '@/components/SearchBar';
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
  } catch (e) {
    error = 'Failed to fetch apps. Is the backend running?';
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-xl shadow-lg shadow-purple-500/20">
            📱
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">App Store</h1>
            <p className="text-sm text-gray-500">Open-source apps for every platform</p>
          </div>
        </div>
      </div>

      {/* Search + Source filter */}
      <div className="mb-8 space-y-4">
        <SearchBar initialQuery={query} action="/apps" placeholder="Search Android apps, tools, utilities..." />

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {SOURCE_TABS.map((tab) => {
            const isActive = source === tab.key;
            const href = `/apps${tab.key ? `?source=${tab.key}` : ''}${query ? `${tab.key ? '&' : '?'}q=${encodeURIComponent(query)}` : ''}`;
            return (
              <a
                key={tab.key}
                href={href}
                className={`flex-shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive ? tab.activeColor : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </a>
            );
          })}

          {/* Platform quick filters */}
          <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <span>Platforms:</span>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-emerald-600 font-medium">🤖 Android</span>
            <span className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1 text-gray-600 font-medium">🍎 Mac</span>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-blue-600 font-medium">🪟 Win</span>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-amber-600 font-medium">🐧 Linux</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {result && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900 text-lg">{result.total}</span> apps available
            </p>
            <div className="text-xs text-gray-400">
              Page {page} of {Math.ceil(result.total / result.per_page)}
            </div>
          </div>

          {result.tools.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="text-5xl mb-4">�</div>
              <p className="text-lg font-semibold text-gray-700">No apps found</p>
              <p className="mt-2 text-sm text-gray-500">Try a different search or remove filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {result.total > result.per_page && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && (
                <a
                  href={`/apps?${source ? `source=${source}&` : ''}${query ? `q=${encodeURIComponent(query)}&` : ''}page=${page - 1}`}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  ← Previous
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
                        p === page
                          ? 'bg-brand-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
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
