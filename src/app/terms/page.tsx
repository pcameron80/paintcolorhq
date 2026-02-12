import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Terms of Service | Paint Color HQ",
  description:
    "Terms of Service for Paint Color HQ. Read the terms and conditions governing the use of our paint color matching and comparison service.",
  alternates: { canonical: "https://www.paintcolorhq.com/terms" },
  openGraph: {
    title: "Terms of Service | Paint Color HQ",
    description:
      "Terms of Service for Paint Color HQ. Read the terms governing our paint color matching service.",
    type: "website",
    url: "https://www.paintcolorhq.com/terms",
  },
};

export default function TermsOfServicePage() {
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
            <span className="text-gray-900">Terms of Service</span>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Effective date: February 2025
          </p>

          <div className="mt-8 space-y-8 text-gray-700">
            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Acceptance of Terms
              </h2>
              <p className="mt-3 leading-relaxed">
                By accessing or using Paint Color HQ (paintcolorhq.com), you
                agree to be bound by these Terms of Service. If you do not agree
                to these terms, please do not use the site.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Service Description
              </h2>
              <p className="mt-3 leading-relaxed">
                Paint Color HQ is a free online tool for browsing, comparing, and
                matching paint colors across multiple brands. We provide color
                data, cross-brand matching using the Delta E 2000 algorithm, and
                tools for organizing color palettes and projects.
              </p>
              <p className="mt-3 leading-relaxed">
                Paint Color HQ is a reference tool only. We do not sell paint or
                any physical products. We are not affiliated with, endorsed by, or
                sponsored by any paint manufacturer.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Color Accuracy Disclaimer
              </h2>
              <p className="mt-3 leading-relaxed">
                Colors displayed on this site are digital approximations and may
                not exactly match the actual paint color as it appears on a
                physical surface. Screen settings, lighting conditions, surface
                texture, and other factors can affect how colors appear.
              </p>
              <p className="mt-3 leading-relaxed">
                Cross-brand color matches are calculated algorithmically and
                represent the closest available match, not an exact duplicate.
                Always verify colors with physical paint samples or swatches
                before purchasing.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                User Accounts and Projects
              </h2>
              <p className="mt-3 leading-relaxed">
                You may optionally create an account by signing in with Google.
                When you do, you can save color projects and palettes to your
                account. You are responsible for maintaining the security of your
                account and for all activity that occurs under it.
              </p>
              <p className="mt-3 leading-relaxed">
                We reserve the right to suspend or terminate accounts that
                violate these terms or are used for abusive purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Intellectual Property
              </h2>
              <p className="mt-3 leading-relaxed">
                The Paint Color HQ website, including its design, code, and
                original content, is owned by Paint Color HQ. Paint color names,
                codes, and associated data are the property of their respective
                manufacturers and are used here for informational and reference
                purposes.
              </p>
              <p className="mt-3 leading-relaxed">
                You may not scrape, reproduce, or redistribute the site&apos;s
                content or data in bulk without prior written permission.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Limitation of Liability
              </h2>
              <p className="mt-3 leading-relaxed">
                Paint Color HQ is provided &ldquo;as is&rdquo; without
                warranties of any kind, express or implied. We do not guarantee
                the accuracy, completeness, or reliability of any color data,
                matches, or information on the site.
              </p>
              <p className="mt-3 leading-relaxed">
                In no event shall Paint Color HQ be liable for any damages
                arising from the use or inability to use this service, including
                but not limited to damages from incorrect color matching, paint
                purchasing decisions, or data loss.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Changes to These Terms
              </h2>
              <p className="mt-3 leading-relaxed">
                We may update these Terms of Service from time to time. Changes
                will be posted on this page with an updated effective date. Your
                continued use of the site after any changes constitutes
                acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Contact Us
              </h2>
              <p className="mt-3 leading-relaxed">
                If you have questions about these Terms of Service, please
                contact us at{" "}
                <a
                  href="mailto:info@paintcolorhq.com"
                  className="text-brand-blue underline hover:text-brand-blue-dark"
                >
                  info@paintcolorhq.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
