import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

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
            <p className="text-sm text-outline">Effective date: February 2025</p>
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
                <li><strong className="text-on-surface">Cookies:</strong> We use cookies for authentication sessions, analytics, and advertising. See the Cookies section below for details.</li>
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
                <li><strong className="text-on-surface">Advertising cookies:</strong> We use Google AdSense to display advertisements. Google and its partners may use cookies to serve ads based on your prior visits to this site or other websites. You can opt out of personalized advertising by visiting{" "}<a href="https://www.google.com/settings/ads" className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                How We Use Your Information
              </h2>
              <p>We use the information we collect to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Provide and maintain your account and saved projects</li>
                <li>Improve the site based on usage patterns</li>
                <li>Display relevant advertisements through Google AdSense</li>
                <li>Respond to your inquiries if you contact us</li>
              </ul>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Third-Party Services
              </h2>
              <p>Paint Color HQ relies on the following third-party services, each with their own privacy policies:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><strong className="text-on-surface">Google Analytics</strong> &mdash; website usage analytics</li>
                <li><strong className="text-on-surface">Google AdSense</strong> &mdash; advertising</li>
                <li><strong className="text-on-surface">Supabase</strong> &mdash; authentication and database services</li>
                <li><strong className="text-on-surface">Google OAuth</strong> &mdash; sign-in authentication</li>
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
