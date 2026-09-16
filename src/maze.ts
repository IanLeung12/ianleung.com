import { punchHole, updateButtonDarkness } from './cursor';
import { HeapQueue } from './heapqueue';

// ---------- Canvas ----------
const canvas = document.getElementById('maze') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d')!;
const width = canvas.width;
const height = canvas.height;

// ---------- Grid ----------
const cellSize = 40;
const cols = Math.floor(width / cellSize);
const rows = Math.floor(height / cellSize);
const offsetX = Math.floor((width - cols * cellSize) / 2);
const offsetY = Math.floor((height - rows * cellSize) / 2);

const N = 1, E = 2, S = 4, W = 8;
const DIRS: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const NEIGHBOR_OFFSET = DIRS.map(([dx, dy]) => dy * cols + dx);

// ---------- Colors ----------
type Palette = {
    wall: string;
    cell: string;
    walk: string;
    current: string;
    visited: string;
    pathEnd: string;
    pathDfs: string;
    pathAstar: string;
};

// Light keeps the original character but softened to paler tints so the
// home title/nav stay legible where the path crosses under them.
const LIGHT: Palette = {
    wall: "rgb(196, 196, 196)",
    cell: "#f6f5f1",
    walk: "#f0eccb",
    current: "#cfeccf",
    visited: "#f2ebde",
    pathEnd: "#c4e4c4",
    pathDfs: "#ecc8c8",
    pathAstar: "#c8dfec",
};

// Dark is monochrome, kept in the darker range so the cream text always
// dominates (no light "path" colour creeping up near the title).
const DARK: Palette = {
    wall: "#3c372e",
    cell: "#1e1c17",
    walk: "#5d5950",
    current: "#827c70",
    visited: "#29261f",
    pathEnd: "#7c766a",
    pathDfs: "#6f6a5f",
    pathAstar: "#6f6a5f",
};

function paletteForTheme(): Palette {
    return document.documentElement.dataset.theme === "dark" ? DARK : LIGHT;
}

// `let`, not `const`: the render loop reads COLOR every frame, so reassigning
// it on a theme change swaps the maze instantly.
let COLOR: Palette = paletteForTheme();

window.addEventListener("themechange", () => {
    COLOR = paletteForTheme();
    wallCache = null; // colours changed; re-render the static wall layer
});

// ---------- Maze state ----------
const maze = new Int16Array(cols * rows).fill(-1);
let current: number = Math.floor(rows / 2) * cols + Math.floor(cols / 2);
maze[current] = W;
maze[current - 1] = E;
let remaining: number = cols * rows - 2;

// ---------- Wilson build state ----------
let state: "choosing" | "walking" = "choosing";
const walk: number[] = [];
const walkIndex: Map<number, number> = new Map();

// ---------- Pathfind state ----------
type Algo = "dfs" | "bfs" | "astar";
const start = 0;
const end = rows * cols - 1;
const algo: Algo = (["dfs", "bfs", "astar"] as const)[(Math.random() * 3) | 0];

const stack: number[] = [];
const queue: number[] = [];
const visited = new Uint8Array(cols * rows);
const parent = new Int32Array(cols * rows).fill(-1);
const heapq = new HeapQueue<number>();
const gscore = new Int32Array(cols * rows).fill(cols * rows + 1);
const closed = new Uint8Array(cols * rows);

visited[start] = 1;
gscore[start] = 0;

// ---------- Config ----------
const stepsPerFrame = 3;

// ---------- Coord helpers ----------
function cx(c: number) { return c % cols; }
function cy(c: number) { return (c / cols) | 0; }
function px(c: number) { return cx(c) * cellSize + offsetX; }
function py(c: number) { return cy(c) * cellSize + offsetY; }

function heuristic(c: number): number {
    return Math.abs(cx(c) - (cols - 1)) + Math.abs(cy(c) - (rows - 1));
}

heapq.push(start, heuristic(start));

// Iterate cells reachable from c via maze openings
function forEachOpenNeighbor(c: number, cb: (next: number, dir: number) => void) {
    for (let i = 3; i >= 0; i--) {
        if (maze[c] & (1 << i)) cb(c + NEIGHBOR_OFFSET[i], i);
    }
}

function randCell(): number {
    return ((Math.random() * rows) | 0) * cols + ((Math.random() * cols) | 0);
}

// ---------- Build (Wilson's) ----------
function step(c: number): number {
    const x = cx(c), y = cy(c);
    while (true) {
        const [dx, dy] = DIRS[(Math.random() * 4) | 0];
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) return ny * cols + nx;
    }
}

function fill(walk: number[]) {
    for (let i = 0; i < walk.length - 1; i++) {
        const a = walk[i], b = walk[i + 1];
        const ax = cx(a), ay = cy(a), bx = cx(b), by = cy(b);
        if (maze[a] === -1) maze[a] = 0;
        if (maze[b] === -1) maze[b] = 0;
        if (bx === ax) {
            maze[a] |= (by > ay ? S : N);
            maze[b] |= (by > ay ? N : S);
        } else {
            maze[a] |= (bx > ax ? E : W);
            maze[b] |= (bx > ax ? W : E);
        }
        remaining--;
    }
}

