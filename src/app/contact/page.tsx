import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { ContactForm } from "@/components/contact-form";
import { urbanist } from "@/lib/redesign-font";
import "../redesign.css";

export const metadata: Metadata = {
  title: "Contact: Report Issues & Ask Questions",
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
    <div className={`flex min-h-screen flex-col bg-surface ${urbanist.variable}`}>
      <Header />
      <main id="main-content" className="flex-1 pch-page">
        <section className="pch-pagehead">
          <div className="wrap pch-wrap">
            <span className="pch-eyebrow">Contact</span>
            <h1 style={{ maxWidth: "none" }}>Contact Us</h1>
            <p className="pch-pagehead__lead" style={{ marginTop: "var(--s-4)" }}>
              Have a question, found incorrect color data, or want to suggest a
              feature? We&apos;d love to hear from you.
            </p>
          </div>
        </section>

        <section className="pch-block pch-block--surface" style={{ paddingTop: "var(--s-7)" }}>
          <div className="wrap pch-wrap pch-split">
            <div className="pch-card pch-form" style={{ gridColumn: "1 / span 7", padding: "var(--s-6)", background: "var(--bg)" }}>
              <ContactForm />
            </div>

            <div style={{ gridColumn: "9 / span 4", display: "grid", gap: "var(--s-4)", alignContent: "start" }}>
              <div className="pch-card" style={{ background: "var(--bg)" }}>
                <h2 style={{ fontSize: 20 }}>Color Data Issues</h2>
                <p>
                  Noticed a color that looks wrong or a missing color number?
                  Select &ldquo;Color Data Issue&rdquo; in the form above and
                  include the color name, brand, and what looks incorrect.
                </p>
              </div>
              <div className="pch-card" style={{ background: "var(--bg)" }}>
                <h2 style={{ fontSize: 20 }}>Privacy &amp; Data Requests</h2>
                <p>
                  For account data or deletion requests, see our{" "}
                  <Link href="/privacy" className="pch-text-link">Privacy Policy</Link>{" "}
                  or select &ldquo;Privacy &amp; Data Request&rdquo; above.
                </p>
              </div>
              <div className="pch-note" style={{ display: "grid", gap: "var(--s-2)" }}>
                <p>
                  Prefer email? Write to{" "}
                  <a href="mailto:support@paintcolorhq.com" className="pch-text-link">support@paintcolorhq.com</a>
                  . Paint Color HQ is run by{" "}
                  <Link href="/about" className="pch-text-link">Philip Cameron</Link>
                  .
                </p>
                <p>We typically respond within 1–2 business days.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <AdSenseScript />
      <Footer />
    </div>
  );
}
