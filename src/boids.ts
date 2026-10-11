import { punchHole, getCursorCanvasPos, VIEWPORT_ORIGIN } from './cursor';
import { createFlock, stepFlock } from './flock';

// ---------- Canvas ----------
// position: fixed behind the content below the hero, so canvas space is
// viewport space.
const canvas = document.getElementById('boids') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d')!;
const width = canvas.width;
const height = canvas.height;

// ---------- Config ----------
// Scale the flock with screen area so phones aren't crowded and wide
// monitors aren't empty.
const count = Math.min(300, Math.max(80, Math.round(width * height / 8000)));
// Map-pin shape: a round head trailing behind a point aimed along the
// velocity. pinTip/pinBack are measured from the boid's position.
const pinRadius = 3;
const pinTip = 7.2;   // px ahead of the boid to the point
const pinBack = 2.4;  // px behind the boid to the head's centre
// Angle (from the heading) where the sides leave the head tangentially, so
// the point blends into the circle without a kink.
const pinSpread = Math.acos(pinRadius / (pinTip + pinBack));
// Background tabs pause requestAnimationFrame; clamp the first dt after
// returning so the flock doesn't teleport across the screen.
const maxDt = 0.05;

// ---------- Colors ----------
type Palette = {
    boid: string;
};

// Semi-transparent so overlapping boids build up a stronger tone, keeping a
// single boid subtle behind the section text while dense flocks read clearly.
const LIGHT: Palette = {
    boid: "rgba(110, 108, 102, 0.45)",
};

const DARK: Palette = {
    boid: "rgba(150, 143, 130, 0.45)",
};

function paletteForTheme(): Palette {
    return document.documentElement.dataset.theme === "dark" ? DARK : LIGHT;
}

let COLOR: Palette = paletteForTheme();

window.addEventListener("themechange", () => {
    COLOR = paletteForTheme();
});

// ---------- Flock ----------
const flock = createFlock(count, width, height);

// ---------- Render ----------
function draw() {
    ctx.clearRect(0, 0, width, height);

    // One fill per pin rather than one batched path: a single fill paints
    // each pixel once, so overlapping pins wouldn't stack their alpha.
    ctx.fillStyle = COLOR.boid;
    for (const { x, y, vx, vy } of flock.boids) {
        const angle = Math.atan2(vy, vx);
        const hx = Math.cos(angle), hy = Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(x + hx * pinTip, y + hy * pinTip);
        // arc() first draws a straight side from the tip to the tangent
        // point, then sweeps the long way round the back of the head.
        ctx.arc(x - hx * pinBack, y - hy * pinBack, pinRadius,
            angle + pinSpread, angle - pinSpread);
        ctx.closePath();
        ctx.fill();
    }

    punchHole(ctx, VIEWPORT_ORIGIN);
}

// ---------- Scroll fade ----------
// The reverse of maze.ts: fade in over 50-100vh of scroll as the maze fades
// out. CSS scroll-driven animation where supported, per-frame JS fallback
// elsewhere.
const cssScrollFade =
    typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()");

function scrollFade(): number {
    const vh = window.innerHeight;
    return Math.min(1, Math.max(0, (window.scrollY - vh * 0.5) / (vh * 0.5)));
}

function updateScrollFade() {
    if (cssScrollFade) return;
    canvas.style.opacity = scrollFade().toFixed(3);
}
updateScrollFade();

// ---------- Main loop ----------
let lastTime = performance.now();

function animate(now: number) {
    const dt = Math.min((now - lastTime) / 1000, maxDt);
    lastTime = now;

    stepFlock(flock, dt, getCursorCanvasPos(VIEWPORT_ORIGIN));
    updateScrollFade();
    // Still on the hero (fully transparent): skip rendering, keep simulating
    // so the flock has already formed by the time it's revealed.
    if (scrollFade() > 0) draw();
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
