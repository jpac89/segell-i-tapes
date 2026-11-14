# AGENTS.md — Parlem i Anem

Static website that helps students of a Catalan course find places near their school where they can practise Catalan and get the practice stamp ("segell", CPNL / Voluntariat per la Llengua). Live on GitHub Pages. A school plans to take it over, so every change should be understandable by a non-expert maintainer.

## Language
- Site UI and user-facing copy: **Catalan** (`lang="ca"`).
- Code, comments, commits, docs for developers: English.
- Talking to the owner (João): Brazilian Portuguese, short and direct (he has ADHD): one decision at a time.

## Safety rules
- The site is live. **Never commit to `main`.** Use a branch, and wait for the owner before pushing or opening a PR.
- The repo is public: no secrets, keys, tokens, personal data. Never put them in URLs either.
- No third-party requests at runtime (fonts, analytics, CDNs) unless the owner approves. Target: no cookies, no storage, no trackers.
- Never use `innerHTML` with data. Build DOM with `textContent` / `createElement`. This is a hard requirement before any user-generated content exists.
- Do not bypass TLS errors. Do not collect people's emails or phones from CPNL / VxL pages.
- Do not copy third-party ratings or reviews (Google). Link out instead.
- Licence and terms-of-use questions (CPNL CC BY-NC-SA 3.0 ES, VxL terms, Google Maps terms) are open items for the owner, not for you to decide.

## Stack and conventions
- Plain HTML + CSS + vanilla JS, static hosting, **no build step** unless the owner approves one.
- Target layout: `index.html`, `styles.css`, `app.js`, `data/places.json`, `data/centres.json`, `scripts/` (standalone data builders), `tests/`.
- Data lives in JSON, never inside the logic. Each place has `source`, `sector`, `verifiedAt`, `hoursStatus` (`unknown` | `verified`).
- Opening hours must support day of week, overnight ranges and `24:00`. Test `isOpen`.
- Filters live in the URL query string so a link can be shared.
- Surgical changes: touch only what the task needs; no speculative abstractions; match the existing style.

## UI quality bar
- Mobile first (check 375 px and 1280 px). Body text ≥ 16 px. Tap targets ≥ 44 px (never below 24 px).
- WCAG 2.2 AA: contrast, focus-visible, skip link, labels, live regions for result counts, `prefers-reduced-motion`.
- Honest empty states and "unverified" labels instead of hiding or faking data.

## Verify before saying "done"
1. Serve locally (`python3 -m http.server`) and test at 375 px and 1280 px.
2. Keyboard-only pass.
3. Network panel shows no third-party requests.
4. `node --test` green (once tests exist).
5. State plainly what was not verified.

## Skills (Codex, `~/.agents/skills`)
UI/UX: `design-taste-frontend`, `frontend-design-direction`, `make-interfaces-feel-better`, `web-design-guidelines` (use `reference/web-interface-guidelines.md` offline), `frontend-a11y`, `accessibility`, `accessibility-review`, `ux-copy`.
Code: `karpathy-guidelines`, `coding-standards`, `frontend-patterns`, `codebase-design`, `domain-modeling`, `improve-codebase-architecture`, `i18n-sync`.
Security / privacy: `secure-web-api`, `secure-audit`, `secure-supply-chain`, `security-review`, `gdpr-privacy-by-design`.
Testing: `e2e-testing`, `browser-qa`. Backend later: `database-migrations`, `postgres-patterns`, `api-design`. Scoping: `grilling`.

## Open decisions (ask the owner, do not guess)
Licence for the repo; which of the 27 VxL sectors go in; who maintains place data after the sale; reviews backend (likely Supabase, EU region); whether to keep Google ratings at all.