function buildStep() {
    if (state === "choosing") {
        do { current = randCell(); } while (maze[current] !== -1);
        walk.push(current);
        walkIndex.set(current, walk.length - 1);
        state = "walking";
        return;
    }
    current = step(current);
    if (walkIndex.has(current)) {
        const idx = walkIndex.get(current)!;
        for (let i = idx + 1; i < walk.length; i++) walkIndex.delete(walk[i]);
        walk.length = idx + 1;
    } else {
        walk.push(current);
        walkIndex.set(current, walk.length - 1);
        if (maze[current] !== -1) {
            fill(walk);
            walk.length = 0;
            walkIndex.clear();
            state = "choosing";
        }
    }
}

// ---------- Pathfind ----------
function pathStep() {
    if (current === end) return;

    if (algo === "dfs") {
        current = stack.length > 0 ? stack.pop()! : start;
        forEachOpenNeighbor(current, (next) => {
            if (!visited[next]) {
                stack.push(next);
                visited[next] = 1;
                parent[next] = current;
            }
        });
    } else if (algo === "bfs") {
        current = queue.length > 0 ? queue.shift()! : start;
        forEachOpenNeighbor(current, (next) => {
            if (!visited[next]) {
                queue.push(next);
                visited[next] = 1;
                parent[next] = current;
            }
        });
    } else {
        if (heapq.isEmpty()) return;
        current = heapq.pop()!;
        if (closed[current]) return;
        closed[current] = 1;
        forEachOpenNeighbor(current, (next) => {
            if (closed[next]) return;
            const tempg = gscore[current] + 1;
            if (tempg < gscore[next]) {
                parent[next] = current;
                gscore[next] = tempg;
                heapq.push(next, tempg + heuristic(next));
            }
        });
    }
}

// ---------- Render ----------
function fillCell(c: number, color: string, inset = 2) {
    ctx.fillStyle = color;
    ctx.fillRect(px(c) + inset, py(c) + inset, cellSize - 2 * inset, cellSize - 2 * inset);
}

function fillRoundCell(c: number, color: string, inset = 4, radius = 6) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(px(c) + inset, py(c) + inset, cellSize - 2 * inset, cellSize - 2 * inset, radius);
    ctx.fill();
}

function tracePath(from: number, color: string) {
    let t = from;
    while (t !== -1) {
        fillRoundCell(t, color);
        t = parent[t];
    }
}

function renderWalls(g: CanvasRenderingContext2D) {
    g.strokeStyle = COLOR.wall;
    g.lineWidth = 2;
    g.fillStyle = COLOR.cell;
    // Fill every carved cell first, then stroke all walls as one path: far
    // fewer draw calls than a beginPath/stroke per wall segment.
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (maze[y * cols + x] !== -1) {
                g.fillRect(x * cellSize + offsetX, y * cellSize + offsetY, cellSize, cellSize);
            }
        }
    }
    g.beginPath();
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const c = maze[y * cols + x];
            const x0 = x * cellSize + offsetX;
            const y0 = y * cellSize + offsetY;
            if ((c & N) === 0) { g.moveTo(x0, y0); g.lineTo(x0 + cellSize, y0); }
            if ((c & E) === 0) { g.moveTo(x0 + cellSize, y0); g.lineTo(x0 + cellSize, y0 + cellSize); }
            if ((c & S) === 0) { g.moveTo(x0, y0 + cellSize); g.lineTo(x0 + cellSize, y0 + cellSize); }
            if ((c & W) === 0) { g.moveTo(x0, y0); g.lineTo(x0, y0 + cellSize); }
        }
    }
    g.stroke();
}

// Once the maze is fully built its walls never change, so render them once to
// an offscreen canvas and blit that each frame instead of re-stroking ~1300
// cells. Keeping the per-frame cost low leaves the main thread free to
// re-rasterize the hero when the user scrolls back up to it.
let wallCache: HTMLCanvasElement | null = null;

function drawWalls() {
    if (remaining > 0) { renderWalls(ctx); return; }
    if (!wallCache) {
        wallCache = document.createElement("canvas");
        wallCache.width = width;
        wallCache.height = height;
        renderWalls(wallCache.getContext("2d")!);
    }
    ctx.drawImage(wallCache, 0, 0);
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    for (const c of walk) fillCell(c, COLOR.walk);
    if (remaining > 0) fillCell(current, COLOR.current);

    drawWalls();

    if (remaining === 0) {
        if (algo === "bfs") {
            for (let i = 0; i < visited.length; i++) {
                if (visited[i]) fillRoundCell(i, COLOR.visited);
            }
        }
        
        const pathColor =
            algo === "astar" ? COLOR.pathAstar :
            algo === "bfs"   ? COLOR.visited   :
                               COLOR.pathDfs;
        if (parent[end] !== -1) tracePath(end, COLOR.pathEnd);
        else if (parent[current] !== -1) tracePath(current, pathColor);
    }

    punchHole(ctx);
    updateButtonDarkness();
}

// ---------- Scroll fade ----------
// The maze belongs to the hero; fade it out quickly once the page scrolls.
// style.css does this with a CSS scroll-driven animation where supported
// (runs on the compositor, zero lag). Only fall back to JS when it isn't,
// and sample scrollY every animation frame rather than on scroll events,
// which fire late and made the maze pop in after scrolling back up.
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
function animate() {
    if (remaining > 0) {
        for (let i = 0; i < stepsPerFrame && remaining > 0; i++) buildStep();
    } else {
        pathStep();
    }
    updateScrollFade();
    // Fully faded out (scrolled past the hero): skip all rendering so the
    // main thread is idle when the user scrolls back and the hero's layers
    // need to be re-rasterized. Simulation keeps ticking so nothing stalls.
    if (scrollFade() > 0) draw();
    requestAnimationFrame(animate);
}

animate();
