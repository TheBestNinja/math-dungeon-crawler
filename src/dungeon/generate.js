/**
 * TinyKeep-style procedural dungeon generator
 * https://www.gamedeveloper.com/programming/procedural-dungeon-generation-algorithm
 *
 * 1. Random rooms in ellipse (normal-ish sizes), grid-snapped
 * 2. Separate overlaps (iterative push-apart)
 * 3. Main rooms above ~1.25 × mean size
 * 4. Delaunay on main centers → graph
 * 5. MST + ~10% extra Delaunay edges for loops
 * 6. H / V / L corridors (≥3 tiles wide); non-main rooms on lines become hallway rooms
 * 7. Rasterize to 2D grid
 */
import { delaunay, triangleEdges } from './delaunay.js';
import { minimumSpanningTree } from './mst.js';

export const CELL = {
  EMPTY: 0,
  FLOOR: 1,
  WALL: 2,
  STAIRS: 3,
};

function randn() {
  // Box–Muller
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function roundm(n, m) {
  return Math.floor((n + m - 1) / m) * m;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function randomPointInEllipse(rw, rh, tile) {
  const t = 2 * Math.PI * Math.random();
  let u = Math.random() + Math.random();
  const r = u > 1 ? 2 - u : u;
  return {
    x: roundm((rw * r * Math.cos(t)) / 2, tile),
    y: roundm((rh * r * Math.sin(t)) / 2, tile),
  };
}

function roomsOverlap(a, b, pad = 1) {
  return !(
    a.x + a.w + pad <= b.x ||
    b.x + b.w + pad <= a.x ||
    a.y + a.h + pad <= b.y ||
    b.y + b.h + pad <= a.y
  );
}

function separateRooms(rooms, tile) {
  const maxIter = 80;
  for (let iter = 0; iter < maxIter; iter++) {
    let moved = false;
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const a = rooms[i];
        const b = rooms[j];
        if (!roomsOverlap(a, b, 3)) continue;
        const acx = a.x + a.w / 2;
        const acy = a.y + a.h / 2;
        const bcx = b.x + b.w / 2;
        const bcy = b.y + b.h / 2;
        let dx = acx - bcx;
        let dy = acy - bcy;
        if (dx === 0 && dy === 0) {
          dx = Math.random() < 0.5 ? 1 : -1;
          dy = Math.random() < 0.5 ? 1 : -1;
        }
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        // Prefer horizontal separation slightly (wider dungeons)
        const push = tile;
        a.x = roundm(a.x + dx * push * 1.15, tile);
        a.y = roundm(a.y + dy * push * 0.85, tile);
        b.x = roundm(b.x - dx * push * 1.15, tile);
        b.y = roundm(b.y - dy * push * 0.85, tile);
        moved = true;
      }
    }
    if (!moved) break;
  }
}

function roomCenter(r) {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function lineHitsRoom(x0, y0, x1, y1, room) {
  // Axis-aligned segment vs AABB (tile space)
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  return !(
    maxX < room.x ||
    minX > room.x + room.w ||
    maxY < room.y ||
    minY > room.y + room.h
  );
}

function carveRect(grid, x0, y0, x1, y1, value) {
  const xa = Math.min(x0, x1);
  const xb = Math.max(x0, x1);
  const ya = Math.min(y0, y1);
  const yb = Math.max(y0, y1);
  for (let y = ya; y <= yb; y++) {
    for (let x = xa; x <= xb; x++) {
      if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
        grid[y][x] = value;
      }
    }
  }
}

/**
 * Carve a corridor at least `half` tiles on each side of the centerline (width = 2*half+1).
 */
function carveCorridorLines(grid, ax, ay, bx, by, half, value) {
  const closeEnough = (roomCoord, otherCoord, size) => {
    // Midpoint test from the article
    const mid = (roomCoord + otherCoord) / 2;
    return mid >= Math.min(roomCoord, otherCoord) && mid <= Math.max(roomCoord, otherCoord);
  };

  // Decide H, V, or L based on centers
  const sameRow = Math.abs(ay - by) <= 1;
  const sameCol = Math.abs(ax - bx) <= 1;

  const paintHV = (x0, y0, x1, y1) => {
    if (y0 === y1) {
      // horizontal: expand vertically
      for (let d = -half; d <= half; d++) {
        carveRect(grid, x0, y0 + d, x1, y0 + d, value);
      }
    } else if (x0 === x1) {
      for (let d = -half; d <= half; d++) {
        carveRect(grid, x0 + d, y0, x0 + d, y1, value);
      }
    }
  };

  if (sameRow || Math.abs(ay - by) < Math.abs(ax - bx) * 0.15) {
    const y = Math.round((ay + by) / 2);
    paintHV(Math.round(ax), y, Math.round(bx), y);
  } else if (sameCol || Math.abs(ax - bx) < Math.abs(ay - by) * 0.15) {
    const x = Math.round((ax + bx) / 2);
    paintHV(x, Math.round(ay), x, Math.round(by));
  } else {
    // L-shape: horizontal then vertical (or reverse at random)
    const axr = Math.round(ax);
    const ayr = Math.round(ay);
    const bxr = Math.round(bx);
    const byr = Math.round(by);
    if (Math.random() < 0.5) {
      paintHV(axr, ayr, bxr, ayr);
      paintHV(bxr, ayr, bxr, byr);
    } else {
      paintHV(axr, ayr, axr, byr);
      paintHV(axr, byr, bxr, byr);
    }
  }
}

