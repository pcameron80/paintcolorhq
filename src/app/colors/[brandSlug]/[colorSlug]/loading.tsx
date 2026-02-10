export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 h-[57px] border-b border-gray-200 bg-white/95" />

      <main className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb skeleton */}
        <div className="mb-6 h-4 w-64 rounded bg-gray-200" />

        {/* Hero */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="aspect-square w-full rounded-2xl bg-gray-200" />
          <div>
            <div className="h-8 w-48 rounded bg-gray-200" />
            <div className="mt-2 h-5 w-32 rounded bg-gray-200" />
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-gray-100" />
              ))}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="mt-16 h-6 w-40 rounded bg-gray-200" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-gray-100" />
          ))}
        </div>
      </main>
    </div>
  );
}
