/** Named wall autotile slots + Kenney Tiny Dungeon defaults (sampleMap). */

export const TILESET = {
  image: 'assets/tilemap_packed.png',
  tileSize: 16,
  /** Packed sheet has no gutter (192×176 = 12×11 × 16). */
  spacing: 0,
  columns: 12,
  rows: 11,
};

/** Slots the game’s pickWall resolves. Order = editor list order. */
export const RULE_SLOTS = [
  { key: 'wall_fill', label: 'Wall fill (deep mass)', group: 'Mass' },
  { key: 'wall_face', label: 'Brick face (floor south)', group: 'Face' },
  { key: 'wall_face_window', label: 'Face decoration — window', group: 'Face' },
  { key: 'wall_face_banner', label: 'Face decoration — banner', group: 'Face' },
  { key: 'wall_face_sw', label: 'Face corner SW (floor S+W)', group: 'Face' },
  { key: 'wall_face_se', label: 'Face corner SE (floor S+E)', group: 'Face' },
  { key: 'wall_south', label: 'South lip mid (floor north)', group: 'South lip' },
  { key: 'wall_south_sw', label: 'South lip outer SW', group: 'South lip' },
  { key: 'wall_south_se', label: 'South lip outer SE', group: 'South lip' },
  { key: 'wall_south_inner_w', label: 'South lip inner W (N+W)', group: 'South lip' },
  { key: 'wall_south_inner_e', label: 'South lip inner E (N+E)', group: 'South lip' },
  { key: 'wall_west', label: 'West rim (floor east)', group: 'Side rims' },
  { key: 'wall_east', label: 'East rim (floor west)', group: 'Side rims' },
  { key: 'wall_west_alt', label: 'West rim / top joiner (17)', group: 'Side rims' },
  { key: 'wall_east_alt', label: 'East rim / top joiner (16)', group: 'Side rims' },
  { key: 'wall_top', label: 'Top strip mid', group: 'Top strip' },
  { key: 'wall_top_w', label: 'Top strip west end / void', group: 'Top strip' },
  { key: 'wall_top_e', label: 'Top strip east end / void', group: 'Top strip' },
  { key: 'floor', label: 'Floor (preview only)', group: 'Preview' },
];

/** Current hard-coded Kenney mapping used by the game. */
export const DEFAULT_RULES = {
  wall_fill: 0,
  wall_face: 40,
  wall_face_window: 28,
  wall_face_banner: 29,
  wall_face_sw: 57,
  wall_face_se: 59,
  wall_south: 26,
  wall_south_sw: 25,
  wall_south_se: 27,
  wall_south_inner_w: 4,
  wall_south_inner_e: 5,
  wall_west: 13,
  wall_east: 15,
  wall_west_alt: 17,
  wall_east_alt: 16,
  wall_top: 2,
  wall_top_w: 1,
  wall_top_e: 3,
  floor: 48,
};

export const STORAGE_KEY = 'mdc-autotile-v1';
export const SCHEMA_VERSION = 1;

export function createDefaultConfig() {
  return {
    version: SCHEMA_VERSION,
    tileset: { ...TILESET },
    rules: { ...DEFAULT_RULES },
  };
}