export function generateDungeon(opts = {}) {
  const tile = 1; // work in tile units
  const roomCount = opts.roomCount ?? 36;
  const meanW = opts.meanW ?? 8;
  const meanH = opts.meanH ?? 7;
  const stdW = opts.stdW ?? 2.5;
  const stdH = opts.stdH ?? 2.2;
  const ellipseW = opts.ellipseW ?? 50;
  const ellipseH = opts.ellipseH ?? 28;
  const mainScale = opts.mainScale ?? 1.25;
  const loopChance = opts.loopChance ?? 0.12; // ~8–15%
  const corridorHalf = opts.corridorHalf ?? 1; // width 3
  const padding = opts.padding ?? 8;

  // 1. Generate rooms
  const rooms = [];
  for (let i = 0; i < roomCount; i++) {
    let w = roundm(clamp(meanW + randn() * stdW, 4, 16), tile);
    let h = roundm(clamp(meanH + randn() * stdH, 4, 14), tile);
    if (w % 2 === 0) w += 1; // prefer odd for nicer centers
    if (h % 2 === 0) h += 1;
    const p = randomPointInEllipse(ellipseW, ellipseH, tile);
    rooms.push({
      id: i,
      x: p.x - Math.floor(w / 2),
      y: p.y - Math.floor(h / 2),
      w,
      h,
      main: false,
      hallway: false,
    });
  }

  // 2. Separate
  separateRooms(rooms, tile);

  // Normalize to positive coords
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rooms) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.w);
    maxY = Math.max(maxY, r.y + r.h);
  }
  for (const r of rooms) {
    r.x = r.x - minX + padding;
    r.y = r.y - minY + padding;
  }
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;

  // 3. Main rooms
  const avgW = rooms.reduce((s, r) => s + r.w, 0) / rooms.length;
  const avgH = rooms.reduce((s, r) => s + r.h, 0) / rooms.length;
  const mainRooms = rooms.filter((r) => {
    r.main = r.w >= avgW * mainScale && r.h >= avgH * mainScale;
    return r.main;
  });
  // Ensure at least 3 mains
  if (mainRooms.length < 3) {
    const byArea = [...rooms].sort((a, b) => b.w * b.h - a.w * a.h);
    for (let i = 0; i < Math.min(5, byArea.length); i++) {
      byArea[i].main = true;
      if (!mainRooms.includes(byArea[i])) mainRooms.push(byArea[i]);
    }
  }

  // 4. Delaunay
  const centers = mainRooms.map(roomCenter);
  const tris = delaunay(centers);
  let edges = triangleEdges(tris, centers);
  if (edges.length === 0 && mainRooms.length >= 2) {
    // Fallback: connect sequential mains
    edges = [];
    for (let i = 0; i < mainRooms.length - 1; i++) {
      const a = centers[i];
      const b = centers[i + 1];
      edges.push({ a: i, b: i + 1, w: Math.hypot(a.x - b.x, a.y - b.y) });
    }
  }

  // 5. MST + loops
  const mst = minimumSpanningTree(edges, mainRooms.length);
  const mstKeys = new Set(mst.map((e) => `${e.a}:${e.b}`));
  const extra = [];
  for (const e of edges) {
    const key = `${e.a}:${e.b}`;
    if (!mstKeys.has(key) && Math.random() < loopChance) {
      extra.push(e);
    }
  }
  // Guarantee a few loops when possible
  if (extra.length === 0) {
    for (const e of edges) {
      const key = `${e.a}:${e.b}`;
      if (!mstKeys.has(key)) {
        extra.push(e);
        if (extra.length >= Math.max(1, Math.floor(edges.length * 0.1))) break;
      }
    }
  }
  const connections = mst.concat(extra);

  // 6. Hallways — mark hallway rooms that intersect corridor lines, then carve
  const corridorSegs = [];
  for (const e of connections) {
    const A = mainRooms[e.a];
    const B = mainRooms[e.b];
    const ca = roomCenter(A);
    const cb = roomCenter(B);
    corridorSegs.push({ x0: ca.x, y0: ca.y, x1: cb.x, y1: cb.y });
  }

  for (const r of rooms) {
    if (r.main) continue;
    for (const seg of corridorSegs) {
      if (lineHitsRoom(seg.x0, seg.y0, seg.x1, seg.y1, r)) {
        r.hallway = true;
        break;
      }
    }
  }

  // 7. Rasterize
  const grid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => CELL.EMPTY)
  );

  const fillRoom = (r) => {
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          grid[y][x] = CELL.FLOOR;
        }
      }
    }
  };

  for (const r of rooms) {
    if (r.main || r.hallway) fillRoom(r);
  }

  for (const seg of corridorSegs) {
    carveCorridorLines(
      grid,
      seg.x0,
      seg.y0,
      seg.x1,
      seg.y1,
      corridorHalf,
      CELL.FLOOR
    );
  }

  // Walls: shell ≥2 tiles thick between floor and void.
  // Pass 1 — EMPTY touching floor/stairs (8-neighbor) → WALL.
  // Pass 2+ — dilate into EMPTY (wallThickness-1 times) so no wall
  //           that touches floor is also adjacent to void.
  const wallThickness = opts.wallThickness ?? 3;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] !== CELL.EMPTY) continue;
      let near = false;
      for (const [dx, dy] of [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (
          ny >= 0 &&
          ny < height &&
          nx >= 0 &&
          nx < width &&
          (grid[ny][nx] === CELL.FLOOR || grid[ny][nx] === CELL.STAIRS)
        ) {
          near = true;
          break;
        }
      }
      if (near) grid[y][x] = CELL.WALL;
    }
  }
  // Extra dilation passes (thickness-1): EMPTY touching WALL → WALL
  for (let pass = 1; pass < wallThickness; pass++) {
    const toWall = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x] !== CELL.EMPTY) continue;
        let touch = false;
        // 8-neighbor dilation so outer corners stay solid (no diagonal holes)
        for (const [dx, dy] of [
          [1, 0], [-1, 0], [0, 1], [0, -1],
          [1, 1], [1, -1], [-1, 1], [-1, -1],
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width && grid[ny][nx] === CELL.WALL) {
            touch = true;
            break;
          }
        }
        if (touch) toWall.push([x, y]);
      }
    }
    for (const [x, y] of toWall) grid[y][x] = CELL.WALL;
  }

  // Close residual EMPTY pockets enclosed by WALL (iterate to stability)
  {
    let changed = true;
    while (changed) {
      changed = false;
      const fill = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (grid[y][x] !== CELL.EMPTY) continue;
          let walls = 0;
          for (const [dx, dy] of [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1],
          ]) {
            const nx = x + dx, ny = y + dy;
            if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
            if (grid[ny][nx] === CELL.WALL) walls++;
          }
          // ≥5 of 8 neighbors wall → pocket / diagonal notch
          if (walls >= 5) fill.push([x, y]);
        }
      }
      for (const [x, y] of fill) {
        grid[y][x] = CELL.WALL;
        changed = true;
      }
    }
  }

  // Place stairs in farthest main room from start
  const startRoom = mainRooms.reduce((best, r) =>
    r.w * r.h > best.w * best.h ? r : best
  , mainRooms[0]);
  const start = {
    x: Math.floor(startRoom.x + startRoom.w / 2),
    y: Math.floor(startRoom.y + startRoom.h / 2),
  };

  let endRoom = mainRooms[0];
  let bestDist = -1;
  for (const r of mainRooms) {
    if (r === startRoom) continue;
    const c = roomCenter(r);
    const d = Math.hypot(c.x - start.x, c.y - start.y);
    if (d > bestDist) {
      bestDist = d;
      endRoom = r;
    }
  }
  const stairs = {
    x: Math.floor(endRoom.x + endRoom.w / 2),
    y: Math.floor(endRoom.y + endRoom.h / 2),
  };
  grid[stairs.y][stairs.x] = CELL.STAIRS;

  // Collect floor cells for spawning
  const floors = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === CELL.FLOOR) floors.push({ x, y });
    }
  }

  return {
    grid,
    width,
    height,
    rooms,
    mainRooms,
    connections,
    start,
    stairs,
    floors,
  };
}
