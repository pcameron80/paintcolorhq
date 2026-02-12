import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Paint Color HQ",
  description:
    "Privacy Policy for Paint Color HQ. Learn how we collect, use, and protect your information when you use our paint color matching service.",
  alternates: { canonical: "https://www.paintcolorhq.com/privacy" },
  openGraph: {
    title: "Privacy Policy | Paint Color HQ",
    description:
      "Privacy Policy for Paint Color HQ. Learn how we collect, use, and protect your information.",
    type: "website",
    url: "https://www.paintcolorhq.com/privacy",
  },
};

export default function PrivacyPolicyPage() {
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
            <span className="text-gray-900">Privacy Policy</span>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">
            Effective date: February 2025
          </p>

          <div className="mt-8 space-y-8 text-gray-700">
            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Information We Collect
              </h2>
              <p className="mt-3 leading-relaxed">
                When you use Paint Color HQ, we may collect the following types
                of information:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
                <li>
                  <strong>Account information:</strong> If you sign in with
                  Google, we receive your name, email address, and profile
                  picture from Google OAuth. This information is stored securely
                  via Supabase Authentication.
                </li>
                <li>
                  <strong>Project data:</strong> If you create color projects or
                  palettes while signed in, we store that data in your account so
                  you can access it across sessions.
                </li>
                <li>
                  <strong>Usage data:</strong> We use Google Analytics to collect
                  anonymous usage information such as pages visited, time on
                  site, browser type, and referring pages. This helps us
                  understand how the site is used and improve it.
                </li>
                <li>
                  <strong>Cookies:</strong> We use cookies for authentication
                  sessions, analytics, and advertising. See the Cookies section
                  below for details.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Cookies and Advertising
              </h2>
              <p className="mt-3 leading-relaxed">
                Paint Color HQ uses cookies for the following purposes:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
                <li>
                  <strong>Essential cookies:</strong> Required for
                  authentication and core site functionality.
                </li>
                <li>
                  <strong>Analytics cookies:</strong> Google Analytics uses
                  cookies to collect anonymous usage data. You can opt out using
                  the{" "}
                  <a
                    href="https://tools.google.com/dlpage/gaoptout"
                    className="text-blue-600 underline hover:text-blue-800"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Analytics Opt-out Browser Add-on
                  </a>
                  .
                </li>
                <li>
                  <strong>Advertising cookies:</strong> We use Google AdSense to
                  display advertisements. Google and its partners may use cookies
                  to serve ads based on your prior visits to this site or other
                  websites. You can opt out of personalized advertising by
                  visiting{" "}
                  <a
                    href="https://www.google.com/settings/ads"
                    className="text-blue-600 underline hover:text-blue-800"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Ads Settings
                  </a>
                  .
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                How We Use Your Information
              </h2>
              <p className="mt-3 leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
                <li>Provide and maintain your account and saved projects</li>
                <li>Improve the site based on usage patterns</li>
                <li>Display relevant advertisements through Google AdSense</li>
                <li>
                  Respond to your inquiries if you contact us
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Third-Party Services
              </h2>
              <p className="mt-3 leading-relaxed">
                Paint Color HQ relies on the following third-party services, each
                with their own privacy policies:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
                <li>
                  <strong>Google Analytics</strong> &mdash; website usage
                  analytics
                </li>
                <li>
                  <strong>Google AdSense</strong> &mdash; advertising
                </li>
                <li>
                  <strong>Supabase</strong> &mdash; authentication and database
                  services
                </li>
                <li>
                  <strong>Google OAuth</strong> &mdash; sign-in authentication
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Data Retention
              </h2>
              <p className="mt-3 leading-relaxed">
                We retain your account information and project data for as long
                as your account is active. If you wish to delete your account and
                associated data, please contact us using the information below.
                Analytics data is retained according to Google Analytics&apos;
                default retention settings.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Your Rights
              </h2>
              <p className="mt-3 leading-relaxed">
                Depending on your location, you may have the right to:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt out of personalized advertising</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                To exercise any of these rights, please contact us at the email
                address below.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Changes to This Policy
              </h2>
              <p className="mt-3 leading-relaxed">
                We may update this Privacy Policy from time to time. Changes will
                be posted on this page with an updated effective date. Continued
                use of the site after changes constitutes acceptance of the
                updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Contact Us
              </h2>
              <p className="mt-3 leading-relaxed">
                If you have questions about this Privacy Policy or your data,
                please contact us at{" "}
                <a
                  href="mailto:privacy@paintcolorhq.com"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  privacy@paintcolorhq.com
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
