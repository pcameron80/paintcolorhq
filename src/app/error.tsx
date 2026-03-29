"use client";

import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-gray-500">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Unexpected error
        </h1>
        <p className="mt-4 text-center text-gray-600">
          We hit an unexpected problem loading this page. Please try again.
        </p>
        <div className="mt-8 flex gap-4">
          <button
            onClick={reset}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Go home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
