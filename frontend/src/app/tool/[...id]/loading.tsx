export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Back link */}
      <div className="mb-6 h-5 w-28 rounded shimmer" />
      {/* Header card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8">
        <div className="flex items-start gap-5">
          <div className="h-20 w-20 rounded-2xl shimmer" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-64 rounded shimmer" />
            <div className="h-4 w-40 rounded shimmer" />
            <div className="h-4 w-full rounded shimmer" />
            <div className="h-4 w-3/4 rounded shimmer" />
          </div>
          <div className="h-20 w-20 rounded-2xl shimmer" />
        </div>
      </div>
      {/* Details grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl shimmer" />
            ))}
          </div>
          <div className="h-64 rounded-2xl shimmer" />
          <div className="h-96 rounded-2xl shimmer" />
        </div>
        <div className="space-y-6">
          <div className="h-48 rounded-2xl shimmer" />
          <div className="h-32 rounded-2xl shimmer" />
        </div>
      </div>
    </div>
  );
}
