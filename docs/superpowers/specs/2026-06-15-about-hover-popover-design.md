# About-page hover-word image popover — Design

**Date:** 2026-06-15
**Status:** Approved pending spec review

## Summary

Add a feature to the About page where certain words are marked as interactive. When
the visitor reveals a marked word, a small floating popover shows an image and an
optional short caption. The look is sleek and minimal, matching the site's existing
black-on-white aesthetic. On desktop the popover **follows the cursor**; on touch
devices it is **tap-to-toggle**.

This work delivers the **mechanism only**. Real words, images, and captions are added
later by Ian using the authoring API below. A single placeholder word + placeholder
image ship so the feature is visibly working end-to-end.

## Goals

- A reusable, declarative way to mark any word/phrase on the About page as a reveal trigger.
- A single, minimal floating popover: bare rounded image, hairline edge, soft shadow,
  optional caption beneath.
- Cursor-following reveal on desktop; tap-to-toggle on touch; keyboard-accessible.
- No new runtime dependencies. Matches the site's existing vanilla-TS-per-page pattern.

## Non-goals

- Real content (words, images, captions) — Ian adds these later via the `data-*` API.
- Reusing the feature on other pages — written generically, but only wired into About for now.
- Dimming/receding the rest of the page text (explicitly declined — only the hovered word reacts).
- A full lightbox/modal — this is a lightweight inline preview, not the existing project modal.

## Approach

Vanilla TypeScript module + CSS, loaded by the About page — the same pattern the site
already uses (`src/maze.ts` on home, `src/projects/grid.ts` on projects). Cursor-following
requires JS regardless, and this keeps the About page free of a React/bundler island for a
single small delight.

Considered and rejected:
- **React + Framer Motion island** — overkill; the About page is plain HTML and this would
  pull in a bundle for one feature.
- **Pure CSS `:hover`** — cannot track the pointer (no cursor-following), no lazy-load, weak
  touch/edge handling.

## Authoring API

A marked word is a `<span>` with class `reveal` and data attributes:

```html
<!-- image only -->
<span class="reveal" data-img="/images/cider.jpg">Cider</span>

<!-- image + caption -->
<span class="reveal" data-img="/images/cider.jpg" data-caption="Cider, 2024">Cider</span>
```

- `data-img` (required) — path to the image. `/images/...` resolves to `public/images/`.
- `data-caption` (optional) — short caption text. Omitted → image-only popover.

To start, exactly one demo span is added to the existing About text (the word **"Cider"**),
pointing at a placeholder image (`/images/placeholder.svg`) with a placeholder caption, so the
interaction is visible immediately. Ian later edits/duplicates this pattern for real words.

## Components

### `src/about/reveal.ts` (new)

A single self-initializing module. Responsibilities:

1. **Init** — query all `.reveal` elements on the page. If none, do nothing. Create one shared
   popover element (`div.reveal-popover` containing an `<img>` and a caption `<span>`) and append
   it to `<body>`. The popover is reused for every word — only one is ever visible.
2. **Mode detection** — `matchMedia('(hover: hover) and (pointer: fine)')` decides behavior:
   - **Hover/fine pointer (desktop):** `pointerenter` shows + positions at cursor; `pointermove`
     repositions (throttled via `requestAnimationFrame`); `pointerleave` hides.
   - **Coarse/no-hover (touch):** `click` on a word toggles the popover (anchored to the word, not
     the cursor); a tap elsewhere or a scroll dismisses it.
3. **Show** — read `data-img` / `data-caption` from the target. Set the image `src` on first reveal
   only (lazy-load); toggle the caption element's visibility/text based on `data-caption`. Add a
   `visible` class to trigger the CSS transition.
4. **Position (desktop, cursor-following)** — place the popover at cursor `+ (16, 16)` by default.
   Measure its rect; if it would overflow the right edge, flip to the left of the cursor; if it
   would overflow the bottom, flip above. Clamp to an 8px viewport margin so it never clips.
