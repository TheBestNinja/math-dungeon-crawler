/** Kenney Tiny Dungeon packed sheet indices (16×16, 12 cols, no gap).
 *  Wall frames match Kenney's sampleMap.tmx usage.
 */
export const TILE = {
  VOID: 0,
  FLOOR: 48,
  FLOOR_VAR: 49,
  FLOOR_PEBBLE: 51,
  FLOOR_STONE: 42,

  /** Solid brick — north/front wall face (floor to the south). */
  WALL: 40,
  WALL_ALT: 14,
  WALL_WINDOW: 28,
  WALL_DECOR: 29,

  /** South wall edge (floor to the north) — brick coping + brown base. */
  WALL_SOUTH: 26,

  /** West wall (floor to the east) — brown top + vertical grey rim. */
  WALL_WEST: 13,
  /** East wall (floor to the west). */
  WALL_EAST: 15,

  /** Outer corners (diagonal floor toward room interior). */
  WALL_CORNER_NW: 4,
  WALL_CORNER_NE: 5,
  WALL_CORNER_SW: 25,
  WALL_CORNER_SE: 27,

  /** Interior / fill (no adjacent floor). */
  WALL_FILL: 0,
  WALL_FILL_VAR: 1,

  DOOR: 21,
  ARCH: 9,
  /** Dark pit — descending stairs / floor exit. */
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
