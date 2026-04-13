'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// ── Types ────────────────────────────────────────────────────

interface AITool {
  id: string;
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  stars: number;
  forks: number;
  license: string | null;
  topics: string | null;
  owner_avatar: string | null;
  last_pushed_at: string | null;
  icon_url: string | null;
  match_reason: string;
  match_score: number;
}

interface AISearchResult {
  intent: string;
  criteria: string[];
  tools: AITool[];
  error?: string;
}

// ── Helpers ──────────────────────────────────────────────────

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function parseTopics(t: string | null): string[] {
  if (!t) return [];
  try { return JSON.parse(t); } catch { return []; }
}

function scoreColor(score: number) {
  if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 65) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-gray-500 bg-gray-50 border-gray-200';
}

// ── Skeleton ─────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Intent banner skeleton */}
      <div className="h-16 rounded-2xl bg-purple-100/60" />
      {/* Cards */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-xl bg-gray-100 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-gray-100" />
              <div className="h-3 w-72 rounded bg-gray-100" />
            </div>
          </div>
          <div className="h-8 rounded-lg bg-purple-50" />
        </div>
      ))}
    </div>
  );
}

// ── AI Result Card ────────────────────────────────────────────

function AIResultCard({ tool, rank }: { tool: AITool; rank: number }) {
  const topics = parseTopics(tool.topics).slice(0, 3);

  return (
    <a href={`/tool/${tool.id}`} className="block group">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/60">
        <div className="flex gap-4">
          {/* Rank + Icon */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
            <span className="text-xs font-bold text-gray-300 tabular-nums">#{rank}</span>
            <div className="h-11 w-11 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
              {tool.icon_url ? (
                <img src={tool.icon_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-base font-bold text-gray-300">
                  {tool.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-gray-400 truncate">{tool.full_name}</p>
              </div>
              {/* Match score */}
              <div className={`flex-shrink-0 rounded-lg border px-2 py-1 text-center ${scoreColor(tool.match_score)}`}>
                <div className="text-sm font-bold tabular-nums">{tool.match_score}</div>
                <div className="text-[9px] font-semibold uppercase opacity-70">match</div>
              </div>
            </div>

            {tool.description && (
              <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{tool.description}</p>
            )}

            {/* AI match reason */}
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-purple-50 border border-purple-100 px-3 py-2">
              <svg className="h-3.5 w-3.5 text-purple-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
              <p className="text-xs text-purple-700 font-medium leading-relaxed">{tool.match_reason}</p>
            </div>

            {/* Meta */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
              {tool.language && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />{tool.language}
                </span>
              )}
              {tool.stars > 0 && <span>★ {formatNum(tool.stars)}</span>}
              {tool.forks > 0 && <span>⑂ {formatNum(tool.forks)}</span>}
              {topics.map((t) => (
                <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px]">{t}</span>
              ))}
              {tool.last_pushed_at && (
                <span className="ml-auto">Updated {timeAgo(tool.last_pushed_at)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

// ── Inner page (needs useSearchParams) ───────────────────────

function AISearchInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [result, setResult] = useState<AISearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(query);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data: AISearchResult = await res.json();
      setResult(data);
    } catch {
      setResult({ intent: q, criteria: [], tools: [], error: 'Search failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query) {
      setInput(query);
      runSearch(query);
    }
  }, [query, runSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Update URL without full navigation
      window.history.pushState({}, '', `/ai-search?q=${encodeURIComponent(input.trim())}`);
      runSearch(input.trim());
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 mb-4">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          AI-Powered Search
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Find the right tool for your need</h1>
        <p className="mt-2 text-sm text-gray-500">Describe what you want to build — AI picks the best open-source tools</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg className="h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='e.g. "I need a fast REST API framework for Python"'
            className="w-full rounded-2xl border-2 border-purple-200 bg-white py-4 pl-12 pr-36 text-base shadow-lg shadow-purple-100/40 transition-all focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10 placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Thinking...' : 'Ask AI'}
          </button>
        </div>
      </form>

      {/* Loading state */}
      {loading && (
        <div>
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-purple-50 border border-purple-100 p-4">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full bg-purple-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-sm text-purple-700 font-medium">
              Understanding your need and finding the best tools...
            </p>
          </div>
          <Skeleton />
        </div>
      )}

      {/* Error */}
      {result?.error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {result.error}
        </div>
      )}

      {/* Results */}
      {result && !loading && !result.error && (
        <div className="space-y-6">
          {/* AI Intent banner */}
          <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 rounded-xl bg-purple-600 p-2">
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">
                  AI understood your need as
                </p>
                <p className="text-sm font-medium text-gray-800">{result.intent}</p>
                {result.criteria.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.criteria.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-white border border-purple-200 px-2.5 py-0.5 text-[11px] font-medium text-purple-700"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tool count */}
          {result.tools.length > 0 ? (
            <>
              <p className="text-sm text-gray-500">
                Found <span className="font-semibold text-gray-700">{result.tools.length}</span> best matches ranked by AI
              </p>
              <div className="space-y-4">
                {result.tools.map((tool, i) => (
                  <AIResultCard key={tool.id} tool={tool} rank={i + 1} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No matching tools found. Try rephrasing your request.
            </p>
          )}

          {/* Footer CTA */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">Want to browse all tools?</p>
            <a
              href="/search?q=stars%3A%3E100"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Browse all →
            </a>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!query && !loading && !result && (
        <div className="space-y-4">
          <p className="text-center text-sm text-gray-400 mb-6">Try asking something like:</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              'I need a lightweight Python web framework',
              'Best Android app for private messaging',
              'Fast key-value database for caching',
              'CLI tool to manage Docker containers',
              'Self-hosted alternative to Google Analytics',
              'Markdown editor with live preview',
            ].map((example) => (
              <button
                key={example}
                onClick={() => {
                  setInput(example);
                  window.history.pushState({}, '', `/ai-search?q=${encodeURIComponent(example)}`);
                  runSearch(example);
                }}
                className="rounded-xl border border-gray-200 bg-white p-4 text-left text-sm text-gray-600 hover:border-purple-300 hover:bg-purple-50/40 transition-all group"
              >
                <span className="text-purple-500 mr-2 group-hover:mr-3 transition-all">✦</span>
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page (Suspense boundary for useSearchParams) ─────────────

export default function AISearchPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton />
      </div>
    }>
      <AISearchInner />
    </Suspense>
  );
}
