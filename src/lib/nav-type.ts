// nav_type for page_view_enriched and blog_read: "full" for the page the
// document was loaded on, "soft" for every page reached by client-side
// navigation after it (60-70% of page views on this site). Pure so it can be
// tested (nav-type.test.ts); TrackPage keeps one state object per document.

export interface NavTypeState {
  landingPath: string | null;
  leftLanding: boolean;
}

export function navTypeFor(state: NavTypeState, path: string): "full" | "soft" {
  if (state.landingPath === null) {
    state.landingPath = path;
    return "full";
  }
  if (path !== state.landingPath) state.leftLanding = true;
  return state.leftLanding ? "soft" : "full";
}
