import { searchTools } from '@/lib/api';
import AISearchBar from '@/components/AISearchBar';
import ToolCard from '@/components/ToolCard';

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }> | { q?: string; page?: string };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await Promise.resolve(searchParams);
  const query = sp.q || '';
  const page = parseInt(sp.page || '1', 10);

  let result = null;
  let error = null;

  if (query) {
    try {
      result = await searchTools(query, page);
    } catch {
      error = 'Failed to fetch results. GitHub API may be rate limited — try again shortly.';
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Search bar */}
      <div className="mb-8 flex justify-center">
        <AISearchBar initialQuery={query} />
      </div>

      {/* AI search suggestion banner */}
      {query && (
        <a
          href={`/ai-search?q=${encodeURIComponent(query)}`}
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 px-4 py-3 hover:bg-purple-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-purple-600">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900">Try AI Search for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-purple-600">Let AI pick the best tools and explain why they match</p>
            </div>
          </div>
          <span className="flex-shrink-0 text-sm font-medium text-purple-700 group-hover:translate-x-0.5 transition-transform">
            Try it →
          </span>
        </a>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {!query && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg font-semibold text-gray-700 mb-2">Search open-source tools</p>
          <p className="text-sm text-gray-500 mb-6">Enter a query above, or try AI search for natural language</p>
          <a
            href="/ai-search"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Try AI Search
          </a>
        </div>
      )}

      {result && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{result.total.toLocaleString()}</span> results for &ldquo;{result.query}&rdquo;
            </p>
            <p className="text-xs text-gray-400">Page {page}</p>
          </div>

          {result.tools.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-4xl mb-4">😶</p>
              <p className="text-lg font-semibold text-gray-700">No results found</p>
              <p className="mt-1 text-sm text-gray-500 mb-4">Try different keywords or use AI search</p>
              <a href={`/ai-search?q=${encodeURIComponent(query)}`} className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-all">
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
            <div className="mt-10 flex justify-center gap-2">
              {page > 1 && (
                <a
                  href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  ← Prev
                </a>
              )}
              <span className="flex items-center px-4 text-sm text-gray-500 font-medium">
                Page {page}
              </span>
              {result.tools.length === result.per_page && (
                <a
                  href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
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
