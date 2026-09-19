import Phaser from 'phaser';
import {
  CHAR_SHEET,
  LAYER_META,
  LAYER_FRAMES,
  defaultAppearance,
} from '../character/layers.js';
import { loadProfile, saveProfile } from '../character/profile.js';
import { DEFAULT_STATS } from '../character/stats.js';
import { createCharacterSprite } from '../character/sprite.js';

export default class CharacterCreatorScene extends Phaser.Scene {
  constructor() {
    super('CharacterCreatorScene');
  }

  preload() {
    if (!this.textures.exists('chars')) {
      this.load.spritesheet(CHAR_SHEET.key, CHAR_SHEET.path, {
        frameWidth: CHAR_SHEET.frameWidth,
        frameHeight: CHAR_SHEET.frameHeight,
        spacing: CHAR_SHEET.spacing,
      });
    }
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#12121a');
    this.cameras.main.fadeIn(150, 0, 0, 0);
    this.textures.get('chars').setFilter(Phaser.Textures.FilterMode.NEAREST);

    const saved = loadProfile();
    this.nameValue = saved?.name || 'Hero';
    this.appearance = { ...defaultAppearance(), ...(saved?.appearance || {}) };

    this.add
      .text(width / 2, 28, 'CHARACTER CREATOR', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#f0e6d2',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 54, 'Kenney Roguelike Characters · cycle parts · Save', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#8a8070',
      })
      .setOrigin(0.5);

    this.nameInput = this.add
      .dom(width / 2, 88, 'input', {
        type: 'text',
        maxlength: '24',
        value: this.nameValue,
        style: `
          width: 240px; padding: 8px 10px; font: 14px monospace;
          background: #1a1a26; color: #f0e6d2; border: 2px solid #3d5a80;
          border-radius: 6px; outline: none;
        `,
      })
      .setOrigin(0.5);
    this.nameInput.addListener('input');
    this.nameInput.on('input', (ev) => {
      this.nameValue = ev.target.value;
    });

    // Large preview
    this.previewBox = this.add
      .rectangle(width / 2, 200, 160, 160, 0x0a0a10)
      .setStrokeStyle(2, 0x3d5a80);
    this.previewHolder = this.add.container(width / 2 - 48, 200 - 48);
    this.redrawPreview();

    // Layer controls
    let y = 300;
    this.rowLabels = {};
    for (const meta of LAYER_META) {
      this.makeLayerRow(width / 2, y, meta);
      y += 28;
    }

    this.makeBtn(width / 2 - 210, height - 56, 120, 36, '← Login', () => {
      this.scene.start('LoginScene');
    });
    this.makeBtn(width / 2 - 60, height - 56, 120, 36, 'Random', () => {
      this.randomize();
    }, 0x2a2a3a, 0x9a9080);
    this.makeBtn(width / 2 + 90, height - 56, 120, 36, 'Save', () => {
      this.saveAndReturn();
    }, 0x1e4430, 0x6ecf8e);
  }

  frameList(key) {
    const list = LAYER_FRAMES[key] || [];
    if (LAYER_META.find((m) => m.key === key)?.optional) {
      return [null, ...list];
    }
    return list;
  }

  makeLayerRow(cx, y, meta) {
    const label = this.add
      .text(cx - 200, y, meta.label, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#c8c0b0',
      })
      .setOrigin(0, 0.5);

    const value = this.add
      .text(cx + 20, y, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#6ecf8e',
      })
      .setOrigin(0.5);

    this.rowLabels[meta.key] = value;
    this.updateRowLabel(meta.key);

    const prev = this.add
      .text(cx - 40, y, '◀', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#6ea8cf',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const next = this.add
      .text(cx + 80, y, '▶', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#6ea8cf',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    prev.on('pointerup', () => this.cycle(meta.key, -1));
    next.on('pointerup', () => this.cycle(meta.key, 1));
  }

  updateRowLabel(key) {
    const v = this.appearance[key];
    const text = v == null ? 'none' : `#${v}`;
    this.rowLabels[key]?.setText(text);
  }

  cycle(key, dir) {
    const list = this.frameList(key);
    if (!list.length) return;
    let i = list.indexOf(this.appearance[key]);
    if (i < 0) i = 0;
    i = (i + dir + list.length) % list.length;
    this.appearance[key] = list[i];
    this.updateRowLabel(key);
    this.redrawPreview();
  }

  randomize() {
    for (const meta of LAYER_META) {
      const list = this.frameList(meta.key);
      this.appearance[meta.key] = list[Math.floor(Math.random() * list.length)];
      this.updateRowLabel(meta.key);
    }
    // Always keep a body
    if (this.appearance.body == null) {
      this.appearance.body = LAYER_FRAMES.body[0];
    }
    this.redrawPreview();
  }

  redrawPreview() {
    this.previewHolder.removeAll(true);
    const spr = createCharacterSprite(this, 0, 0, this.appearance, 6);
    this.previewHolder.add(spr);
  }

  saveAndReturn() {
    const name = (this.nameValue || '').trim() || 'Hero';
    const profile = saveProfile({
      name,
      appearance: this.appearance,
      stats: loadProfile()?.stats || DEFAULT_STATS,
    });
    this.registry.set('profile', profile);
    this.cameras.main.fadeOut(150, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('LoginScene');
    });
  }

  makeBtn(x, y, w, h, label, onClick, bg = 0x1e3a55, border = 0x6ea8cf) {
    const bgR = this.add
      .rectangle(x, y, w, h, bg)
      .setOrigin(0)
      .setStrokeStyle(2, border)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x + w / 2, y + h / 2, label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f0e6d2',
      })
      .setOrigin(0.5);
    bgR.on('pointerup', onClick);
    return bgR;
  }
}
