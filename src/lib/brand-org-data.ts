// Brand-page facts: the hero "Est. / HQ" line, the "Visit [brand]" link and
// the Organization JSON-LD url. `npx tsx scripts/check-retailer-links.ts --org`
// checks every url here for dead links and off-site redirects.
export const BRAND_ORG_DATA: Record<string, { foundingDate?: string; headquarters?: string; url?: string; sameAs?: string[] }> = {
  "sherwin-williams": { foundingDate: "1866", headquarters: "Cleveland, Ohio, USA", url: "https://www.sherwin-williams.com", sameAs: ["https://en.wikipedia.org/wiki/Sherwin-Williams"] },
  "benjamin-moore": { foundingDate: "1883", headquarters: "Montvale, New Jersey, USA", url: "https://www.benjaminmoore.com", sameAs: ["https://en.wikipedia.org/wiki/Benjamin_Moore_%26_Co."] },
  behr: { headquarters: "Santa Ana, California, USA", url: "https://www.behr.com", sameAs: ["https://en.wikipedia.org/wiki/Behr_Paint"] },
  ppg: { foundingDate: "1883", headquarters: "Pittsburgh, Pennsylvania, USA", url: "https://www.pittsburghpaints.com", sameAs: ["https://en.wikipedia.org/wiki/PPG_Industries"] },
  valspar: { headquarters: "Minneapolis, Minnesota, USA", url: "https://www.valspar.com", sameAs: ["https://en.wikipedia.org/wiki/Valspar"] },
  "dunn-edwards": { foundingDate: "1925", headquarters: "Los Angeles, California, USA", url: "https://www.dunnedwards.com" },
  "farrow-ball": { foundingDate: "1946", headquarters: "Dorset, England, UK", url: "https://www.farrow-ball.com", sameAs: ["https://en.wikipedia.org/wiki/Farrow_%26_Ball"] },
  kilz: { foundingDate: "1954", url: "https://www.kilz.com" },
  "vista-paint": { foundingDate: "1956", headquarters: "Fullerton, California, USA", url: "https://www.vistapaint.com" },
  hirshfields: { headquarters: "Minneapolis, Minnesota, USA", url: "https://www.hirshfields.com" },
  // No url: colorhousepaint.com 301s to an unrelated content site (verified
  // 2026-10-23), so the page shows no "Visit" link and the schema no url.
  colorhouse: { foundingDate: "2005", headquarters: "Portland, Oregon, USA" },
  "dutch-boy": { foundingDate: "1907", url: "https://www.dutchboy.com" },
  ral: { foundingDate: "1927", headquarters: "Bonn, Germany", url: "https://www.ral-farben.de" },
};
