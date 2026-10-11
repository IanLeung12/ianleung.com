// Hover-word image popover for the about section.
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

  function reposition(): void {
    if (!activeWord) return;
    if (canHover) positionAtPoint(lastX, lastY);
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
      word.addEventListener('pointerleave', () => {
        // Don't hide while the word is keyboard-focused (focus and hover would fight).
        if (document.activeElement !== word) hide();
      });
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
