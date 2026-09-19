/** Default combat / meta stats stored on the local profile. */
export const DEFAULT_STATS = {
  maxHp: 10,
  attack: 2,
  defense: 1,
  gold: 0,
};

export function normalizeStats(raw) {
  const s = { ...DEFAULT_STATS, ...(raw && typeof raw === 'object' ? raw : {}) };
  s.maxHp = Math.max(1, Math.floor(Number(s.maxHp) || DEFAULT_STATS.maxHp));
  s.attack = Math.max(1, Math.floor(Number(s.attack) || DEFAULT_STATS.attack));
  s.defense = Math.max(0, Math.floor(Number(s.defense) || DEFAULT_STATS.defense));
  s.gold = Math.max(0, Math.floor(Number(s.gold) || 0));
  return s;
}
