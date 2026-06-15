# About-page Hover-Word Image Popover — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an About-page feature where marked words reveal a small floating image popover (with optional caption) — following the cursor on desktop, tap-to-toggle on touch.

**Architecture:** One self-initializing vanilla-TS module (`src/about/reveal.ts`) loaded by the About page, mirroring the site's existing per-page module pattern (`maze.ts`, `grid.ts`). Words are marked declaratively with `<span class="reveal" data-img data-caption>`. A single shared popover element is created in `<body>` and reused for every word. Styling lives in `public/style.css`. No new dependencies.

**Tech Stack:** Vite (root `src`, `publicDir ../public`), TypeScript (transpiled by esbuild — no type-checker in the toolchain), plain CSS with existing design tokens.

**Verification note:** This repo has no test runner and no eslint config file, and the feature is visual/pointer-driven. Each task is verified with `npm run build` (syntax/bundle gate) and a manual browser checklist via `npm run dev` (Task 5). This is an intentional, documented deviation from unit-test TDD — do **not** add a test framework.

---

### Task 1: Placeholder image asset

**Files:**
- Create: `public/images/placeholder.svg`

- [ ] **Step 1: Create the placeholder SVG**

A neutral 260×170 gradient tile with a faint image-icon glyph. This is what the demo word points at until Ian swaps in a real photo.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 170" width="260" height="170" role="img" aria-label="placeholder image">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#dfe7ef"/>
      <stop offset="0.5" stop-color="#c7d2de"/>
      <stop offset="1" stop-color="#aeb9c7"/>
    </linearGradient>
  </defs>
  <rect width="260" height="170" fill="url(#g)"/>
  <g fill="none" stroke="#59697c" stroke-width="2" opacity="0.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="106" y="60" width="48" height="48" rx="4"/>
    <circle cx="120" cy="74" r="4"/>
    <path d="M154 96l-14-14-34 26"/>
  </g>
</svg>
```

- [ ] **Step 2: Commit**

```bash
git add public/images/placeholder.svg
git commit -m "feat: add placeholder image for about-page reveal popover"
```

---

### Task 2: Popover styles

**Files:**
- Modify: `public/style.css` (append a new section at the end of the file)

- [ ] **Step 1: Append the reveal styles**

Append this block to the very end of `public/style.css`. It reuses existing tokens (`--muted`, `--fg`, `--surface`, `--space-2`). The word gets a quiet solid underline that darkens on hover/focus; the popover is a bare rounded image with a hairline edge, soft shadow, optional caption, and a 150ms fade+scale entrance that collapses to a plain fade under reduced-motion.

```css
/* ----------------------------------
 * About — hover-word image popover
 * ---------------------------------- */
