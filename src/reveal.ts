// Hover-word image popover for the about section.
//
// Mark a word in the HTML like:
//   <span class="reveal" data-img="/images/cider.jpg" data-caption="Cider, 2024">Cider</span>
// data-img is required; data-caption is optional (omit -> image only).
//
// Desktop (hover + fine pointer): popover follows the cursor; click to pin it.
// Touch: tap a word to pin it; tap it again or tap elsewhere to dismiss.
// Pinned popovers stay put (scrolling with their word) until dismissed.
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
  const placeholder = document.createElement('div');
  placeholder.className = 'reveal-placeholder';
  placeholder.setAttribute('aria-hidden', 'true');
  const caption = document.createElement('span');
  caption.className = 'reveal-caption';
  popover.append(img, placeholder, caption);
  document.body.appendChild(popover);

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let activeWord: HTMLElement | null = null;
  let currentSrc = ''; // src currently committed to the on-DOM img
  let loadToken = 0; // monotonic; only the latest request may commit
  let lastX = 0;
  let lastY = 0;
  let rafId = 0;

  function applyCaption(word: HTMLElement): void {
    const cap = word.dataset.caption ?? '';
    caption.textContent = cap;
    caption.style.display = cap ? '' : 'none';
    img.alt = cap || 'preview image';
  }

  // Swap the popover's image+caption. The new image is decoded off-DOM; while
  // it's in flight the popover shows a skeleton placeholder (never the previous
  // word's image). Already-cached images commit synchronously so they don't
  // flash the placeholder. Rapid switches bump loadToken so a slow load that
  // resolves late can't overwrite a newer one.
  function loadFrom(word: HTMLElement): void {
    const src = word.dataset.img;
    if (!src) return;
    if (src === currentSrc) {
      applyCaption(word);
      reposition();
      return;
    }

    const myToken = ++loadToken;
    const pre = new Image();
    pre.decoding = 'async';
    pre.src = src;

    const commit = (): void => {
      if (myToken !== loadToken || activeWord !== word) return; // superseded / hidden
      img.src = src;
      currentSrc = src;
      popover.classList.remove('loading');
      applyCaption(word);
      reposition(); // popover height changed with the new image
    };

    if (pre.complete && pre.naturalWidth > 0) {
      commit(); // in memory cache: swap immediately, no placeholder flash
      return;
    }

    // Not ready yet: drop the stale image and show the placeholder meanwhile.
    currentSrc = '';
    popover.classList.add('loading');
    applyCaption(word);
    reposition();

    if (typeof pre.decode === 'function') {
      pre.decode().then(commit).catch(() => {
        if (pre.complete && pre.naturalWidth > 0) commit();
        else {
          pre.addEventListener('load', commit, { once: true });
          pre.addEventListener('error', () => {}, { once: true }); // keep placeholder on failure
        }
      });
    } else {
      pre.addEventListener('load', commit, { once: true });
    }
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
    const vh = window.innerHeight;

    let left = wr.left + wr.width / 2 - rect.width / 2;
    left = Math.max(MARGIN, Math.min(left, vw - MARGIN - rect.width));

    let top = wr.top - OFFSET - rect.height; // above the word by default
    if (top < MARGIN) top = wr.bottom + OFFSET; // flip below if no room above
    top = Math.max(MARGIN, Math.min(top, vh - MARGIN - rect.height)); // keep fully on-screen

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  }

  // Click (or tap) pins a word's popover directly above the word (below if
  // there's no room). It stops following the cursor, ignores hovering other
  // words, scrolls along with the word, and becomes interactive so the image
  // can be right-clicked, dragged or saved and the caption selected. It stays
  // until the same word is clicked again, something else is clicked, or
  // Escape is pressed.
  let pinned: HTMLElement | null = null;
  let pinBelow = false;

  function placePinned(): void {
    if (!pinned) return;
    const wr = pinned.getBoundingClientRect();
    const rect = popover.getBoundingClientRect();
    const vw = window.innerWidth;
    let left = wr.left + wr.width / 2 - rect.width / 2;
    left = Math.max(MARGIN, Math.min(left, vw - MARGIN - rect.width));
    // Recomputed from the live height so it stays anchored after the image
    // finishes loading; the side is fixed at pin time so it doesn't flip
    // mid-scroll.
    const top = pinBelow ? wr.bottom + OFFSET / 2 : wr.top - OFFSET / 2 - rect.height;
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  }

  function reposition(): void {
    if (!activeWord) return;
    if (pinned === activeWord) placePinned();
    else if (canHover) positionAtPoint(lastX, lastY);
    else positionAtWord(activeWord);
  }

  function show(word: HTMLElement): void {
    if (!word.dataset.img) return;
    activeWord = word;
    popover.classList.add('visible'); // frame appears immediately; content swaps on decode
    loadFrom(word);
  }

  function hide(): void {
    activeWord = null;
    loadToken++; // invalidate any in-flight load so it can't commit after we hide
    popover.classList.remove('visible');
  }

  function pin(word: HTMLElement): void {
    if (pinned && pinned !== word) pinned.classList.remove('pinned');
    if (activeWord !== word) show(word);
    pinned = word;
    word.classList.add('pinned');
    popover.classList.add('pinned');
    const wr = word.getBoundingClientRect();
    pinBelow = wr.top - OFFSET / 2 - popover.getBoundingClientRect().height < MARGIN;
    placePinned();
  }

  function unpin(): void {
    pinned?.classList.remove('pinned');
    popover.classList.remove('pinned');
    pinned = null;
  }

  // Focus from a mouse click or tap shouldn't open/move anything (the click
  // handler owns that); only keyboard focus shows the popover by itself.
  function isKeyboardFocus(word: HTMLElement): boolean {
    try {
      return word.matches(':focus-visible');
    } catch {
      return true;
    }
  }

  function onPointerMove(e: PointerEvent): void {
    if (!activeWord || pinned) return;
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
        if (pinned) return;
        lastX = e.clientX;
        lastY = e.clientY;
        show(word);
        positionAtPoint(lastX, lastY);
      });
      word.addEventListener('pointermove', onPointerMove);
      word.addEventListener('pointerleave', () => {
        if (pinned) return;
        // Don't hide while the word is keyboard-focused (focus and hover would fight).
        if (document.activeElement === word && isKeyboardFocus(word)) return;
        hide();
      });
    }

    word.addEventListener('click', (e) => {
      e.stopPropagation();
      if (canHover) {
        lastX = e.clientX;
        lastY = e.clientY;
      }
      if (pinned === word) {
        unpin();
        // Still under the cursor on desktop: drop back to the normal hover preview.
        if (canHover) positionAtPoint(lastX, lastY);
        else hide();
      } else {
        pin(word);
      }
    });

    // Keyboard support on every device.
    word.addEventListener('focus', () => {
      if (pinned || !isKeyboardFocus(word)) return;
      show(word);
      positionAtWord(word);
    });
    word.addEventListener('blur', () => {
      if (pinned || activeWord !== word) return;
      if (canHover && word.matches(':hover')) return;
      hide();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeWord) {
      activeWord.blur();
      unpin();
      hide();
    }
  });

  // Safety net for the hover preview: some browsers fire pointerleave around
  // the click itself, so after unpinning the word's own pointerleave may
  // never come. Any movement off the word closes an unpinned preview.
  if (canHover) {
    document.addEventListener('pointermove', (e) => {
      if (pinned || !activeWord) return;
      if (activeWord.contains(e.target as Node)) return;
      if (document.activeElement === activeWord && isKeyboardFocus(activeWord)) return;
      hide();
    }, { passive: true });
  }

  // Clicking anywhere that isn't a photo word (those stop propagation) unpins.
  document.addEventListener('click', (e) => {
    // Clicks on the pinned popover itself (selecting, saving) keep it open.
    if (popover.contains(e.target as Node)) return;
    if (pinned) {
      unpin();
      hide();
    } else if (!canHover && activeWord) {
      hide();
    }
  });

  let scrollRaf = 0;
  window.addEventListener(
    'scroll',
    () => {
      if (pinned) {
        if (scrollRaf) return;
        scrollRaf = window.requestAnimationFrame(() => {
          scrollRaf = 0;
          placePinned();
        });
      } else if (!canHover && activeWord) {
        hide();
      }
    },
    { passive: true },
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
