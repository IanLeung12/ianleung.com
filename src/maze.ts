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
const gridWidth = cols * cellSize;
const gridHeight = rows * cellSize;
const offsetX = Math.floor((width - gridWidth) / 2);
const offsetY = Math.floor((height - gridHeight) / 2);

const N = 1, E = 2, S = 4, W = 8;
const DIRS: number[][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

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
const start = 0;
const end = rows * cols - 1;
const algo: "dfs" | "bfs"  | "astar" = 
    (["dfs", "bfs", "astar"] as const)[(Math.random() * 3) | 0];
const stack: number[] = [];
const queue: number[] = [];
const visited = new Uint8Array(cols * rows).fill(0);
const parent = new Int32Array(cols * rows).fill(-1);
const path: number[] = [];
const heapq = new HeapQueue<number>();
const gscore = new Int32Array(cols * rows).fill(cols * rows + 1);
const closed = new Uint8Array(cols * rows).fill(0);
heapq.push(start, heuristic(0, 0));
gscore[start] = 0;
visited[start] = 1; 

// ---------- Config ----------
const stepsPerFrame = 3;

// ---------- Helpers ----------
function randCell(): number {
    return Math.floor(Math.random() * rows) * cols + Math.floor(Math.random() * cols);
}

// ---------- Build (Wilson's) ----------
function step(c: number): number {
    const x = c % cols;
    const y = (c / cols) | 0;
    while (true) {
        const [dx, dy] = DIRS[(Math.random() * 4) | 0];
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            return ny * cols + nx;
        }
    }
}

function fill(walk: number[]) {
    for (let i = 0; i < walk.length - 1; i++) {
        const x1 = walk[i] % cols;
        const y1 = Math.floor(walk[i] / cols);
        const x2 = walk[i + 1] % cols;
        const y2 = Math.floor(walk[i + 1] / cols);
        if (maze[walk[i]] === -1) maze[walk[i]] = 0;
        if (maze[walk[i + 1]] === -1) maze[walk[i + 1]] = 0;
        if (x2 === x1) {
            maze[y1 * cols + x1] |= (y2 > y1 ? S : N);
            maze[y2 * cols + x2] |= (y2 > y1 ? N : S);
        } else {
            maze[y1 * cols + x1] |= (x2 > x1 ? E : W);
            maze[y2 * cols + x2] |= (x2 > x1 ? W : E);
        }
        remaining--;
    }
}

function buildStep() {
    if (state === "choosing") {
        current = randCell();
        while (maze[current] !== -1) current = randCell();
        walk.push(current);
        walkIndex.set(current, walk.length - 1);
        state = "walking";
        return;
    }
    let next: number;
    if ((next = step(current)) !== -1) {
        current = next;
        if (walkIndex.has(current)) {
            const idx = walkIndex.get(current)!;
            for (let i = idx + 1; i < walk.length; i++) {
                walkIndex.delete(walk[i]);
            }
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
}


function heuristic(x: number, y: number): number {
    return Math.abs(x - cols + 1) + Math.abs(y - rows + 1);
}

// ---------- Pathfind ----------
function pathStep() {
    if (algo === "dfs") {
        if (current === end) return;
        current = stack.length > 0 ? stack.pop()! : start;
        for (let i = 3; i >= 0; i--) {
            const next = current + DIRS[i][0] + DIRS[i][1] * cols;
            if (maze[current] & (1 << i) && !visited[next]) {
                stack.push(next);
                visited[next] = 1;
                parent[next] = current;
            }
        }
    } else if (algo === "bfs") {
        if (current === end) return;
        current = queue.length > 0 ? queue.shift()! : start;
        for (let i = 3; i >= 0; i--) {
            const next = current + DIRS[i][0] + DIRS[i][1] * cols;
            if (maze[current] & (1 << i) && !visited[next]) {
                queue.push(next);
                visited[next] = 1;
                parent[next] = current;
            }
        }
    } else if (algo === "astar") {
        current = heapq.pop()!;
        if (closed[current]) return;
        closed[current] = 1;
        if (current === end) return;

        for (let i = 3; i >= 0; i--) {
            const next = current + DIRS[i][0] + DIRS[i][1] * cols;
            if (maze[current] & (1 << i) && !closed[next]) {
                const tempg = gscore[current] + 1;
                if (tempg < gscore[next]) {
                    parent[next] = current;
                    gscore[next] = tempg;
                    const hscore = heuristic(next % cols, Math.floor(next / cols));
                    heapq.push(next, gscore[next] + hscore);
                }
            }
        }
    }
    return;
}

// ---------- Render ----------
function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgb(190, 190, 190)";
    ctx.lineWidth = 2;

    ctx.fillStyle = "#fdfca1";
    for (const c of walk) {
        const x = c % cols;
        const y = Math.floor(c / cols);
        ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
    }
    if (current !== -1) {
        ctx.fillStyle = "#95ff95";
        const x = current % cols;
        const y = Math.floor(current / cols);
        ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
    }

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const c = maze[y * cols + x];
            const px = x * cellSize + offsetX;
            const py = y * cellSize + offsetY;
            if (c !== -1) {
                ctx.fillStyle = "#f5f4f0";
                ctx.fillRect(px, py, cellSize, cellSize);
            }
            if ((c & N) === 0) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + cellSize, py); ctx.stroke(); }
            if ((c & E) === 0) { ctx.beginPath(); ctx.moveTo(px + cellSize, py); ctx.lineTo(px + cellSize, py + cellSize); ctx.stroke(); }
            if ((c & S) === 0) { ctx.beginPath(); ctx.moveTo(px, py + cellSize); ctx.lineTo(px + cellSize, py + cellSize); ctx.stroke(); }
            if ((c & W) === 0) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + cellSize); ctx.stroke(); }

            if (algo === "bfs" && remaining === 0 && visited[y * cols + x]) {
                ctx.fillStyle = "#f5e3cf";
                ctx.beginPath();
                ctx.roundRect(px + 4, py + 4, cellSize - 8, cellSize - 8, 6);
                ctx.fill();
            }
        }
    }

    if (parent[end] !== -1) {
        ctx.fillStyle = "#c5f8c5";
        let temp = end;
        while (temp !== -1) {
            const x = temp % cols;
            const y = Math.floor(temp / cols);
            const px = x * cellSize + offsetX;
            const py = y * cellSize + offsetY;
            ctx.beginPath();
            ctx.roundRect(px + 4, py + 4, cellSize - 8, cellSize - 8, 6);
            ctx.fill();
            temp = parent[temp];
        }
    } else if ((algo === "astar" || algo === "dfs") && parent[current] !== -1) {
        ctx.fillStyle = algo === "astar" ? "#c5eef8" : "#fdcdcd";
        let temp = current;
        while (temp !== -1) {
            const x = temp % cols;
            const y = Math.floor(temp / cols);
            const px = x * cellSize + offsetX;
            const py = y * cellSize + offsetY;
            ctx.beginPath();
            ctx.roundRect(px + 4, py + 4, cellSize - 8, cellSize - 8, 6);
            ctx.fill();
            temp = parent[temp];
        }
    }

    punchHole(ctx);
    updateButtonDarkness();
}

// ---------- Main loop ----------
function animate() {
    if (remaining > 0) {
        let steps = 0;
        while (steps < stepsPerFrame && remaining > 0) {
            buildStep();
            steps++;
        }
    } else {
        pathStep();
    }
    draw();
    requestAnimationFrame(animate);
}

animate();
