const canvas = document.getElementById('maze') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d')!;

var width: number = canvas.width;
var height: number = canvas.height;
const N: number = 1, E: number = 2, S: number = 4, W: number = 8;

var cellSize: number = 40;
var cols: number = Math.floor(width / cellSize);
var rows: number = Math.floor(height / cellSize);
var maze = new Int16Array(cols * rows).fill(-1)

function randCell(): number {
    return Math.floor(Math.random() * rows) * cols + Math.floor(Math.random() * cols);
}
var current: number = Math.floor(rows / 2) * cols + Math.floor(cols / 2);;
maze[current] = 0;
var remaining: number = cols * rows - 1;

var walk: number[] = [];
var walkIndex: Map<number,number> = new Map();

let state: "choosing" | "walking" = "choosing";
const stepsPerFrame = 3;
const DIRS: number[][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];


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
            maze[y1* cols + x1] |= (y2 > y1 ? S : N);
            maze[y2* cols + x2] |= (y2 > y1 ? N : S);
        } else {
            maze[y1* cols + x1] |= (x2 > x1 ? E : W);
            maze[y2* cols + x2] |= (x2 > x1 ? W : E);
        }
        remaining--;
    }
}

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
            const px = x * cellSize;
            const py = y * cellSize;
            if (c !== -1) {
                ctx.fillStyle = "#f5f4f0";
                ctx.fillRect(px, py, cellSize, cellSize);
            }

            if ((c & N) === 0) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + cellSize, py); ctx.stroke(); }
            if ((c & E) === 0) { ctx.beginPath(); ctx.moveTo(px + cellSize, py); ctx.lineTo(px + cellSize, py + cellSize); ctx.stroke(); }
            if ((c & S) === 0) { ctx.beginPath(); ctx.moveTo(px, py + cellSize); ctx.lineTo(px + cellSize, py + cellSize); ctx.stroke(); }
            if ((c & W) === 0) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + cellSize); ctx.stroke(); }
        }
    }
}

function printMaze() { // for debugging
    let out = '+' + '---+'.repeat(cols) + '\n';
    for (let y = 0; y < rows; y++) {
        let top = '|';
        let bot = '+';
        for (let x = 0; x < cols; x++) {
            const c = maze[y * cols + x];
            top += '   ' + ((c & E) ? ' ' : '|');
            bot += ((c & S) ? '   ' : '---') + '+';
        }
        out += top + '\n' + bot + '\n';
    }
    console.log(out);
}

function animStep() {
    if (state === "choosing") {
        current = randCell();
        while (maze[current] !== -1) current = randCell();
        walk.push(current);
        walkIndex.set(current, walk.length - 1);
        state = "walking";
        return;
    } else {
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
        return;
    }
}

function animate() {
    let steps = 0;
    if (remaining > 0) {
        while (steps < stepsPerFrame && remaining > 0) {
            animStep();
            steps++;
        }
        draw();
        requestAnimationFrame(animate);
    } else if (current !== -1) {
        current = -1;
        draw();
    }
}

animate();