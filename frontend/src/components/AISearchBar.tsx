'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AISearchBar({
  initialQuery = '',
  placeholder = 'Search apps, tools, libraries...',
}: {
  initialQuery?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<'search' | 'ai'>('search');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (mode === 'ai') {
      router.push(`/ai-search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const isAI = mode === 'ai';

  return (
    <div className="w-full max-w-2xl space-y-3">
      {/* Mode toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-white/10 backdrop-blur-sm p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode('search')}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
              !isAI
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
              isAI
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Ask AI
          </button>
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            {isAI ? (
              <svg className="h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isAI
                ? 'Describe what you need to build...'
                : placeholder
            }
            className={`w-full rounded-2xl border bg-white py-4 pl-12 pr-32 text-base shadow-lg transition-all focus:outline-none focus:ring-4 placeholder:text-gray-400 ${
              isAI
                ? 'border-purple-300 shadow-purple-100/50 focus:border-purple-500 focus:ring-purple-500/10'
                : 'border-gray-200 shadow-black/5 focus:border-brand-500 focus:ring-brand-500/10'
            }`}
          />

          <button
            type="submit"
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all focus:outline-none focus:ring-2 ${
              isAI
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-600/20 hover:from-purple-700 hover:to-indigo-700 focus:ring-purple-500'
                : 'bg-brand-600 shadow-brand-600/20 hover:bg-brand-700 focus:ring-brand-500'
            }`}
          >
            {isAI ? 'Ask AI' : 'Search'}
          </button>
        </div>
      </form>

      {/* AI hint text */}
      {isAI && (
        <p className="text-center text-xs text-white/60">
          Try: &ldquo;lightweight Python HTTP client&rdquo; · &ldquo;self-hosted password manager&rdquo;
        </p>
      )}
    </div>
  );
}
