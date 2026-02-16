import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

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

          <div className="mt-10 space-y-8">
            <section className="rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                General Inquiries
              </h2>
              <p className="mt-2 leading-relaxed text-gray-600">
                For questions about our tools, color data, or anything else:
              </p>
              <a
                href="mailto:hello@paintcolorhq.com"
                className="mt-3 inline-block text-brand-blue font-medium hover:underline"
              >
                hello@paintcolorhq.com
              </a>
            </section>

            <section className="rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Report a Color Data Issue
              </h2>
              <p className="mt-2 leading-relaxed text-gray-600">
                Noticed a color that looks wrong, a missing color number, or an
                incorrect brand attribution? Let us know and we&apos;ll fix it.
                Please include the color name, brand, and what looks incorrect.
              </p>
              <a
                href="mailto:data@paintcolorhq.com"
                className="mt-3 inline-block text-brand-blue font-medium hover:underline"
              >
                data@paintcolorhq.com
              </a>
            </section>

            <section className="rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Feature Requests
              </h2>
              <p className="mt-2 leading-relaxed text-gray-600">
                Have an idea for a tool or feature that would help with your
                paint projects? We build based on what users actually need, so
                your feedback shapes what we work on next.
              </p>
              <a
                href="mailto:hello@paintcolorhq.com?subject=Feature%20Request"
                className="mt-3 inline-block text-brand-blue font-medium hover:underline"
              >
                hello@paintcolorhq.com
              </a>
            </section>

            <section className="rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Privacy & Data Requests
              </h2>
              <p className="mt-2 leading-relaxed text-gray-600">
                For questions about your account data, deletion requests, or
                privacy concerns, see our{" "}
                <Link
                  href="/privacy"
                  className="text-brand-blue underline hover:text-brand-blue-dark"
                >
                  Privacy Policy
                </Link>{" "}
                or contact:
              </p>
              <a
                href="mailto:privacy@paintcolorhq.com"
                className="mt-3 inline-block text-brand-blue font-medium hover:underline"
              >
                privacy@paintcolorhq.com
              </a>
            </section>
          </div>

          <p className="mt-10 text-sm text-gray-400">
            We typically respond within 1–2 business days.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
