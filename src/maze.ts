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
const DIRS: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const NEIGHBOR_OFFSET = DIRS.map(([dx, dy]) => dy * cols + dx);

// ---------- Colors ----------
const COLOR = {
    wall: "rgb(190, 190, 190)",
    cell: "#f5f4f0",
    walk: "#fdfca1",
    current: "#95ff95",
    visited: "#f5e3cf",
    pathBfs: "#c5f8c5",
    pathDfs: "#fdcdcd",
    pathAstar: "#c5eef8",
} as const;

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
    for (let i = 0; i < 4; i++) {
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

function drawWalls() {
    ctx.strokeStyle = COLOR.wall;
    ctx.lineWidth = 2;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const c = maze[y * cols + x];
            const x0 = x * cellSize + offsetX;
            const y0 = y * cellSize + offsetY;
            if (c !== -1) { ctx.fillStyle = COLOR.cell; ctx.fillRect(x0, y0, cellSize, cellSize); }
            if ((c & N) === 0) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + cellSize, y0); ctx.stroke(); }
            if ((c & E) === 0) { ctx.beginPath(); ctx.moveTo(x0 + cellSize, y0); ctx.lineTo(x0 + cellSize, y0 + cellSize); ctx.stroke(); }
            if ((c & S) === 0) { ctx.beginPath(); ctx.moveTo(x0, y0 + cellSize); ctx.lineTo(x0 + cellSize, y0 + cellSize); ctx.stroke(); }
            if ((c & W) === 0) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + cellSize); ctx.stroke(); }
        }
    }
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
            algo === "bfs"   ? COLOR.pathBfs   :
                               COLOR.pathDfs;
        if (parent[end] !== -1) tracePath(end, pathColor);
        else if (parent[current] !== -1) tracePath(current, pathColor);
    }

    punchHole(ctx);
    updateButtonDarkness();
}

// ---------- Main loop ----------
function animate() {
    if (remaining > 0) {
        for (let i = 0; i < stepsPerFrame && remaining > 0; i++) buildStep();
    } else {
        pathStep();
    }
    draw();
    requestAnimationFrame(animate);
}

animate();
