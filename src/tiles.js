/** Kenney Tiny Dungeon packed sheet indices (16×16, 12 cols, no gap). */
export const TILE = {
  VOID: 0,
  FLOOR: 48,
  FLOOR_VAR: 49,
  FLOOR_PEBBLE: 51,
  FLOOR_STONE: 42,
  WALL: 14,
  WALL_WINDOW: 28,
  WALL_TOP: 2,
  WALL_SIDE_L: 57,
  WALL_SIDE_C: 58,
  WALL_SIDE_R: 59,
  WALL_DECOR: 29,
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
