import {
  createDefaultConfig,
  DEFAULT_RULES,
  RULE_SLOTS,
  SCHEMA_VERSION,
  STORAGE_KEY,
  TILESET,
} from './defaults.js';

const SLOT_KEYS = new Set(RULE_SLOTS.map((s) => s.key));

/**
 * Normalize / validate an autotile JSON object.
 * Unknown keys are dropped; missing rule slots fall back to defaults.
 */
export function normalizeConfig(raw) {
  const base = createDefaultConfig();
  if (!raw || typeof raw !== 'object') return base;

  const version = Number(raw.version) || SCHEMA_VERSION;
  const tileset = {
    ...TILESET,
    ...(raw.tileset && typeof raw.tileset === 'object' ? raw.tileset : {}),
  };
  tileset.tileSize = Number(tileset.tileSize) || TILESET.tileSize;
  tileset.spacing = Number(tileset.spacing) || 0;
  tileset.columns = Number(tileset.columns) || TILESET.columns;
  tileset.rows = Number(tileset.rows) || TILESET.rows;
  if (typeof tileset.image !== 'string' || !tileset.image) {
    tileset.image = TILESET.image;
  }

  const rules = { ...DEFAULT_RULES };
  const incoming = raw.rules && typeof raw.rules === 'object' ? raw.rules : {};
  for (const key of SLOT_KEYS) {
    if (incoming[key] === undefined || incoming[key] === null) continue;
    const n = Number(incoming[key]);
    if (Number.isFinite(n) && n >= 0) rules[key] = Math.floor(n);
  }

  return { version, tileset, rules };
}

export function configToJson(config, pretty = true) {
  const normalized = normalizeConfig(config);
  return pretty
    ? JSON.stringify(normalized, null, 2)
    : JSON.stringify(normalized);
}

export function parseConfigJson(text) {
  const data = JSON.parse(text);
  return normalizeConfig(data);
}

export function loadConfigFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveConfigToStorage(config) {
  const normalized = normalizeConfig(config);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearConfigStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Resolve active config: URL ?autotile= (JSON path or inline) → localStorage → defaults.
 * Async when fetching a URL path.
 */
export async function resolveActiveConfig() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('autotile');
  if (q) {
    if (q.trim().startsWith('{')) {
      try {
        return normalizeConfig(JSON.parse(q));
      } catch {
        /* fall through */
      }
    } else {
      try {
        const url = q.startsWith('http') || q.startsWith('/')
          ? q
          : new URL(q, window.location.href).href;
        const res = await fetch(url);
        if (res.ok) return normalizeConfig(await res.json());
      } catch {
        /* fall through */
      }
    }
  }
  return loadConfigFromStorage() || createDefaultConfig();
}

export { STORAGE_KEY, RULE_SLOTS, DEFAULT_RULES, TILESET, createDefaultConfig };
