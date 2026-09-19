import {
  RULE_SLOTS,
  createDefaultConfig,
  configToJson,
  parseConfigJson,
  saveConfigToStorage,
  loadConfigFromStorage,
  normalizeConfig,
} from '../autotile/config.js';
import { pickWall, buildPreviewGrid } from '../autotile/pickWall.js';
import { CELL } from '../dungeon/generate.js';

const SCALE_PALETTE = 2;
const SCALE_PREVIEW = 2;

const state = {
  config: normalizeConfig(loadConfigFromStorage() || createDefaultConfig()),
  selectedKey: RULE_SLOTS[0].key,
  sheet: null,
};

const el = {
  slotList: document.getElementById('slot-list'),
  palette: document.getElementById('palette'),
  preview: document.getElementById('preview'),
  hover: document.getElementById('hover-info'),
  status: document.getElementById('status'),
  paletteMeta: document.getElementById('palette-meta'),
  schemaSample: document.getElementById('schema-sample'),
  fileImport: document.getElementById('file-import'),
};

function frameRect(frameId, tileset) {
  const { tileSize: t, spacing: s, columns: cols } = tileset;
  const col = frameId % cols;
  const row = Math.floor(frameId / cols);
  const step = t + s;
  return { sx: col * step, sy: row * step, sw: t, sh: t };
}

function drawSwatch(canvas, frameId) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const { tileset } = state.config;
  const r = frameRect(frameId, tileset);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.sheet) {
    ctx.drawImage(state.sheet, r.sx, r.sy, r.sw, r.sh, 0, 0, canvas.width, canvas.height);
  }
}

function setStatus(msg, ok = true) {
  el.status.textContent = msg;
  el.status.style.color = ok ? 'var(--accent)' : 'var(--danger)';
}

function renderSlots() {
  el.slotList.innerHTML = '';
  let lastGroup = null;
  for (const slot of RULE_SLOTS) {
    if (slot.group !== lastGroup) {
      lastGroup = slot.group;
      const g = document.createElement('div');
      g.className = 'slot-group';
      g.textContent = slot.group;
      el.slotList.appendChild(g);
    }
    const row = document.createElement('div');
    row.className = 'slot' + (slot.key === state.selectedKey ? ' active' : '');
    row.dataset.key = slot.key;
    const sw = document.createElement('canvas');
    sw.className = 'swatch';
    sw.width = 28;
    sw.height = 28;
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = slot.label;
    const fid = document.createElement('div');
    fid.className = 'fid';
    fid.textContent = String(state.config.rules[slot.key]);
    row.append(sw, label, fid);
    row.addEventListener('click', () => {
      state.selectedKey = slot.key;
      renderSlots();
      drawPalette();
    });
    el.slotList.appendChild(row);
    drawSwatch(sw, state.config.rules[slot.key]);
  }
}

function drawPalette() {
  const canvas = el.palette;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const { tileset } = state.config;
  const t = tileset.tileSize;
  const s = tileset.spacing;
  const cols = tileset.columns;
  const rows = tileset.rows;
  const step = t + s;
  const scale = SCALE_PALETTE;
  canvas.width = cols * t * scale;
  canvas.height = rows * t * scale;
  ctx.fillStyle = '#0a0a10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!state.sheet) return;

  for (let id = 0; id < cols * rows; id++) {
    const col = id % cols;
    const row = Math.floor(id / cols);
    const r = frameRect(id, tileset);
    ctx.drawImage(
      state.sheet,
      r.sx,
      r.sy,
      r.sw,
      r.sh,
      col * t * scale,
      row * t * scale,
      t * scale,
      t * scale
    );
  }

  // Highlight frames currently assigned
  const used = new Set(Object.values(state.config.rules));
  ctx.lineWidth = 1;
  for (const id of used) {
    const col = id % cols;
    const row = Math.floor(id / cols);
    ctx.strokeStyle = 'rgba(110, 207, 142, 0.7)';
    ctx.strokeRect(col * t * scale + 0.5, row * t * scale + 0.5, t * scale - 1, t * scale - 1);
  }

  // Selected slot’s current frame
  const sel = state.config.rules[state.selectedKey];
  if (sel !== undefined) {
    const col = sel % cols;
    const row = Math.floor(sel / cols);
    ctx.strokeStyle = '#6ea8cf';
    ctx.lineWidth = 2;
    ctx.strokeRect(col * t * scale + 1, row * t * scale + 1, t * scale - 2, t * scale - 2);
  }

  el.paletteMeta.textContent = `(${cols}×${rows}, ${t}px, spacing ${s})`;
}

