import { punchHole, updateButtonDarkness, getCursorCanvasPos } from './cursor';
import { createFlock, stepFlock } from './flock';

// ---------- Canvas ----------
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

// Same constraint as the maze: pale in light, dark in dark, so the title and
// nav stay legible wherever the flock drifts.
const LIGHT: Palette = {
    boid: "rgb(196, 196, 196)",
};

const DARK: Palette = {
    boid: "#5d5950",
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

    // Every pin goes into one path with a single fill, same batching idea as
    // the maze walls.
    ctx.fillStyle = COLOR.boid;
    ctx.beginPath();
    for (const { x, y, vx, vy } of flock.boids) {
        const angle = Math.atan2(vy, vx);
        const hx = Math.cos(angle), hy = Math.sin(angle);
        ctx.moveTo(x + hx * pinTip, y + hy * pinTip);
        // arc() first draws a straight side from the tip to the tangent
        // point, then sweeps the long way round the back of the head.
        ctx.arc(x - hx * pinBack, y - hy * pinBack, pinRadius,
            angle + pinSpread, angle - pinSpread);
        ctx.closePath();
    }
    ctx.fill();

    punchHole(ctx);
    updateButtonDarkness();
}

// ---------- Scroll fade ----------
// Mirrors maze.ts: CSS scroll-driven animation where supported, per-frame JS
// fallback elsewhere.
const cssScrollFade =
    typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()");

function scrollFade(): number {
    return Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.75));
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

    stepFlock(flock, dt, getCursorCanvasPos());
    updateScrollFade();
    // Fully faded out: skip rendering, keep simulating.
    if (scrollFade() > 0) draw();
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
