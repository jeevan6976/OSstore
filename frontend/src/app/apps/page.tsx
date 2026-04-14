import { browseApps } from '@/lib/api';
import ToolCard from '@/components/ToolCard';

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; source?: string }> | { q?: string; page?: string; source?: string };
}

const SOURCE_TABS = [
  { key: '', label: 'All', icon: '🌐' },
  { key: 'fdroid', label: 'F-Droid', icon: '📦' },
  { key: 'github', label: 'GitHub', icon: '🐙' },
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
    error = 'Failed to load apps. Try again shortly.';
  }

  const buildHref = (overrides: Record<string, string | number>) => {
    const params: Record<string, string> = { page: String(page) };
    if (source) params.source = source;
    if (query) params.q = query;
    Object.assign(params, overrides);
    if (params.page === '1') delete params.page;
    return '/apps?' + new URLSearchParams(params as Record<string, string>).toString();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Explore</h1>
        <p className="text-sm text-gray-500">Open-source apps, tools, APIs and libraries from F-Droid &amp; GitHub</p>
      </div>

      {/* Search bar */}
      <form action="/apps" method="GET" className="flex gap-2 mb-4">
        {source && <input type="hidden" name="source" value={source} />}
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            name="q"
            defaultValue={query}
            placeholder={source === 'fdroid' ? 'Search F-Droid apps...' : 'Search apps and tools...'}
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <button type="submit" className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-all">
          Search
        </button>
        <a href="/ai-search" className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100 transition-all whitespace-nowrap">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          AI
        </a>
      </form>

      {/* Source tabs */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        {SOURCE_TABS.map((tab) => {
          const isActive = source === tab.key;
          const params: Record<string, string> = {};
          if (tab.key) params.source = tab.key;
          if (query) params.q = query;
          const href = '/apps' + (Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '');
          return (
            <a
              key={tab.key}
              href={href}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                isActive
                  ? tab.key === 'fdroid'
                    ? 'bg-blue-600 text-white shadow-md'
                    : tab.key === 'github'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-gray-800 text-white shadow-md'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </a>
          );
        })}

        {/* Platform pills — decorative */}
        <div className="ml-auto hidden sm:flex items-center gap-2">
          {[
            { icon: '🤖', label: 'Android', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            { icon: '🍎', label: 'Mac', color: 'bg-gray-50 border-gray-200 text-gray-600' },
            { icon: '🪟', label: 'Windows', color: 'bg-blue-50 border-blue-200 text-blue-700' },
            { icon: '🐧', label: 'Linux', color: 'bg-amber-50 border-amber-200 text-amber-700' },
          ].map((p) => (
            <span key={p.label} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${p.color}`}>
              {p.icon} {p.label}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-5">
          {error}
        </div>
      )}

      {result && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{result.total.toLocaleString()}</span> apps
              {query && <span> matching &ldquo;{query}&rdquo;</span>}
            </p>
            {page > 1 && <span className="text-xs text-gray-400">Page {page}</span>}
          </div>

          {result.tools.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-base font-semibold text-gray-700">No apps found</p>
              <p className="mt-1 text-sm text-gray-500 mb-4">Try a different search or remove filters</p>
              <a href="/ai-search" className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-all">
                Try AI Search
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {result.tools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          )}

          {/* Pagination */}
          {result.total > result.per_page && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && (
                <a href={buildHref({ page: page - 1 })}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
                  ← Prev
                </a>
              )}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(result.total / result.per_page)) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <a key={p} href={buildHref({ page: p })}
                      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                        p === page ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                      }`}>
                      {p}
                    </a>
                  );
                })}
              </div>
              {result.tools.length === result.per_page && (
                <a href={buildHref({ page: page + 1 })}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
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
