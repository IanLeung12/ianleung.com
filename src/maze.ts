var width: number = window.innerWidth;
var height: number = window.innerHeight;
type Cell = [number, number]
const N: number = 1, E: number = 2, S: number = 4, W: number = 8;

var cellSize: number = 20;
var cols: number = Math.floor(width / cellSize);
var rows: number = Math.floor(height / cellSize);
var maze = Array.from({ length: rows }, () =>
  Array.from({ length: cols }, () => -1)
);

var current: Cell = [Math.floor(Math.random() * cols), Math.floor(Math.random() * rows)];;
maze[current[1]][current[0]] = 0;
var remaining: number = cols * rows - 1;

var visited: Set<number> = new Set();
var walk: Cell[] = [];

const key = (x: number, y: number) => y * cols + x;

const DIRS: Cell[] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

function step(current: Cell): boolean {
    const [x, y] = current;
    const options: Cell[] = [];
    for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            options.push([nx, ny]);
        }
    }
    if (options.length === 0) return false;
    const [nx, ny] = options[Math.floor(Math.random() * options.length)];
    current[0] = nx;
    current[1] = ny;
    return true;
}
function fill(walk: Cell[]) {
    for (let i = 0; i < walk.length - 1; i++) {
        const [x1, y1] = walk[i];
        const [x2, y2] = walk[i + 1];
        if (maze[y1][x1] === -1) maze[y1][x1] = 0;
        if (maze[y2][x2] === -1) maze[y2][x2] = 0;
        if (x2 === x1) {
            maze[y1][x1] |= (y2 > y1 ? S : N);
            maze[y2][x2] |= (y2 > y1 ? N : S);
        } else {
            maze[y1][x1] |= (x2 > x1 ? E : W);
            maze[y2][x2] |= (x2 > x1 ? W : E);
        }
        remaining--;
    }
}
function printMaze() {
    let out = '+' + '---+'.repeat(cols) + '\n';
    for (let y = 0; y < rows; y++) {
        let top = '|';
        let bot = '+';
        for (let x = 0; x < cols; x++) {
            const c = maze[y][x];
            top += '   ' + ((c & E) ? ' ' : '|');
            bot += ((c & S) ? '   ' : '---') + '+';
        }
        out += top + '\n' + bot + '\n';
    }
    console.log(out);
}

while (remaining > 0) {
    current = [Math.floor(Math.random() * cols), Math.floor(Math.random() * rows)];
    while (maze[current[1]][current[0]] !== -1) {
        current = [Math.floor(Math.random() * cols), Math.floor(Math.random() * rows)];
    }
    walk.push([current[0], current[1]]);
    visited.add(key(current[0], current[1]));
    while (step(current)) {
        if (visited.has(key(current[0], current[1]))) {
            let idx = walk.findIndex(([x, y]) => x === current[0] && y === current[1]);
            walk = walk.slice(0, idx + 1);
            visited = new Set(walk.map(([x, y]) => key(x, y)));
        } else {
            walk.push([current[0], current[1]]);
            visited.add(key(current[0], current[1]));
            if (maze[current[1]][current[0]] !== -1) {
                fill(walk);
                walk = [];
                visited = new Set();
                break;
            }
        }
    }
}
console.log(maze);
printMaze();