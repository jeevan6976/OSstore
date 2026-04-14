import { searchTools } from '@/lib/api';
import ToolCard from '@/components/ToolCard';

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; source?: string }> | { q?: string; page?: string; source?: string };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await Promise.resolve(searchParams);
  const query = sp.q || '';
  const page = parseInt(sp.page || '1', 10);
  const source = sp.source || '';

  let result = null;
  let error = null;

  if (query) {
    try {
      result = await searchTools(query, page, 20, source || undefined);
    } catch {
      error = 'Search failed — GitHub API may be rate limited. Try again shortly.';
    }
  }

  const buildHref = (overrides: Record<string, string | number>) => {
    const params: Record<string, string> = { q: query, page: String(page) };
    if (source) params.source = source;
    Object.assign(params, overrides);
    if (!params.q) delete params.q;
    return '/search?' + new URLSearchParams(params as Record<string, string>).toString();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Search bar */}
      <form action="/search" method="GET" className="flex gap-2 mb-4">
        {source && <input type="hidden" name="source" value={source} />}
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            name="q"
            defaultValue={query}
            placeholder="Search tools, apps, libraries..."
            autoFocus={!query}
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

      {/* Source filter tabs — only when there's a query */}
      {query && (
        <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: '', label: 'All Sources', icon: '🌐' },
            { key: 'github', label: 'GitHub', icon: '🐙' },
            { key: 'fdroid', label: 'F-Droid', icon: '📦' },
          ].map((tab) => {
            const isActive = source === tab.key;
            const params: Record<string, string> = { q: query };
            if (tab.key) params.source = tab.key;
            const href = '/search?' + new URLSearchParams(params).toString();
            return (
              <a
                key={tab.key}
                href={href}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  isActive ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.icon} {tab.label}
              </a>
            );
          })}
        </div>
      )}

      {/* Errors */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-5">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!query && (
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-base font-semibold text-gray-700">Search open-source tools</p>
            <p className="mt-1 text-sm text-gray-500">Type above to search GitHub and F-Droid</p>
          </div>
          <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-5">
            <p className="text-sm font-semibold text-purple-900 mb-3">
              <svg className="inline h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Or try AI Search — describe what you need
            </p>
            <div className="flex flex-wrap gap-2">
              {['lightweight Python web framework', 'self-hosted password manager', 'private Android messaging app', 'fast terminal emulator'].map((ex) => (
                <a key={ex} href={`/ai-search?q=${encodeURIComponent(ex)}`}
                  className="rounded-full border border-purple-200 bg-white px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors">
                  {ex}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{result.total.toLocaleString()}</span>{' '}
              results{query ? ` for "${result.query}"` : ''}
            </p>
            {page > 1 && <span className="text-xs text-gray-400">Page {page}</span>}
          </div>

          {result.tools.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
              <p className="text-3xl mb-3">😶</p>
              <p className="text-base font-semibold text-gray-700">No results found</p>
              <p className="mt-1 text-sm text-gray-500 mb-4">Try different keywords or use AI search</p>
              <a href={`/ai-search?q=${encodeURIComponent(query)}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-all">
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
            <div className="mt-8 flex justify-center gap-2">
              {page > 1 && (
                <a href={buildHref({ page: page - 1 })}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
                  ← Prev
                </a>
              )}
              <span className="flex items-center px-4 text-sm text-gray-500">Page {page}</span>
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
