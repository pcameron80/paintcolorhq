import type { Metadata } from "next";
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
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-24 px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Legal</span>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-4">
              Terms of Service
            </h1>
            <p className="text-sm text-outline">Effective date: February 2025</p>
          </div>
        </section>

        <section className="px-6 md:px-12 pb-20">
          <div className="max-w-4xl mx-auto space-y-10 text-on-surface-variant leading-relaxed">
            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Acceptance of Terms
              </h2>
              <p>By accessing or using Paint Color HQ (paintcolorhq.com), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the site.</p>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Service Description
              </h2>
              <p>Paint Color HQ is a free online tool for browsing, comparing, and matching paint colors across multiple brands. We provide color data, cross-brand matching using the Delta E 2000 algorithm, and tools for organizing color palettes and projects.</p>
              <p className="mt-3">Paint Color HQ is a reference tool only. We do not sell paint or any physical products. We are not affiliated with, endorsed by, or sponsored by any paint manufacturer.</p>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Color Accuracy Disclaimer
              </h2>
              <p>Colors displayed on this site are digital approximations and may not exactly match the actual paint color as it appears on a physical surface. Screen settings, lighting conditions, surface texture, and other factors can affect how colors appear.</p>
              <p className="mt-3">Cross-brand color matches are calculated algorithmically and represent the closest available match, not an exact duplicate. Always verify colors with physical paint samples or swatches before purchasing.</p>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                User Accounts and Projects
              </h2>
              <p>You may optionally create an account by signing in with Google. When you do, you can save color projects and palettes to your account. You are responsible for maintaining the security of your account and for all activity that occurs under it.</p>
              <p className="mt-3">We reserve the right to suspend or terminate accounts that violate these terms or are used for abusive purposes.</p>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Intellectual Property
              </h2>
              <p>The Paint Color HQ website, including its design, code, and original content, is owned by Paint Color HQ. Paint color names, codes, and associated data are the property of their respective manufacturers and are used here for informational and reference purposes.</p>
              <p className="mt-3">You may not scrape, reproduce, or redistribute the site&apos;s content or data in bulk without prior written permission.</p>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Limitation of Liability
              </h2>
              <p>Paint Color HQ is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied. We do not guarantee the accuracy, completeness, or reliability of any color data, matches, or information on the site.</p>
              <p className="mt-3">In no event shall Paint Color HQ be liable for any damages arising from the use or inability to use this service, including but not limited to damages from incorrect color matching, paint purchasing decisions, or data loss.</p>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Changes to These Terms
              </h2>
              <p>We may update these Terms of Service from time to time. Changes will be posted on this page with an updated effective date. Your continued use of the site after any changes constitutes acceptance of the new terms.</p>
            </div>

            <div>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
                Contact Us
              </h2>
              <p>If you have questions about these Terms of Service, please contact us at{" "}<a href="mailto:info@paintcolorhq.com" className="text-primary underline hover:text-primary/80">info@paintcolorhq.com</a>.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
