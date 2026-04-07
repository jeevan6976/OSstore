import SearchBar from '@/components/SearchBar';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center px-4 pt-24 pb-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white shadow-lg">
        OS
      </div>
      <h1 className="mb-3 text-center text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
        Discover Trusted Open Source
      </h1>
      <p className="mb-10 max-w-xl text-center text-lg text-gray-500">
        Search thousands of tools, libraries, APIs, and apps — with trust scores, risk indicators, and APK downloads.
      </p>
      <SearchBar />

      {/* Quick navigation */}
      <div className="mt-6 flex gap-3">
        <a
          href="/search?q=framework"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          🔍 Search Tools
        </a>
        <a
          href="/apps"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          📱 Browse Apps
        </a>
      </div>

      <div className="mt-16 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-2xl">🔍</div>
          <h3 className="mb-1 font-semibold text-gray-900">Smart Search</h3>
          <p className="text-sm text-gray-500">Full-text search across names, descriptions, and topics.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-2xl">📱</div>
          <h3 className="mb-1 font-semibold text-gray-900">App Store</h3>
          <p className="text-sm text-gray-500">Browse F-Droid & GitHub APKs with one-click download.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-2xl">🛡️</div>
          <h3 className="mb-1 font-semibold text-gray-900">Trust Scores</h3>
          <p className="text-sm text-gray-500">Multi-dimensional scoring based on activity, community, and maintenance.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-2xl">⚠️</div>
          <h3 className="mb-1 font-semibold text-gray-900">Risk Flags</h3>
          <p className="text-sm text-gray-500">Automatic detection of stale repos, missing licenses, and more.</p>
        </div>
      </div>
    </div>
  );
}