.reveal {
  border-bottom: 1px solid var(--muted);
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.reveal:hover,
.reveal:focus-visible {
  color: var(--fg);
  border-color: var(--fg);
  outline: none;
}

.reveal-popover {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  width: 260px;
  pointer-events: none;
  opacity: 0;
  transform: translateY(6px) scale(0.96);
  transform-origin: center bottom;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.reveal-popover.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.reveal-popover img {
  display: block;
  width: 100%;
  height: auto; /* preserve the image's natural aspect ratio */
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: var(--surface);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.1), 0 26px 60px rgba(0, 0, 0, 0.18);
}

.reveal-caption {
  display: block;
  margin-top: var(--space-2);
  text-align: center;
  font-size: 0.72rem;
  color: var(--muted);
  line-height: 1.4;
}

@media (prefers-reduced-motion: reduce) {
  .reveal-popover {
    transform: none;
    transition: opacity 0.15s ease;
  }
  .reveal-popover.visible {
    transform: none;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add public/style.css
git commit -m "feat: add styles for about-page reveal popover"
```

---

### Task 3: The reveal module

**Files:**
- Create: `src/about/reveal.ts`

- [ ] **Step 1: Write the full module**

Create `src/about/reveal.ts` with exactly this content. It: collects `.reveal` words, builds one shared popover, detects hover-vs-touch via `matchMedia`, follows the cursor on desktop (coalesced with `requestAnimationFrame`, flipping/clamping at viewport edges), anchors to the word on touch/keyboard, lazy-loads each image once, shows/hides the optional caption, repositions when a late-loading image changes the popover height, and wires keyboard (focus/blur/`Escape`) plus outside-tap/scroll dismissal on touch.

```ts
// src/about/reveal.ts
// Hover-word image popover for the About page.
//
// Mark a word in the HTML like:
//   <span class="reveal" data-img="/images/cider.jpg" data-caption="Cider, 2024">Cider</span>
// data-img is required; data-caption is optional (omit -> image only).
//
// Desktop (hover + fine pointer): popover follows the cursor.
// Touch: tap a word to toggle; tap elsewhere or scroll to dismiss.
// Keyboard: focus a word to show it, Escape (or blur) to hide.

const OFFSET = 16; // gap between the cursor/word and the popover
const MARGIN = 8; // minimum gap from the viewport edge

function init(): void {
  const words = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
  if (words.length === 0) return;

  // Build the single shared popover, reused by every word.
  const popover = document.createElement('div');
  popover.className = 'reveal-popover';
  const img = document.createElement('img');
  img.alt = '';
  img.decoding = 'async';
  const caption = document.createElement('span');
  caption.className = 'reveal-caption';
  popover.append(img, caption);
  document.body.appendChild(popover);

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let activeWord: HTMLElement | null = null;
  let currentSrc = '';
  let lastX = 0;
  let lastY = 0;
  let rafId = 0;

  function loadFrom(word: HTMLElement): boolean {
    const src = word.dataset.img;
    if (!src) return false;
    if (src !== currentSrc) {
      img.src = src;
      currentSrc = src;
    }
    const cap = word.dataset.caption ?? '';
    caption.textContent = cap;
    caption.style.display = cap ? '' : 'none';
    img.alt = cap || 'preview image';
    return true;
  }

  function positionAtPoint(x: number, y: number): void {
    const rect = popover.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = x + OFFSET;
    let top = y + OFFSET;

    if (left + rect.width > vw - MARGIN) left = x - OFFSET - rect.width;
    if (top + rect.height > vh - MARGIN) top = y - OFFSET - rect.height;

    left = Math.max(MARGIN, Math.min(left, vw - MARGIN - rect.width));
    top = Math.max(MARGIN, Math.min(top, vh - MARGIN - rect.height));

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  }

  function positionAtWord(word: HTMLElement): void {
    const wr = word.getBoundingClientRect();
    const rect = popover.getBoundingClientRect();
    const vw = window.innerWidth;

    let left = wr.left + wr.width / 2 - rect.width / 2;
    left = Math.max(MARGIN, Math.min(left, vw - MARGIN - rect.width));

    let top = wr.top - OFFSET - rect.height; // above the word by default
    if (top < MARGIN) top = wr.bottom + OFFSET; // flip below if no room above

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  }

  function reposition(): void {
    if (!activeWord) return;
    if (canHover) positionAtPoint(lastX, lastY);
    else positionAtWord(activeWord);
  }

  function show(word: HTMLElement): void {
    if (!loadFrom(word)) return;
    activeWord = word;
    popover.classList.add('visible');
  }

  function hide(): void {
    activeWord = null;
    popover.classList.remove('visible');
  }

  // A late-loading image changes the popover's height; re-anchor when it does.
  img.addEventListener('load', reposition);

  function onPointerMove(e: PointerEvent): void {
    if (!activeWord) return;
    lastX = e.clientX;
    lastY = e.clientY;
    if (rafId) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      positionAtPoint(lastX, lastY);
    });
  }

  words.forEach((word) => {
    word.setAttribute('tabindex', '0');

    if (canHover) {
      word.addEventListener('pointerenter', (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
        show(word);
        positionAtPoint(lastX, lastY);
      });
      word.addEventListener('pointermove', onPointerMove);
      word.addEventListener('pointerleave', hide);
    } else {
      word.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeWord === word) {
          hide();
        } else {
          show(word);
          positionAtWord(word);
        }
      });
    }

    // Keyboard support on every device.
    word.addEventListener('focus', () => {
      show(word);
      positionAtWord(word);
    });
    word.addEventListener('blur', hide);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeWord) {
      activeWord.blur();
      hide();
    }
  });

  if (!canHover) {
    document.addEventListener('click', () => {
      if (activeWord) hide();
    });
    window.addEventListener(
      'scroll',
      () => {
        if (activeWord) hide();
      },
      { passive: true },
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

- [ ] **Step 2: Verify it builds (catches syntax/bundle errors)**

The module isn't referenced by any HTML entry yet, so build just confirms the project still compiles. (Wiring + the real build gate happen in Tasks 4–5.)

Run: `npm run build`
Expected: build completes with no errors; `../dist` is produced.

- [ ] **Step 3: Commit**

```bash
git add src/about/reveal.ts
git commit -m "feat: add reveal popover module for about page"
```

---

### Task 4: Wire the feature into the About page

**Files:**
- Modify: `src/about/index.html`

- [ ] **Step 1: Mark the demo word**

In `src/about/index.html`, find this line (the cats bullet, ~line 42):

```html
            <li>I have 2 cats named Cider and Geline</li>
```

Replace it with (wraps "Cider" as the demo trigger):

```html
            <li>I have 2 cats named <span class="reveal" data-img="/images/placeholder.svg" data-caption="placeholder caption — swap me out">Cider</span> and Geline</li>
```

- [ ] **Step 2: Load the module**

In the same file, find the closing of `<main>` and the body end (~lines 49–50):

```html
    </main>
  </body>
```

Replace with (adds the module script, mirroring how `projects/index.html` loads `./grid.ts`):

```html
    </main>
    <script type="module" src="./reveal.ts"></script>
  </body>
```

- [ ] **Step 3: Verify it builds**

Run: `npm run build`
Expected: build completes with no errors; the `about` entry bundles `reveal.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/about/index.html
git commit -m "feat: wire reveal popover into about page with placeholder word"
```

---

### Task 5: End-to-end manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Vite prints a Local URL (e.g. `http://localhost:5173`). Open `/about/`.

- [ ] **Step 2: Desktop checklist**

Confirm each:
- The word **"Cider"** shows a quiet solid underline at rest; it darkens on hover.
- Hovering "Cider" fades in the popover (placeholder image + caption) near the cursor.
- Moving the cursor over the word makes the popover **follow** smoothly.
- Hovering near the **right edge** / **bottom edge** of the window flips the popover so it never clips off-screen.
- Moving the cursor off the word hides the popover.

- [ ] **Step 3: Caption-optional check**

Temporarily remove `data-caption="..."` from the "Cider" span and reload. Expected: popover shows the **image only**, no caption row. Restore the attribute afterward.

- [ ] **Step 4: Touch checklist (DevTools device emulation)**

Toggle device toolbar (emulate a phone) and reload `/about/`:
- **Tap** "Cider" → popover appears anchored above (or below near the top).
- **Tap "Cider" again** or **tap elsewhere** → it dismisses.
- **Scroll** while open → it dismisses.

- [ ] **Step 5: Keyboard + reduced-motion checklist**

- Press **Tab** until "Cider" is focused → popover shows; press **Esc** → it hides.
- In DevTools, emulate `prefers-reduced-motion: reduce`, reload, hover "Cider" → popover **fades** in with no scale/slide.

- [ ] **Step 6: Final confirmation**

Stop the dev server. All checks pass → the mechanism is complete. Ian can now add real words by duplicating the `<span class="reveal" data-img="..." data-caption="...">` pattern and dropping images into `public/images/`.

(No code changed in this task, so no commit unless a fix was needed during verification.)

---

## Done criteria

- `npm run build` succeeds.
- All Task 5 manual checks pass on desktop, touch emulation, and keyboard.
- Adding a new reveal word requires only HTML (`data-img` / optional `data-caption`) — no JS changes.
