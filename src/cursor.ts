let cursorX = -9999;
let cursorY = -9999;
const holeRadius = 70;
const cursorLagMs = 120;
const idleDelayMs = 200;
const idleShrinkMs = 800;
const radiusInMs = 80;
const radiusOutMs = 420;
const idleMinRadius = 32;

let smoothX = cursorX;
let smoothY = cursorY;
let lastMoveTime = 0;
let lastFrameTime = 0;
let currentRadius = holeRadius;

const buttons = Array.from(document.querySelectorAll(".nav-btn")) as HTMLElement[];
const maxDistPadding = 20; // bigger = wider influence
const minOpacity = 0.55; // lowest opacity near cursor

document.addEventListener("mousemove", (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    lastMoveTime = performance.now();
});

function updateCursorState() {
  const now = performance.now();
  if (lastFrameTime === 0) lastFrameTime = now;
  const dt = now - lastFrameTime;
  lastFrameTime = now;

  if (smoothX === -9999 || smoothY === -9999) {
    smoothX = cursorX;
    smoothY = cursorY;
  }

  const k = 1 - Math.exp(-dt / cursorLagMs);
  smoothX += (cursorX - smoothX) * k;
  smoothY += (cursorY - smoothY) * k;

  const idleMs = lastMoveTime === 0 ? 0 : now - lastMoveTime;
  let idleT = (idleMs - idleDelayMs) / idleShrinkMs;
  idleT = Math.max(0, Math.min(1, idleT));
  idleT = idleT * idleT * (3 - 2 * idleT);
  const targetRadius = holeRadius - (holeRadius - idleMinRadius) * idleT;
  const radiusTau = targetRadius >= currentRadius ? radiusInMs : radiusOutMs;
  const rk = 1 - Math.exp(-dt / radiusTau);
  currentRadius += (targetRadius - currentRadius) * rk;

  return { x: smoothX, y: smoothY, radius: currentRadius };
}

export function punchHole(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
  const { x: cx, y: cy, radius } = updateCursorState();
  const dotSpacing = 10;
  const maxDotRadius = 4;
  const minDotRadius = 0.8;
  const fadeRadius = radius;

  const startX = Math.floor((cx - fadeRadius) / dotSpacing) * dotSpacing;
  const endX = Math.ceil((cx + fadeRadius) / dotSpacing) * dotSpacing;
  const startY = Math.floor((cy - fadeRadius) / dotSpacing) * dotSpacing;
  const endY = Math.ceil((cy + fadeRadius) / dotSpacing) * dotSpacing;

  for (let gy = startY; gy <= endY; gy += dotSpacing) {
    for (let gx = startX; gx <= endX; gx += dotSpacing) {
      const dx = gx - cx;
      const dy = gy - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > fadeRadius) continue;

      let t = 1 - dist / fadeRadius;
      t = Math.max(0, Math.min(1, t));
      t = t * t * (3 - 2 * t); // smoothstep

      const r = minDotRadius + (maxDotRadius - minDotRadius) * t;
      const alpha = 0.1 + 0.8 * t;

      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
    ctx.restore();
}

export function updateButtonDarkness() {
  const { x, y, radius } = updateCursorState();
  const maxDist = radius + maxDistPadding;
  for (const el of buttons) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const dx = cx - x;
    const dy = cy - y;
    const dist = Math.hypot(dx, dy);

    const t = Math.max(0, Math.min(1, 1 - dist / maxDist));
    const opacity = minOpacity + (1 - minOpacity) * t;
    el.style.opacity = `${opacity}`;
  }
}
