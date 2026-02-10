export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 h-[57px] border-b border-gray-200 bg-white/95" />

      <main className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-4 w-56 rounded bg-gray-200" />
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="mt-2 h-5 w-80 rounded bg-gray-200" />

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-gray-200">
              <div className="aspect-[3/4] bg-gray-200" />
              <div className="p-3">
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="mt-1 h-3 w-16 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
