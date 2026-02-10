export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 h-[57px] border-b border-gray-200 bg-white/95" />

      <main className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-4 w-40 rounded bg-gray-200" />
        <div className="h-8 w-56 rounded bg-gray-200" />
        <div className="mt-2 h-5 w-96 rounded bg-gray-200" />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 p-4"
            >
              <div className="flex gap-2">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex-1">
                    <div className="aspect-square rounded-lg bg-gray-200" />
                  </div>
                ))}
              </div>
              <div className="mt-3 h-4 w-32 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-48 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
