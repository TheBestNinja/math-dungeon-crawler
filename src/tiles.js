/** Kenney Tiny Dungeon packed sheet (16×16, 12 cols, no gap).
 *  Indices taken from Kenney sampleMap.tmx wall usage.
 */
export const TILE = {
  // Brown wall-top / rock fill (non-floor mass in Sample.png)
  WALL_FILL: 0,
  WALL_TOP: 2,
  WALL_TOP_W: 1, // west end of top strip above brick faces
  WALL_TOP_E: 3, // east end
  WALL_TOP_ALT: 12,

  // Brick front face — ONLY when floor is immediately south
  WALL_FACE: 40,
  WALL_FACE_ALT: 14,
  WALL_FACE_WINDOW: 28,
  WALL_FACE_BANNER: 29,
  WALL_FACE_SW: 57, // face corner: floors south + west
  WALL_FACE_SE: 59, // face corner: floors south + east

  // South lip (floor north)
  WALL_SOUTH: 26,
  WALL_SOUTH_SW: 25,
  WALL_SOUTH_SE: 27,

  // Side rims against floor (full 16×16 brown + grey edge; need brown neighbors)
  WALL_WEST: 13, // floor east
  WALL_EAST: 15, // floor west
  WALL_WEST_ALT: 17,
  WALL_EAST_ALT: 16,

  // South-lip inner corners (sampleMap: 4/5 beside 26 when floor N+W / N+E)
  WALL_SOUTH_INNER_W: 4, // floor north + west
  WALL_SOUTH_INNER_E: 5, // floor north + east
  WALL_INNER: 4, // alias

  FLOOR: 48,
  FLOOR_VAR: 49,
  FLOOR_PEBBLE: 51,
  FLOOR_STONE: 42,
  FLOOR_ALT: 50,

  STAIRS: 56,
  CHEST: 89,
  CHEST_OPEN: 91,
  POTION_RED: 115,
  PLAYER: 96,
  ENEMY_BAT: 120,
  ENEMY_SPIDER: 122,
  ENEMY_SLIME: 108,
  ENEMY_RAT: 123,
};

export const TILE_SIZE = 16;
export const SHEET_COLS = 12;
export const SHEET_ROWS = 11;
