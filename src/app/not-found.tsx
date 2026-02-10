import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-gray-500">404</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Page not found
        </h1>
        <p className="mt-4 text-center text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/"
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Go home
          </Link>
          <Link
            href="/search"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Search colors
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
