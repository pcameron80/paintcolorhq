// AdSense removed 2026-10. The account was rejected, the loader still cost
// 205-375 KB on every page that rendered this, and Journey by Mediavine (the
// ad path now) requires being the only ad provider on the page. This renders
// nothing so the 25 importing pages stay byte-identical in this change;
// deleting the component and those imports rides a later PR.
export function AdSenseScript() {
  return null;
}
