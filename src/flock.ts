// ---------- Config ----------
export const PERCEPTION = 75;   // px, neighbor radius for alignment + cohesion
export const SEP_RADIUS = 20;   // px, personal space
export const MAX_SPEED = 190;   // px/s
export const MIN_SPEED = 40;    // px/s, keeps boids from stalling
export const MAX_FORCE = 300;   // px/s², turning limit
export const FLEE_RADIUS = 120; // px, a bit larger than the cursor hole
export const MARGIN = 75;

export const W_SEP = 1.5;
export const W_ALI = 1.0;
export const W_COH = 0.8;
export const W_FLEE = 3.0;
export const EDGE_K = 5;

// ---------- State ----------
// ax/ay is the steering buffer, written in the first pass and applied in the
// second so every boid reacts to the same frame.
export type Boid = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    ax: number;
    ay: number;
};

export type Flock = {
    boids: Boid[];
    width: number;
    height: number;
};

// Canvas-space cursor position; far off-canvas until the mouse first moves.
export type Cursor = { x: number; y: number };

export function createFlock(count: number, width: number, height: number): Flock {
    const boids: Boid[] = [];
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
        boids.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            ax: 0,
            ay: 0,
        });
    }
    return { boids, width, height };
}

// ---------- Step ----------
// Advance the flock by dt seconds. Called once per frame by boids.ts, which
// only reads each boid's x/y/vx/vy afterwards to draw each boid pointing along its
// velocity.

function steer(b: Boid, dx: number, dy: number, weight: number) {
    let len = Math.hypot(dx, dy);
    if (len > 0) {
        dx = dx/len * MAX_SPEED
        dy = dy/len * MAX_SPEED
    } else {
        return
    }
    dx -= b.vx
    dy -= b.vy
    len = Math.hypot(dx, dy);
    if (len > MAX_FORCE) {
        dx = dx/len * MAX_FORCE
        dy = dy/len * MAX_FORCE
    }
    b.ax += weight * dx
    b.ay += weight * dy
}

// Blended flocking direction for the boid being steered. Each rule adds its
// unit direction times its weight, so rules that disagree cancel here and
// the result goes through steer() once, instead of each rule subtracting
// the velocity and braking the boid.
let wantX = 0
let wantY = 0

function want(dx: number, dy: number, weight: number) {
    const len = Math.hypot(dx, dy)
    if (len === 0) return
    wantX += dx/len * weight
    wantY += dy/len * weight
}

function move(b: Boid, dt: number) {
    b.vx += b.ax * dt
    b.vy += b.ay * dt
    const speed = Math.hypot(b.vx, b.vy)
    if (speed > MAX_SPEED) {
        b.vx = b.vx/speed * MAX_SPEED
        b.vy = b.vy/speed * MAX_SPEED
    } else if (speed < MIN_SPEED && speed > 0) {
        b.vx = b.vx/speed * MIN_SPEED
        b.vy = b.vy/speed * MIN_SPEED
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
}

export function stepFlock(f: Flock, dt: number, cursor: Cursor) {
    for (const b of f.boids) {
        let count = 0
        let vxtot = 0
        let vytot = 0
        let pxtot = 0
        let pytot = 0
        let sepx = 0
        let sepy = 0
        for (const other of f.boids) {
            if (other === b) continue;
            const dx = other.x - b.x
            const dy = other.y - b.y
            const d2 = dx**2 + dy**2
            if (d2 < PERCEPTION**2) {
                count ++
                vxtot += other.vx
                vytot += other.vy
                pxtot += other.x
                pytot += other.y
            }
            if (d2 < SEP_RADIUS**2 && d2 > 0) {
                sepx -= dx/d2
                sepy -= dy/d2
            }
        }
        b.ax = 0
        b.ay = 0
        wantX = 0
        wantY = 0
        if (count > 0) {
            const alx = vxtot/count
            const aly = vytot/count
            const cohx = pxtot/count - b.x
            const cohy = pytot/count - b.y
            want(alx, aly, W_ALI)
            want(cohx, cohy, W_COH)
        }
        want(sepx, sepy, W_SEP)
        steer(b, wantX, wantY, 1)
        // Flee stays its own steer so it can override the flock rather than
        // being averaged away by it.
        let dx = b.x - cursor.x
        let dy = b.y - cursor.y
        if (dx**2 + dy**2 < FLEE_RADIUS**2) steer(b, dx, dy, W_FLEE);
        dx = 0
        dy = 0
        if (b.x < MARGIN) dx = MARGIN - b.x
        else if (b.x > f.width - MARGIN) dx -= b.x - (f.width - MARGIN)
        if (b.y < MARGIN) dy = MARGIN - b.y
        else if (b.y > f.height - MARGIN) dy -= b.y - (f.height - MARGIN)
        b.ax += EDGE_K * dx
        b.ay += EDGE_K * dy
    }

    for (const b of f.boids) {
        move(b, dt)
    }
}
