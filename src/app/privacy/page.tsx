import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  MEDIAVINE_ENABLED,
  MEDIAVINE_PRIVACY_EFFECTIVE_DATE,
  MEDIAVINE_PRIVACY_HTML,
} from "@/lib/mediavine";

const EFFECTIVE_DATE =
  MEDIAVINE_ENABLED && MEDIAVINE_PRIVACY_EFFECTIVE_DATE
    ? MEDIAVINE_PRIVACY_EFFECTIVE_DATE
    : "October 26, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
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
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-24 px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Legal</span>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm text-outline">Effective date: {EFFECTIVE_DATE}</p>
          </div>
        </section>

        <section className="px-6 md:px-12 pb-20">
          <div className="max-w-4xl mx-auto space-y-10 text-on-surface-variant leading-relaxed">
            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Information We Collect
              </h2>
              <p>When you use Paint Color HQ, we may collect the following types of information:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong className="text-on-surface">Account information:</strong> If you sign in with Google, we receive your name, email address, and profile picture from Google OAuth. This information is stored securely via Supabase Authentication.</li>
                <li><strong className="text-on-surface">Project data:</strong> If you create color projects or palettes while signed in, we store that data in your account so you can access it across sessions.</li>
                <li><strong className="text-on-surface">Usage data:</strong> We use Google Analytics to collect anonymous usage information such as pages visited, time on site, browser type, and referring pages. This helps us understand how the site is used and improve it.</li>
                <li><strong className="text-on-surface">Cookieless visit counts:</strong> We also run our own copy of Plausible Analytics on our own server to count page views. It sets no cookies, stores nothing on your device, and does not track you across sites. It records the page, the referring site, your browser, device type and country. Your IP address is used only to estimate that location and to count unique visitors per day, and it is never stored. This data stays on our server and is not shared.</li>
                <li><strong className="text-on-surface">Cookies:</strong> We use cookies for authentication sessions and analytics. See the Cookies section below for details.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Cookies and Advertising
              </h2>
              <p>Paint Color HQ uses cookies for the following purposes:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong className="text-on-surface">Essential cookies:</strong> Required for authentication and core site functionality.</li>
                <li><strong className="text-on-surface">Analytics cookies:</strong> Google Analytics uses cookies to collect anonymous usage data. You can opt out using the{" "}<a href="https://tools.google.com/dlpage/gaoptout" className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.</li>
                {MEDIAVINE_ENABLED ? (
                  <li><strong className="text-on-surface">Advertising cookies:</strong> Ads on Paint Color HQ are served by Mediavine (Journey by Mediavine) and its advertising partners, which use cookies and similar technologies as described in the Mediavine section below.</li>
                ) : (
                  <li><strong className="text-on-surface">Advertising cookies:</strong> We do not currently show third-party ads. If that changes, this section will name the ad partner and explain how to opt out.</li>
                )}
              </ul>
              {MEDIAVINE_ENABLED ? (
                <p className="mt-4"><strong className="text-on-surface">Your choices by location:</strong> If you visit from the European Economic Area, the United Kingdom or Switzerland, Mediavine&apos;s consent tool asks for your choice before advertising cookies are set, and you can change it at any time from that tool. California and other US-state residents can opt out of the sale or sharing of personal information for targeted advertising with Mediavine&apos;s link in the site footer. Our own &ldquo;Cookie settings&rdquo; link in the footer turns Google Analytics cookies on or off, and we honor the Global Privacy Control (GPC) browser signal by turning off advertising signals in Google Analytics. Both cover Google Analytics only; ad choices are made through Mediavine&apos;s tools.</p>
              ) : (
                <p className="mt-4"><strong className="text-on-surface">Your choices by location:</strong> If you visit from the European Economic Area, the United Kingdom or Switzerland, analytics and advertising cookies stay off until you click Accept on the cookie banner. Everywhere else, they are on by default, and you can turn them off at any time with the &ldquo;Your Privacy Choices&rdquo; link in the site footer. That link is how California and other US-state residents opt out of the sale or sharing of personal information for targeted advertising. We also honor the Global Privacy Control (GPC) browser signal as an opt-out of advertising cookies.</p>
              )}
            </div>

            {MEDIAVINE_ENABLED && MEDIAVINE_PRIVACY_HTML && (
              <div>
                {/* Mediavine's required language, verbatim from
                    src/lib/mediavine.ts. The Privacy Health Check matches this
                    heading and text exactly: do not edit either here. */}
                <h3 className="font-headline text-lg font-bold text-on-surface mb-4">
                  Mediavine Programmatic Advertising (Ver 1.1)
                </h3>
                <div
                  className="space-y-3 [&_a]:text-primary [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: MEDIAVINE_PRIVACY_HTML }}
                />
              </div>
            )}

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                How We Use Your Information
              </h2>
              <p>We use the information we collect to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Provide and maintain your account and saved projects</li>
                <li>Improve the site based on usage patterns</li>
                <li>Respond to your inquiries if you contact us</li>
              </ul>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Third-Party Services
              </h2>
              <p>Paint Color HQ relies on the following third-party services, each with their own privacy policies:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong className="text-on-surface">Google Analytics:</strong> website usage analytics</li>
                <li><strong className="text-on-surface">Supabase:</strong> authentication and database services</li>
                <li><strong className="text-on-surface">Google OAuth:</strong> sign-in authentication</li>
                <li><strong className="text-on-surface">Cloudflare Turnstile:</strong> spam protection on the contact form</li>
                <li><strong className="text-on-surface">Resend:</strong> delivers contact-form messages</li>
                {MEDIAVINE_ENABLED && (
                  <li><strong className="text-on-surface">Mediavine:</strong> serves the ads on the site (Journey by Mediavine)</li>
                )}
              </ul>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Data Retention
              </h2>
              <p>We retain your account information and project data for as long as your account is active. If you wish to delete your account and associated data, please contact us using the information below. Analytics data is retained according to Google Analytics&apos; default retention settings.</p>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Your Rights
              </h2>
              <p>Depending on your location, you may have the right to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt out of personalized advertising</li>
              </ul>
              <p className="mt-3">To exercise any of these rights, please contact us at the email address below.</p>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Changes to This Policy
              </h2>
              <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. Continued use of the site after changes constitutes acceptance of the updated policy.</p>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Contact Us
              </h2>
              <p>If you have questions about this Privacy Policy or your data, please contact us at{" "}<a href="mailto:privacy@paintcolorhq.com" className="text-primary underline hover:text-primary/80">privacy@paintcolorhq.com</a>.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
