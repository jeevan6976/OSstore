export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl shimmer" />
        <div className="space-y-2">
          <div className="h-7 w-40 rounded shimmer" />
          <div className="h-4 w-56 rounded shimmer" />
        </div>
      </div>
      <div className="mb-8 h-12 w-full rounded-2xl shimmer" />
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl shimmer" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-48 rounded shimmer" />
                <div className="h-4 w-full rounded shimmer" />
                <div className="h-4 w-2/3 rounded shimmer" />
              </div>
              <div className="h-12 w-16 rounded-xl shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
