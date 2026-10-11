// Shared JSON-LD entity identifiers. The @id values must match the ones
// published on https://pcameron.co (relaunched 2026-10-10) so search engines
// merge the founder and the organization into single entities across both
// sites. Philip's father shares his name and owns philipcameron.com, so the
// @id, alternateName and sameAs set are what disambiguate the two people.
// Do not change these strings without changing pcameron.co to match.

export const ORG_ID = "https://paintcolorhq.com/#org";
export const FOUNDER_ID = "https://pcameron.co/#person";

/** Reference to the Paint Color HQ Organization node, for publisher/worksFor/author slots. */
export const ORG_REF = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "Paint Color HQ",
  url: "https://www.paintcolorhq.com",
} as const;

/** The founder Person, for founder/author slots. */
export const FOUNDER_PERSON = {
  "@type": "Person",
  "@id": FOUNDER_ID,
  name: "Philip Cameron",
  alternateName: "Philip A. Cameron",
  url: "https://pcameron.co/",
  jobTitle: "Founder, Paint Color HQ",
  sameAs: ["https://www.linkedin.com/in/philip-a-cameron/", "https://github.com/pcameron80"],
} as const;
