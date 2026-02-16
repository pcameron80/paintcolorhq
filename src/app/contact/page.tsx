import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the Paint Color HQ team. Report color data issues, suggest features, or ask questions about our paint color matching tools.",
  alternates: { canonical: "https://www.paintcolorhq.com/contact" },
  openGraph: {
    title: "Contact Paint Color HQ",
    description:
      "Get in touch with the Paint Color HQ team. Report issues, suggest features, or ask questions.",
    type: "website",
    url: "https://www.paintcolorhq.com/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Contact</span>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            Have a question, found incorrect color data, or want to suggest a
            feature? We&apos;d love to hear from you.
          </p>

          <div className="mt-10 rounded-lg border border-gray-200 p-6">
            <ContactForm />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900">
                Color Data Issues
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Noticed a color that looks wrong or a missing color number?
                Select &ldquo;Color Data Issue&rdquo; in the form above and
                include the color name, brand, and what looks incorrect.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900">
                Privacy & Data Requests
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                For account data or deletion requests, see our{" "}
                <Link
                  href="/privacy"
                  className="text-brand-blue underline hover:text-brand-blue-dark"
                >
                  Privacy Policy
                </Link>{" "}
                or select &ldquo;Privacy & Data Request&rdquo; above.
              </p>
            </div>
          </div>

          <p className="mt-8 text-sm text-gray-400">
            We typically respond within 1–2 business days.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
