export interface Faq {
  q: string;
  a: string;
}

/**
 * A tool page's FAQ, rendered as visible text and as FAQPage JSON-LD from the
 * same list, so the markup always matches what readers see. Search engines
 * expect FAQ markup to be visible, and AI answer engines quote the page text.
 * `hidden` lists questions the page already answers in its own copy: they stay
 * in the JSON-LD but are not printed twice.
 */
export function ToolFaq({
  title,
  faqs,
  hidden = [],
}: {
  title: string;
  faqs: Faq[];
  hidden?: string[];
}) {
  const visible = faqs.filter((f) => !hidden.includes(f.q));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section className="py-16 px-6 md:px-12">
      {/* Static, server-generated content only */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto">
        <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">
          {title}
        </h2>
        <dl className="space-y-6 text-on-surface-variant leading-relaxed">
          {visible.map((f) => (
            <div key={f.q}>
              <dt className="font-headline text-lg font-bold text-on-surface">{f.q}</dt>
              <dd className="mt-2">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
