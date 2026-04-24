import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact — Report Issues & Ask Questions",
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
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-24 px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Contact</span>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
              Have a question, found incorrect color data, or want to suggest a
              feature? We&apos;d love to hear from you.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-12 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 sm:p-8">
              <ContactForm />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6">
                <h2 className="font-headline text-sm font-bold text-on-surface">
                  Color Data Issues
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Noticed a color that looks wrong or a missing color number?
                  Select &ldquo;Color Data Issue&rdquo; in the form above and
                  include the color name, brand, and what looks incorrect.
                </p>
              </div>
              <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6">
                <h2 className="font-headline text-sm font-bold text-on-surface">
                  Privacy & Data Requests
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  For account data or deletion requests, see our{" "}
                  <Link href="/privacy" className="text-primary underline hover:text-primary/80">
                    Privacy Policy
                  </Link>{" "}
                  or select &ldquo;Privacy & Data Request&rdquo; above.
                </p>
              </div>
            </div>

            <p className="mt-8 text-sm text-outline">
              We typically respond within 1–2 business days.
            </p>
          </div>
        </section>
      </main>
      <AdSenseScript />
      <Footer />
    </div>
  );
}
