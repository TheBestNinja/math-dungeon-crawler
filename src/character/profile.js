import { defaultAppearance } from './layers.js';
import { DEFAULT_STATS, normalizeStats } from './stats.js';

export const PROFILE_KEY = 'mdc-character-v1';

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.name !== 'string') return null;
    return {
      name: String(data.name).trim().slice(0, 24) || 'Hero',
      appearance: { ...defaultAppearance(), ...(data.appearance || {}) },
      stats: normalizeStats(data.stats),
      updatedAt: data.updatedAt || null,
    };
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  const data = {
    name: String(profile.name || 'Hero').trim().slice(0, 24) || 'Hero',
    appearance: { ...defaultAppearance(), ...(profile.appearance || {}) },
    stats: normalizeStats(profile.stats || DEFAULT_STATS),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
  return data;
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

export function hasPlayableProfile() {
  const p = loadProfile();
  return !!(p && p.name && p.appearance && p.appearance.body != null);
}

export function persistStats(stats) {
  const p = loadProfile();
  if (!p) return null;
  return saveProfile({ ...p, stats: normalizeStats(stats) });
}