function frameAtPaletteEvent(ev) {
  const canvas = el.palette;
  const rect = canvas.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((ev.clientY - rect.top) / rect.height) * canvas.height;
  const t = state.config.tileset.tileSize * SCALE_PALETTE;
  const col = Math.floor(x / t);
  const row = Math.floor(y / t);
  const { columns: cols, rows } = state.config.tileset;
  if (col < 0 || row < 0 || col >= cols || row >= rows) return null;
  return row * cols + col;
}

function drawPreview() {
  const canvas = el.preview;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const grid = buildPreviewGrid();
  const h = grid.length;
  const w = grid[0].length;
  const t = state.config.tileset.tileSize;
  const scale = SCALE_PREVIEW;
  canvas.width = w * t * scale;
  canvas.height = h * t * scale;
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!state.sheet) return;

  const floorId = state.config.rules.floor;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cell = grid[y][x];
      if (cell === CELL.EMPTY) continue;
      let frame;
      if (cell === CELL.FLOOR || cell === CELL.STAIRS) frame = floorId;
      else if (cell === CELL.WALL) frame = pickWall(x, y, grid, state.config.rules);
      else continue;
      const r = frameRect(frame, state.config.tileset);
      ctx.drawImage(
        state.sheet,
        r.sx,
        r.sy,
        r.sw,
        r.sh,
        x * t * scale,
        y * t * scale,
        t * scale,
        t * scale
      );
    }
  }
}

function refresh() {
  renderSlots();
  drawPalette();
  drawPreview();
  el.schemaSample.textContent = configToJson(state.config);
}

function assignFrame(frameId) {
  state.config.rules[state.selectedKey] = frameId;
  refresh();
  setStatus(`Set ${state.selectedKey} → ${frameId}`);
}

function downloadJson() {
  const blob = new Blob([configToJson(state.config)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'autotile-config.json';
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus('Downloaded autotile-config.json');
}

function applyToGame() {
  saveConfigToStorage(state.config);
  setStatus('Saved to localStorage — open the game to use these rules (same browser).');
}

function resetDefaults() {
  state.config = createDefaultConfig();
  refresh();
  setStatus('Restored Kenney defaults (not saved until you Apply)');
}

function importFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state.config = parseConfigJson(String(reader.result));
      refresh();
      setStatus(`Imported ${file.name}`);
    } catch (err) {
      setStatus(`Import failed: ${err.message}`, false);
    }
  };
  reader.readAsText(file);
}

el.palette.addEventListener('mousemove', (ev) => {
  const id = frameAtPaletteEvent(ev);
  el.hover.textContent =
    id === null ? 'Hover a tile for frame id' : `Frame ${id} — click to assign to “${state.selectedKey}”`;
});
el.palette.addEventListener('click', (ev) => {
  const id = frameAtPaletteEvent(ev);
  if (id !== null) assignFrame(id);
});

document.getElementById('btn-export').addEventListener('click', downloadJson);
document.getElementById('btn-apply').addEventListener('click', applyToGame);
document.getElementById('btn-reset').addEventListener('click', resetDefaults);
document.getElementById('btn-import').addEventListener('click', () => el.fileImport.click());
el.fileImport.addEventListener('change', () => {
  const f = el.fileImport.files?.[0];
  if (f) importFile(f);
  el.fileImport.value = '';
});

// Drag-drop JSON anywhere
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  const f = e.dataTransfer?.files?.[0];
  if (f && (f.type === 'application/json' || f.name.endsWith('.json'))) importFile(f);
});

async function boot() {
  const img = new Image();
  img.src = `${import.meta.env.BASE_URL}assets/tilemap_packed.png`;
  await img.decode();
  state.sheet = img;
  refresh();
  setStatus('Ready — select a slot, click a palette tile, Export or Apply to game.');
}

boot().catch((err) => setStatus(String(err), false));
