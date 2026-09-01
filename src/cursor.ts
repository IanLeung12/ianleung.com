let cursorX = -9999;
let cursorY = -9999;
const holeRadius = 70;
const idleDelayMs = 200;
const idleShrinkMs = 800;
const radiusInMs = 80;
const radiusOutMs = 420;
const idleMinRadius = 32;
const trailMax = 14;
const trailMaxAgeMs = 250;
const trailMinRadiusScale = 0.35;
const trailMaxRadiusScale = 0.85;

let lastMoveTime = 0;
let lastFrameTime = 0;
let currentRadius = holeRadius;
const trail: Array<{ x: number; y: number; time: number }> = [];

const buttons = Array.from(document.querySelectorAll(".nav-btn")) as HTMLElement[];
const maxDistPadding = 30; // bigger = wider influence
const minOpacity = 0.55; // lowest opacity near cursor

document.addEventListener("mousemove", (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    lastMoveTime = performance.now();
  trail.push({ x: cursorX, y: cursorY, time: lastMoveTime });
  if (trail.length > trailMax) trail.shift();
});

function updateCursorState() {
  const now = performance.now();
  if (lastFrameTime === 0) lastFrameTime = now;
  const dt = now - lastFrameTime;
  lastFrameTime = now;

  const idleMs = lastMoveTime === 0 ? 0 : now - lastMoveTime;
  let idleT = (idleMs - idleDelayMs) / idleShrinkMs;
  idleT = Math.max(0, Math.min(1, idleT));
  idleT = idleT * idleT * (3 - 2 * idleT);
  const targetRadius = holeRadius - (holeRadius - idleMinRadius) * idleT;
  const radiusTau = targetRadius >= currentRadius ? radiusInMs : radiusOutMs;
  const rk = 1 - Math.exp(-dt / radiusTau);
  currentRadius += (targetRadius - currentRadius) * rk;

  return { x: cursorX, y: cursorY, radius: currentRadius };
}

export function punchHole(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
  const { x, y, radius } = updateCursorState();
  // Cursor coords are viewport-relative; the canvas scrolls with the page,
  // so map them into canvas space each frame.
  const canvasRect = ctx.canvas.getBoundingClientRect();
  const cx = x - canvasRect.left;
  const cy = y - canvasRect.top;
  const now = performance.now();
  const dotSpacing = 10;
  const maxDotRadius = 4;
  const minDotRadius = 0.8;

  const drawHalftone = (x: number, y: number, fadeRadius: number, alphaScale: number) => {
    const startX = Math.floor((x - fadeRadius) / dotSpacing) * dotSpacing;
    const endX = Math.ceil((x + fadeRadius) / dotSpacing) * dotSpacing;
    const startY = Math.floor((y - fadeRadius) / dotSpacing) * dotSpacing;
    const endY = Math.ceil((y + fadeRadius) / dotSpacing) * dotSpacing;

    for (let gy = startY; gy <= endY; gy += dotSpacing) {
      for (let gx = startX; gx <= endX; gx += dotSpacing) {
        const dx = gx - x;
        const dy = gy - y;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        if (dist > fadeRadius) continue;

        let t = 1 - dist / fadeRadius;
        t = Math.max(0, Math.min(1, t));
        t = t * t * (3 - 2 * t); // smoothstep

        const r = minDotRadius + (maxDotRadius - minDotRadius) * t;
        const alpha = (0.08 + 0.8 * t) * alphaScale;

        if (alpha <= 0) continue;
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(gx, gy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  for (const p of trail) {
    const age = now - p.time;
    if (age > trailMaxAgeMs) continue;
    const t = 1 - age / trailMaxAgeMs;
    const scale = trailMinRadiusScale + (trailMaxRadiusScale - trailMinRadiusScale) * t;
    drawHalftone(p.x - canvasRect.left, p.y - canvasRect.top, radius * scale, t);
  }

  drawHalftone(cx, cy, radius, 1);
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
