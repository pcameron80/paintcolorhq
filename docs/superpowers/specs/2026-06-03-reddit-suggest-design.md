# Reddit Digest + "Suggest Response" — Design

**Date:** 2026-06-03
**Status:** approved (design), pending spec review → implementation plan

## Goal

Find Reddit posts where PaintColorHQ can genuinely help, get notified in Discord,
and draft a grounded reply **in the Claude desktop app on Philip's subscription
(no API cost)** — human reviews and posts every reply manually.

## Positioning (why discover-first, not match-first)

`matchmypaintcolor.com` is the #1 incumbent for cross-brand *matching* — a
utilitarian lookup tool (+ Samplize affiliate) with **no room visualizer, no
color-picking help, no discovery**. Competing on "match" terms is their lane and
uphill; our own search data also shows match is low-volume. **PCHQ's edge is what
they lack.** So the Reddit play leads with the high-volume *"help me pick a color"*
intent and answers with PCHQ's real differentiators — **discover → see it on your
wall → find it in an accessible brand** — with cross-brand match as the *closer*,
not the hook.

## Two components

### 1. `paintcolorhq-digest` (Devvit app — the finder/notifier)
- Clone of `~/Documents/GitHub/townbins-digest` (own repo, own Discord webhook).
- **Read-only**: daily cron polls the target subreddits, keyword-matches new
  posts, posts each match to Discord (title, link, sub, matched keyword, snippet).
  Never comments/votes/DMs. The Discord notification is Philip's trigger.
- Installs into the **existing subreddit Philip already moderates** (the TownBins
  one) — the install sub is just the app's home; it polls the targets + posts to
  its own webhook regardless. No new subreddit needed.
- Free infra: Devvit Redis (`paintcolorhq:seen-post-ids` dedup), free cron; only
  secret is the Discord webhook URL (`isSecret: true`).

### 2. Claude Project "PaintColorHQ — Reddit Replies" (the drafter)
- A desktop Claude **Project** (not a sandboxed Artifact — Artifacts can't
  `fetch` the live site due to CSP, which would break grounding). Drafting runs
  on Philip's Claude subscription via the normal app: **no API key, no API cost.**
- Custom instructions encode: PCHQ context, the reply-angle map, the grounding
  rule, voice/guardrails, and output format (below).
- **On-demand**: Philip pastes a thread (URL or text) from the Discord digest;
  Claude drafts a grounded reply; Philip reviews and posts it himself.

## Target subreddits (polled daily)
`HomeImprovement`, `InteriorDesign`, `DIY`, `HomeDecorating`, `centuryhomes`,
`PaintColors`, `Renovations`, `HomeOwners`.
Excluded: r/HouseFlipping (cost-driven), brand-specific subs (too small).

## Keyword lanes + reply-angle map

| Lane | Keywords (substring match on title/body) | Reply angle |
|---|---|---|
| **A. Picking & advice** (primary) | "help me pick", "help choosing", "help me choose", "paint color advice", "paint color suggestions", "paint color recommendations", "paint color ideas", "what color should i paint", "which paint color", "can't decide", "narrow down", **"best paint for"**, **"best paint color for"**, **"best color for"** | Browse family/palettes to explore → **room visualizer** to see it on a wall → find it in an accessible brand. Room phrasings ("best paint for [room]") route to the matching `/blog/best-[room]-paint-colors` guide. |
| **B. See it on the wall** | "what would it look like", "see it on the wall", "visualize paint", "paint visualizer", "preview the color", "mock up" | `/tools/room-visualizer` |
| **C. Find it in a brand / match** (secondary) | "sherwin williams equivalent", "benjamin moore equivalent", "behr equivalent", "valspar equivalent", "dunn edwards equivalent", "ppg equivalent", "dutch boy equivalent", "sw equivalent", "bm equivalent", "paint dupe", "color match", "match this color", "sherwin williams vs benjamin moore", "behr vs sherwin", "sw vs bm" | `/match/[a]/to/[b]` or `/compare` |
| **D. Technical / ID** | "lrv of", "what's the lrv", "undertone of", "what color is this" | `/colors/[brand]/[slug]` (real LRV) or `/tools/color-identifier` |

Excluded by design: bare color names ("agreeable gray") — flags no-help-needed posts.
Noise note: Lane A/C broad terms ("color match", "best color for") will pull some
off-topic posts; it's a digest, so survivable — **tune after a week of real volume**,
don't pre-optimize.

## Claude Project instructions (outline — authored as the implementation deliverable)
- **Identity/context:** what PCHQ is (discover → visualize → find in accessible brand), 23K colors / 14 brands, the tools and routes.
- **Grounding rule (hard):** before citing any LRV / undertone / cross-brand match, **fetch the relevant live `paintcolorhq.com` page** (`/colors/[brand]/[slug]`, `/match/[a]/to/[b]`, family pages) to get the real value. If it can't verify a number, say so and ask Philip to paste it — **never invent a number.**
- **Reply-angle map** (the table above).
- **Voice + guardrails:** lead with the actual answer; value-first; cite specific data; **one** relevant link max; disclose affiliation where the sub requires it; recommend **"skip this one"** when there's no genuine value to add; never "check out PaintColorHQ."
- **Output format:** (1) a ready-to-paste reply, (2) the cited URL, (3) a one-line "why this fits / or skip."

## Workflow loop
Discord notification → open the Claude Project → paste the thread → Claude fetches
the needed color data + drafts a grounded reply → Philip reviews, adds disclosure
if required, posts manually (or skips).

## Guardrails
- Bot is read-only; **every reply is human-posted.**
- Value-first, specific, disclosed, sparing; skip low-value threads.
- Grounding is real (live-page fetch), never hallucinated numbers.
- No `/api/reddit-suggest`, no Anthropic API key, **no API cost** — drafting is on
  Philip's Claude subscription, on-demand.

## Out of scope / parking lot
- **AdSense approval gap** (matchmypaintcolor got approved; PCHQ hasn't) — separate
  workstream; likely tied to indexable content depth. Revisit on its own.
- Auto-drafting inline in the digest (would need an API LLM call / cost) — rejected
  in favor of human-in-the-loop on-subscription drafting.

## Testing
- Digest: `npm run dev` against the modded sub; confirm matches post to Discord.
- Claude Project: dry-run on 3–4 real sample threads (one per lane); confirm it
  fetches the live page and cites the true LRV/match, and that it recommends
  "skip" on a no-value post.

## Implementation deliverables
1. **Claude Project instruction set** — authored as a committed markdown doc Philip
   pastes into a new Project (content, not repo code).
2. **`paintcolorhq-digest`** — `cp -r townbins-digest`, swap subreddits/keywords/
   branding/Discord webhook + SEEN_KEY, install on the existing modded sub,
   `npm run login` + `devvit deploy`. (Separate repo; follows the approved
   `project_pchq-reddit-digest-plan` memory.)
