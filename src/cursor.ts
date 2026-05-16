let cursorX = -9999;
let cursorY = -9999;
const holeRadius = 80;

const buttons = Array.from(document.querySelectorAll(".nav-btn")) as HTMLElement[];
const maxDist = holeRadius + 20; // bigger = wider influence
const minOpacity = 0.55; // lowest opacity near cursor

document.addEventListener("mousemove", (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
});

export function punchHole(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    const g = ctx.createRadialGradient(
        cursorX, cursorY, holeRadius * 0.4,
        cursorX, cursorY, holeRadius
    );
    g.addColorStop(0, "rgba(0, 0, 0, 0.6)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, holeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

export function updateButtonDarkness() {
  for (const el of buttons) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const dx = cx - cursorX;
    const dy = cy - cursorY;
    const dist = Math.hypot(dx, dy);

    const t = Math.max(0, Math.min(1, 1 - dist / maxDist));
    const opacity = minOpacity + (1 - minOpacity) * t;
    el.style.opacity = `${opacity}`;
  }
}
