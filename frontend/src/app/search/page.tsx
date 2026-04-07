import { searchTools } from '@/lib/api';
import SearchBar from '@/components/SearchBar';
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
    } catch (e) {
      error = 'Failed to fetch results. Is the backend running?';
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex justify-center">
        <SearchBar initialQuery={query} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!query && (
        <p className="text-center text-gray-500">Enter a search query to find open-source tools.</p>
      )}

      {result && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Found <span className="font-semibold text-gray-700">{result.total}</span> results for &quot;{result.query}&quot;
            </p>
          </div>

          {result.tools.length === 0 ? (
            <p className="text-center text-gray-500">No tools found. Try a different query.</p>
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
                  href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
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
                  href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
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
