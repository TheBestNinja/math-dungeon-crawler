import Phaser from 'phaser';
import { loadProfile, saveProfile, hasPlayableProfile } from '../character/profile.js';
import { DEFAULT_STATS } from '../character/stats.js';
import { CHAR_SHEET } from '../character/layers.js';
import { createCharacterSprite } from '../character/sprite.js';
import { defaultAppearance } from '../character/layers.js';

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
  }

  preload() {
    if (!this.textures.exists('chars')) {
      this.load.spritesheet(CHAR_SHEET.key, CHAR_SHEET.path, {
        frameWidth: CHAR_SHEET.frameWidth,
        frameHeight: CHAR_SHEET.frameHeight,
        spacing: CHAR_SHEET.spacing,
      });
    }
    if (!this.textures.exists('tiles')) {
      this.load.spritesheet('tiles', 'assets/tilemap_packed.png', {
        frameWidth: 16,
        frameHeight: 16,
      });
    }
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0d0d12');
    this.cameras.main.fadeIn(200, 0, 0, 0);

    if (this.textures.exists('chars')) {
      this.textures.get('chars').setFilter(Phaser.Textures.FilterMode.NEAREST);
    }

    this.profile = loadProfile();

    // Decorative floor strip
    for (let i = 0; i < 20; i++) {
      this.add
        .image(40 + i * 48, height - 56, 'tiles', 48)
        .setScale(3)
        .setOrigin(0)
        .setAlpha(0.35);
    }

    this.add
      .text(width / 2, 56, 'MATH DUNGEON CRAWLER', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#f0e6d2',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 92, 'Kenney Tiny Dungeon · local heroes', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#8a8070',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2 - 160, 150, 'Display name', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#c8c0b0',
      });

    const name = this.profile?.name || '';
    this.nameValue = name;

    // DOM input for name
    this.nameInput = this.add
      .dom(width / 2, 180, 'input', {
        type: 'text',
        maxlength: '24',
        placeholder: 'Enter a name…',
        value: name,
        style: `
          width: 280px; padding: 10px 12px; font: 16px monospace;
          background: #1a1a26; color: #f0e6d2; border: 2px solid #3d5a80;
          border-radius: 6px; outline: none;
        `,
      })
      .setOrigin(0.5);

    this.nameInput.addListener('input');
    this.nameInput.on('input', (ev) => {
      this.nameValue = ev.target.value;
    });

    // Preview of saved character
    this.previewRoot = this.add.container(width / 2, 280);
    this.refreshPreview();

    this.statusText = this.add
      .text(width / 2, 360, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#6ecf8e',
      })
      .setOrigin(0.5);
    this.updateStatus();

    this.makeButton(width / 2 - 110, 410, 200, 40, 'Create character', () => {
      this.persistName();
      this.scene.start('CharacterCreatorScene');
    });

    this.playBtn = this.makeButton(width / 2 - 110, 462, 200, 40, 'Play', () => {
      this.tryPlay();
    }, '#1e4430', '#6ecf8e');

    this.makeButton(width / 2 - 110, 514, 200, 36, 'Auto-tile editor', () => {
      window.location.href = new URL('autotile.html', window.location.href).href;
    }, '#242433', '#6ea8cf');

    this.syncPlayEnabled();
  }

  refreshPreview() {
    this.previewRoot.removeAll(true);
    const app = this.profile?.appearance || defaultAppearance();
    const spr = createCharacterSprite(this, -24, -24, app, 3);
    this.previewRoot.add(spr);
    if (this.profile?.name) {
      const label = this.add
        .text(0, 36, this.profile.name, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#e8e0d4',
        })
        .setOrigin(0.5, 0);
      this.previewRoot.add(label);
    }
  }

  updateStatus() {
    if (hasPlayableProfile()) {
      this.statusText.setText(`Saved hero ready — ${this.profile.name}`);
      this.statusText.setColor('#6ecf8e');
    } else {
      this.statusText.setText('Create a character to enter the dungeon');
      this.statusText.setColor('#c09060');
    }
  }

  syncPlayEnabled() {
    const ok = hasPlayableProfile();
    this.playBtn.setAlpha(ok ? 1 : 0.4);
  }

  persistName() {
    const n = (this.nameValue || '').trim() || 'Hero';
    const prev = loadProfile();
    saveProfile({
      name: n,
      appearance: prev?.appearance || defaultAppearance(),
      stats: prev?.stats || DEFAULT_STATS,
    });
    this.profile = loadProfile();
  }

  tryPlay() {
    this.persistName();
    this.profile = loadProfile();
    if (!hasPlayableProfile()) {
      this.statusText.setText('Create a character first');
      this.statusText.setColor('#c06060');
      return;
    }
    this.registry.set('profile', this.profile);
    this.cameras.main.fadeOut(150, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { floor: 1 });
    });
  }

  makeButton(x, y, w, h, label, onClick, bg = '#1e3a55', border = '#6ea8cf') {
    const g = this.add.container(x, y);
    const fill = Phaser.Display.Color.HexStringToColor(bg).color;
    const stroke = Phaser.Display.Color.HexStringToColor(border).color;
    const bgR = this.add
      .rectangle(0, 0, w, h, fill)
      .setOrigin(0)
      .setStrokeStyle(2, stroke)
      .setInteractive({ useHandCursor: true });
    const labelText = this.add
      .text(w / 2, h / 2, label, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#f0e6d2',
      })
      .setOrigin(0.5);
    bgR.on('pointerover', () => bgR.setFillStyle(fill, 0.85));
    bgR.on('pointerout', () => bgR.setFillStyle(fill, 1));
    bgR.on('pointerup', onClick);
    g.add([bgR, labelText]);
    return g;
  }
}