5. **Position (touch, anchored)** — center horizontally over the word, above it by default, flipping
   below if there isn't room; clamp horizontally to the viewport.
6. **Hide** — remove the `visible` class.
7. **Accessibility** — each `.reveal` gets `tabindex="0"` so it is keyboard-focusable; `focus` shows
   the popover (anchored), `blur` hides it, `Escape` dismisses. The popover `<img>` carries `alt`
   text derived from the caption (or a generic fallback) so the content is announced. Honors
   `prefers-reduced-motion` (handled in CSS).

The module is written generically (operates on any `.reveal` on the page) but is only loaded by About.

### `public/style.css` (appended)

- `.reveal` — the word at rest: a **subtle solid underline** (`text-decoration` / `border-bottom`
  in a muted gray, ~1px), `cursor: pointer`. On `:hover`/`:focus`, color goes to full `--fg`.
  Uses existing tokens (`--muted`, `--fg`, `--border`).
- `.reveal-popover` — `position: fixed`, bare image styling: `border-radius` ~12px, 1px hairline
  border (`rgba(0,0,0,.06)`), soft layered shadow, fixed width (~260px) with auto height from the
  image's natural aspect (sensible `max-height`). `pointer-events: none` so it never interferes
  with hit-testing. Hidden by default (opacity 0, slight scale/translate); `.visible` fades + scales
  in over ~150ms ease-out.
- `.reveal-popover .reveal-caption` — small (~11–12px) `--muted` text beneath the image, centered;
  hidden when empty.
- `@media (prefers-reduced-motion: reduce)` — drop the scale/translate; plain opacity fade only.

### `src/about/index.html` (edited)

- Wrap one existing word (**"Cider"**) in the demo `.reveal` span (image + caption).
- Add `<script type="module" src="./reveal.ts"></script>` before `</body>`.

## Data flow

```
About page HTML (.reveal spans with data-img/data-caption)
        │  (on load)
        ▼
reveal.ts init → collects .reveal nodes, builds one shared .reveal-popover in <body>
        │
   pointer/touch/focus event on a .reveal
        ▼
read data-img/data-caption → set img src (once) + caption → add .visible → position
        │
   pointermove (desktop) → reposition near cursor, clamp/flip at edges
        │
   leave / outside tap / scroll / Esc / blur → remove .visible
```

## Edge cases & error handling

- **Missing `data-img`** — skip showing the popover (no broken image); the word still renders normally.
- **Image fails to load** — popover still appears; the `<img>` simply shows nothing. (Acceptable for a
  decorative preview; no error UI.)
- **Viewport edges** — flip + clamp logic keeps the popover fully on-screen.
- **Rapid word-to-word movement** — single shared popover is repositioned; image `src` only changes
  when the source differs, avoiding reflow flicker.
- **Scroll while open (touch)** — dismiss to avoid a detached, mispositioned popover.
- **No `.reveal` elements** — module no-ops.

## Testing / verification

Manual verification via `npm run dev`:
- Desktop: hovering "Cider" fades in the popover following the cursor; it flips/clamps near
  window edges; leaving hides it.
- Caption: present for the demo word; a word without `data-caption` shows image only.
- Touch (devtools device emulation): tap toggles; tap-away / scroll dismisses.
- Keyboard: Tab focuses "Cider" → popover shows; `Esc` / blur hides.
- `prefers-reduced-motion`: no scale/translate, fade only.
- `npm run lint` passes; `npm run build` succeeds (about entry builds).

## Files

| File | Change |
|------|--------|
| `src/about/reveal.ts` | New — the popover module |
| `public/style.css` | Append `.reveal` + `.reveal-popover` styles |
| `src/about/index.html` | Add demo `.reveal` span + `<script>` tag |
| `public/images/placeholder.svg` | New — neutral placeholder image for the demo word |
