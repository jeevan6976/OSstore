import { browseApps } from '@/lib/api';
import SearchBar from '@/components/SearchBar';
import ToolCard from '@/components/ToolCard';

interface PageProps {
  searchParams: { q?: string; page?: string; source?: string };
}

export default async function AppsPage({ searchParams }: PageProps) {
  const query = searchParams.q || '';
  const page = parseInt(searchParams.page || '1', 10);
  const source = searchParams.source || '';

  let result = null;
  let error = null;

  try {
    result = await browseApps(page, 20, query, source || undefined);
  } catch (e) {
    error = 'Failed to fetch apps. Is the backend running?';
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900">📱 App Store</h1>
        <p className="mt-2 text-gray-500">
          Browse open-source Android apps from F-Droid and GitHub
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <SearchBar initialQuery={query} action="/apps" placeholder="Search apps..." />
      </div>

      {/* Source filter tabs */}
      <div className="mb-6 flex justify-center gap-2">
        <a
          href={`/apps${query ? `?q=${encodeURIComponent(query)}` : ''}`}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            !source
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Sources
        </a>
        <a
          href={`/apps?source=fdroid${query ? `&q=${encodeURIComponent(query)}` : ''}`}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            source === 'fdroid'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📦 F-Droid
        </a>
        <a
          href={`/apps?source=github${query ? `&q=${encodeURIComponent(query)}` : ''}`}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            source === 'github'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🐙 GitHub
        </a>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{result.total}</span> apps available
            </p>
          </div>

          {result.tools.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">📱</div>
              <p className="text-gray-500">No apps found. Try a different search or filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}

          {result.total > result.per_page && (
            <div className="mt-8 flex justify-center gap-2">
              {page > 1 && (
                <a
                  href={`/apps?${source ? `source=${source}&` : ''}${query ? `q=${encodeURIComponent(query)}&` : ''}page=${page - 1}`}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  ← Previous
                </a>
              )}
              <span className="flex items-center px-3 text-sm text-gray-500">
                Page {page}
              </span>
              {result.tools.length === result.per_page && (
                <a
                  href={`/apps?${source ? `source=${source}&` : ''}${query ? `q=${encodeURIComponent(query)}&` : ''}page=${page + 1}`}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
