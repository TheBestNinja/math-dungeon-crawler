import { DEFAULT_RULES } from './defaults.js';
import { CELL } from '../dungeon/generate.js';

function walkable(grid, x, y) {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return false;
  const c = grid[y][x];
  return c === CELL.FLOOR || c === CELL.STAIRS;
}

/**
 * Kenney-style wall autotile using a rules map (named slots → frame id).
 * Logic mirrors GameScene’s previous hard-coded pickWall.
 */
export function pickWall(x, y, grid, rules = DEFAULT_RULES) {
  const R = { ...DEFAULT_RULES, ...rules };
  const n = walkable(grid, x, y - 1);
  const e = walkable(grid, x + 1, y);
  const s = walkable(grid, x, y + 1);
  const w = walkable(grid, x - 1, y);
  const se = walkable(grid, x + 1, y + 1);
  const sw = walkable(grid, x - 1, y + 1);
  const ne = walkable(grid, x + 1, y - 1);
  const nw = walkable(grid, x - 1, y - 1);

  if (s) {
    if (w && !e) return R.wall_face_sw;
    if (e && !w) return R.wall_face_se;
    if (!w && !e) {
      if (se && !sw) return R.wall_face_sw;
      if (sw && !se) return R.wall_face_se;
    }
    const r = (x * 3 + y * 5) % 9;
    if (r === 0) return R.wall_face_window;
    if (r === 1) return R.wall_face_banner;
    return R.wall_face;
  }

  if (n) {
    if (w && !e) return R.wall_south_inner_w;
    if (e && !w) return R.wall_south_inner_e;
    if (!w && !e) {
      if (ne && !nw) return R.wall_south_sw;
      if (nw && !ne) return R.wall_south_se;
    }
    return R.wall_south;
  }

  if (e && !w) {
    const southIsWall = y + 1 < grid.length && grid[y + 1][x] === CELL.WALL;
    const s2 = walkable(grid, x, y + 2);
    if (southIsWall && s2) return R.wall_west_alt;
    return R.wall_west;
  }
  if (w && !e) {
    const southIsWall = y + 1 < grid.length && grid[y + 1][x] === CELL.WALL;
    const s2 = walkable(grid, x, y + 2);
    if (southIsWall && s2) return R.wall_east_alt;
    return R.wall_east;
  }

  if (se && !s && !e && !sw && !n && !w) return R.wall_west;
  if (sw && !s && !w && !se && !n && !e) return R.wall_east;
  if ((ne || nw) && !e && !w) return R.wall_fill;

  const s2 = walkable(grid, x, y + 2);
  const southIsWall = y + 1 < grid.length && grid[y + 1][x] === CELL.WALL;
  if (southIsWall && s2) {
    const westIsFace =
      !walkable(grid, x - 1, y) && walkable(grid, x - 1, y + 1);
    const eastIsFace =
      !walkable(grid, x + 1, y) && walkable(grid, x + 1, y + 1);
    if (westIsFace && !eastIsFace) return R.wall_east_alt;
    if (eastIsFace && !westIsFace) return R.wall_west_alt;
    if (!walkable(grid, x + 1, y) && walkable(grid, x + 2, y)) {
      const eastTopLat =
        y + 1 < grid.length &&
        grid[y + 1][x + 1] === CELL.WALL &&
        walkable(grid, x + 1, y + 2);
      if (!eastTopLat) return R.wall_top_e;
    }
    if (!walkable(grid, x - 1, y) && walkable(grid, x - 2, y)) {
      const westTopLat =
        y + 1 < grid.length &&
        grid[y + 1][x - 1] === CELL.WALL &&
        walkable(grid, x - 1, y + 2);
      if (!westTopLat) return R.wall_top_w;
    }
    const westVoid =
      x === 0 ||
      (grid[y][x - 1] !== CELL.WALL && !walkable(grid, x - 1, y));
    const eastVoid =
      x + 1 >= grid[0].length ||
      (grid[y][x + 1] !== CELL.WALL && !walkable(grid, x + 1, y));
    if (westVoid && !eastVoid) return R.wall_top_w;
    if (eastVoid && !westVoid) return R.wall_top_e;
    return R.wall_top;
  }
  if (southIsWall && !s2) {
    const s2e = walkable(grid, x + 1, y + 2);
    const s2w = walkable(grid, x - 1, y + 2);
    if (s2e && !s2w) return R.wall_top_w;
    if (s2w && !s2e) return R.wall_top_e;
  }

  return R.wall_fill;
}

/** Sample corridor mouth + room + wall jut for editor preview. */
export function buildPreviewGrid() {
  const W = CELL.WALL;
  const F = CELL.FLOOR;
  const E = CELL.EMPTY;
  const g = Array.from({ length: 10 }, () => Array(12).fill(E));
  for (let y = 1; y <= 8; y++) for (let x = 1; x <= 10; x++) g[y][x] = W;
  // West corridor
  for (let x = 1; x <= 4; x++) {
    g[5][x] = F;
    g[6][x] = F;
  }
  // East room
  for (let y = 3; y <= 7; y++) for (let x = 5; x <= 9; x++) g[y][x] = F;
  // North jut into room (exercises 16|2|17 + 57/59)
  for (let y = 1; y <= 5; y++) for (let x = 6; x <= 7; x++) g[y][x] = W;
  return g;
}
