export default function Loading() {
  return (
    <div className="flex flex-col">
      {/* Hero skeleton */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:py-28 text-center">
          <div className="mb-6 mx-auto h-10 w-48 rounded-full bg-white/15 shimmer" />
          <div className="mx-auto h-16 w-3/4 rounded-xl bg-white/15 shimmer" />
          <div className="mx-auto mt-4 h-10 w-2/3 rounded-xl bg-white/15 shimmer" />
          <div className="mx-auto mt-10 h-14 w-96 max-w-full rounded-2xl bg-white/15 shimmer" />
        </div>
      </section>
      {/* Cards skeleton */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 h-8 w-48 rounded-lg shimmer" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
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
      </section>
    </div>
  );
}
