# CODEX Visual Report

## Scope

- Target: `apps/mandarin` visual/layout polish only.
- Data and quiz logic were not changed.
- Git commands were not run in this pass, per CF instruction.

## Changes

- `apps/mandarin/src/styles/tokens.css:33`
  - Added semantic surface/border tokens for success, danger, warning, highlight, voice warning, footer text, and light-status text.
  - Before: repeated status colors were scattered across component CSS.
  - After: most status and panel colors can be referenced through shared tokens. A few literal colors remain where existing regression tests explicitly assert them.

- `apps/mandarin/src/styles/base.css:13`
  - Fixed the broken `background-image` declaration and restored a quiet dotted paper texture.
  - Added `overflow-x: clip` and `width: 100%` on `.container`.
  - Added mobile container padding at `max-width: 640px`.
  - Before: the background image declaration was invalid and offered no real texture.
  - After: the base surface renders consistently and has a guard against page-level horizontal overflow.

- `apps/mandarin/src/styles/components.css:226`
  - Changed `.card-grid` to `minmax(min(240px, 100%), 1fr)`.
  - Before: fixed minimum grid widths could contribute to narrow-screen overflow.
  - After: homepage/grade/lesson card grids can shrink to the viewport.

- `apps/mandarin/src/styles/components.css:376`
  - Changed `.module-grid` to `minmax(min(260px, 100%), 1fr)`.
  - Added a 900-1180px rule at `apps/mandarin/src/styles/components.css:1498` to keep module grids balanced as two columns on iPad-like widths.
  - Before: module cards could feel uneven at tablet width and risk squeezing on mobile.
  - After: 375px stacks safely; 1024px gets a stable two-column dashboard.

- `apps/mandarin/src/styles/components.css:833`
  - Moved the voice warning banner to shared voice-warning tokens.
  - Before: warning surface and border used hard-coded colors.
  - After: the banner matches the token system.

- `apps/mandarin/src/styles/components.css:856`
  - Added `overflow-wrap: anywhere` to `.quiz-panel`.
  - Kept regression-locked reading feedback colors at `apps/mandarin/src/styles/components.css:925`.
  - Strengthened `.hint-panel` at `apps/mandarin/src/styles/components.css:989` with a left warning rail and tokenized warning surface.
  - Before: hints were readable but visually close to ordinary muted panels.
  - After: hints are clearer without overpowering the main task.

- `apps/mandarin/src/styles/components.css:1138`
  - Added minimum touch height and safe wrapping to sentence chips.
  - Kept regression-locked sentence feedback colors at `apps/mandarin/src/styles/components.css:1177`.
  - Before: long chips had fewer wrapping safeguards.
  - After: chips retain >=44px touch targets and avoid forcing horizontal expansion.

- `apps/mandarin/src/styles/components.css:1396`
  - Added mobile rules for task banner, quiz title row, app header, lesson hero, details summaries, cards, action buttons, segmented controls, and extension links.
  - Before: several compact layouts depended on flex wrapping without explicit mobile hierarchy.
  - After: at 375px, primary content stacks with clearer one-task-at-a-time structure.

- `apps/mandarin/src/styles/components.css:3106`
  - Changed lesson-card grid minimum to `minmax(min(300px, 100%), 1fr)`.
  - Before: lesson cards were optimized for wider grids but could exceed very narrow viewports.
  - After: lesson cards preserve the 300px target where possible and shrink safely on mobile.

- `apps/mandarin/src/styles/components.css:3140`
  - Added an inset border to `.evidence` and spacing under the evidence label.
  - Moved marked evidence highlight to shared highlight tokens.
  - Before: evidence panels were usable but visually close to other muted panels.
  - After: evidence panels are more distinct while still subordinate to the question.

## Validation

Passed:

- `cd apps/mandarin && npm run validate`
- `cd apps/mandarin && npm run build && npm run check-dist`
- `cd apps/mandarin && for f in scripts/test-*.mjs; do node "$f" || exit 1; done`

Notes:

- `vite build` still reports the existing warning that `CharacterStoryPage.js` is both dynamically and statically imported. Build succeeds.
- Regression tests require literal `#000`, `#e4f3ea`, `#fbe9e7`, `#b9e6c8`, and `#f7c6c2` in specific feedback rules. Those were preserved.

## Browser / Screenshot Check

- Attempted to start dev server with `npm run dev -- --host 127.0.0.1`.
- Result: blocked by sandbox with `listen EPERM: operation not permitted 127.0.0.1:5173`.
- Checked local automation packages: `playwright` and `puppeteer` are not installed.
- In-app Browser control was not available because the required Node REPL browser-control tool was not exposed in this environment.

Screenshot paths:

- None generated. No files were written to `/tmp` because a browser session could not be started.

Manual viewport verification status:

- 375px and 1024px visual screenshots were not completed due to the dev-server/browser limitation above.
- Static responsive safeguards were added for those breakpoints, and build/tests passed.

## Unresolved

- A real browser pass is still needed outside this sandbox to visually confirm 375px and 1024px screenshots across homepage, grade page, lesson dashboard, activity pages, reading evidence panels, text map, walkthrough cards, and teacher page.
- No `HANDOFF.md` update, commit, or push was performed; Claude owns those steps per CF instruction.
