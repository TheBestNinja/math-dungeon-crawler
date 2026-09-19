import Phaser from 'phaser';
import { UI } from './frames.js';
import { createCharacterSprite } from '../character/sprite.js';
import { defaultAppearance } from '../character/layers.js';

const DEPTH = 100;
const SCALE = 2;

/**
 * Kenney RPG UI chrome: top HP panel + toggleable Stats tab.
 */
export default class GameHud {
  /**
   * @param {Phaser.Scene} scene
   * @param {() => object} getState - returns live stats snapshot
   */
  constructor(scene, getState) {
    this.scene = scene;
    this.getState = getState;
    this.statsOpen = false;
    this.root = null;
    this.statsRoot = null;
  }

  create() {
    const scene = this.scene;
    const cam = scene.cameras.main;
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(DEPTH);

    // Top HUD panel (stretched beige)
    const panel = scene.add
      .image(8, 6, 'ui', UI.PANEL)
      .setOrigin(0)
      .setDisplaySize(cam.width - 16, 52)
      .setScrollFactor(0);
    this.root.add(panel);

    this.nameText = scene.add
      .text(20, 12, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#3b2a1a',
      })
      .setScrollFactor(0);
    this.root.add(this.nameText);

    this.floorText = scene.add
      .text(20, 32, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#5a4030',
      })
      .setScrollFactor(0);
    this.root.add(this.floorText);

    // HP bar (right side of top panel)
    this.hpLabel = scene.add
      .text(cam.width - 220, 10, 'HP', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#3b2a1a',
      })
      .setScrollFactor(0);
    this.root.add(this.hpLabel);

    this.hpBar = this.makeHBar(cam.width - 220, 26, 180, 'red');
    this.root.add(this.hpBar);

    this.hpValue = scene.add
      .text(cam.width - 40, 28, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#3b2a1a',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0);
    this.root.add(this.hpValue);

    // Stats button (square)
    this.statsBtn = scene.add
      .image(cam.width - 36, 70, 'ui', UI.BTN_SQ)
      .setOrigin(0.5)
      .setScale(0.7)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    this.statsBtnLabel = scene.add
      .text(cam.width - 36, 70, 'C', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#3b2a1a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.statsBtn.on('pointerdown', () => {
      this.statsBtn.setTexture('ui', UI.BTN_SQ_PRESS);
    });
    this.statsBtn.on('pointerup', () => {
      this.statsBtn.setTexture('ui', UI.BTN_SQ);
      this.toggleStats();
    });
    this.statsBtn.on('pointerout', () => this.statsBtn.setTexture('ui', UI.BTN_SQ));
    this.root.add(this.statsBtn);
    this.root.add(this.statsBtnLabel);

    // Hint bar
    this.hintText = scene.add
      .text(8, cam.height - 22, 'WASD move · C/Tab stats · E editor · Esc login · R regen', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#a09080',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH);
    this.root.add(this.hintText);

    // Floating messages (keep simple)
    this.messageText = scene.add
      .text(cam.width / 2, cam.height / 2, '', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffe080',
        align: 'center',
        backgroundColor: '#000000aa',
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 5)
      .setVisible(false);

    this.buildStatsPanel();
    this.refresh();
  }

  makeHBar(x, y, width, color) {
    const scene = this.scene;
    const c = scene.add.container(x, y).setScrollFactor(0);
    const h = 18 * SCALE * 0.5; // visual height ~18 after scale 1
    const scale = 1;

    const backL = scene.add.image(0, 0, 'ui', UI.BAR_BACK_L).setOrigin(0).setScale(scale);
    const backR = scene.add.image(width, 0, 'ui', UI.BAR_BACK_R).setOrigin(1, 0).setScale(scale);
    const midW = Math.max(1, width - backL.displayWidth - backR.displayWidth);
    const backM = scene.add
      .image(backL.displayWidth, 0, 'ui', UI.BAR_BACK_M)
      .setOrigin(0)
      .setDisplaySize(midW, backL.displayHeight);

    const fillKey =
      color === 'green'
        ? { L: UI.BAR_GREEN_L, M: UI.BAR_GREEN_M, R: UI.BAR_GREEN_R }
        : { L: UI.BAR_RED_L, M: UI.BAR_RED_M, R: UI.BAR_RED_R };

    const fillL = scene.add.image(0, 0, 'ui', fillKey.L).setOrigin(0).setScale(scale);
    const fillR = scene.add.image(0, 0, 'ui', fillKey.R).setOrigin(1, 0).setScale(scale);
    const fillM = scene.add.image(fillL.displayWidth, 0, 'ui', fillKey.M).setOrigin(0);

    c.add([backL, backM, backR, fillL, fillM, fillR]);
    c.setData('width', width);
    c.setData('fillL', fillL);
    c.setData('fillM', fillM);
    c.setData('fillR', fillR);
    c.setData('backL', backL);
    this.setBarRatio(c, 1);
    return c;
  }

  setBarRatio(bar, ratio) {
    const width = bar.getData('width');
    const fillL = bar.getData('fillL');
    const fillM = bar.getData('fillM');
    const fillR = bar.getData('fillR');
    const backL = bar.getData('backL');
    const r = Phaser.Math.Clamp(ratio, 0, 1);
    const fillW = Math.max(0, Math.floor(width * r));
    if (fillW <= fillL.displayWidth + fillR.displayWidth) {
      fillL.setVisible(fillW > 0);
      fillR.setVisible(false);
      fillM.setVisible(false);
      if (fillW > 0) fillL.setDisplaySize(fillW, backL.displayHeight);
    } else {
      fillL.setVisible(true).setScale(1).setDisplaySize(fillL.width, backL.displayHeight);
      fillR.setVisible(true).setPosition(fillW, 0);
      const mid = fillW - fillL.displayWidth - fillR.displayWidth;
      fillM
        .setVisible(true)
        .setPosition(fillL.displayWidth, 0)
        .setDisplaySize(Math.max(1, mid), backL.displayHeight);
    }
  }

  buildStatsPanel() {
    const scene = this.scene;
    const cam = scene.cameras.main;
    const pw = 340;
    const ph = 360;
    const px = (cam.width - pw) / 2;
    const py = (cam.height - ph) / 2;

    this.statsRoot = scene.add.container(px, py).setScrollFactor(0).setDepth(DEPTH + 2);
    this.statsRoot.setVisible(false);

    const dim = scene.add
      .rectangle(-px, -py, cam.width, cam.height, 0x000000, 0.45)
      .setOrigin(0)
      .setInteractive();
    dim.on('pointerup', () => this.setStatsOpen(false));
    this.statsRoot.add(dim);

    const bg = scene.add
      .image(0, 0, 'ui', UI.PANEL_BROWN)
      .setOrigin(0)
      .setDisplaySize(pw, ph);
    this.statsRoot.add(bg);

    const titleBar = scene.add
      .image(pw / 2, 28, 'ui', UI.BTN_BROWN)
      .setOrigin(0.5)
      .setDisplaySize(200, 36);
    this.statsRoot.add(titleBar);
    this.statsRoot.add(
      scene.add
        .text(pw / 2, 28, 'STATS', {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#f0e6d2',
        })
        .setOrigin(0.5)
    );

    // Close (X)
    const close = scene.add
      .image(pw - 28, 28, 'ui', UI.BTN_ROUND)
      .setOrigin(0.5)
      .setScale(0.85)
      .setInteractive({ useHandCursor: true });
    const xIcon = scene.add.image(pw - 28, 28, 'ui', UI.CROSS).setOrigin(0.5);
    close.on('pointerup', () => this.setStatsOpen(false));
    this.statsRoot.add(close);
    this.statsRoot.add(xIcon);

    // Portrait inset
    const inset = scene.add
      .image(24, 64, 'ui', UI.INSET)
      .setOrigin(0)
      .setDisplaySize(100, 100);
    this.statsRoot.add(inset);
    this.portraitHolder = scene.add.container(40, 80);
    this.statsRoot.add(this.portraitHolder);

    this.statsName = scene.add.text(140, 70, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f5e6c8',
    });
    this.statsRoot.add(this.statsName);

    this.statsBody = scene.add.text(140, 100, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#e8dcc0',
      lineSpacing: 6,
    });
    this.statsRoot.add(this.statsBody);

    // HP bar in panel
    this.statsHpBar = this.makeHBar(24, 180, pw - 48, 'red');
    this.statsRoot.add(this.statsHpBar);
    this.statsHpText = scene.add
      .text(pw / 2, 202, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#f5e6c8',
      })
      .setOrigin(0.5);
    this.statsRoot.add(this.statsHpText);

    this.statsExtra = scene.add.text(24, 230, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#e8dcc0',
      lineSpacing: 8,
    });
    this.statsRoot.add(this.statsExtra);

    const closeBtn = scene.add
      .image(pw / 2, ph - 36, 'ui', UI.BTN_LONG)
      .setOrigin(0.5)
      .setDisplaySize(160, 36)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => closeBtn.setTexture('ui', UI.BTN_LONG_PRESS));
    closeBtn.on('pointerup', () => {
      closeBtn.setTexture('ui', UI.BTN_LONG);
      this.setStatsOpen(false);
    });
    closeBtn.on('pointerout', () => closeBtn.setTexture('ui', UI.BTN_LONG));
    this.statsRoot.add(closeBtn);
    this.statsRoot.add(
      scene.add
        .text(pw / 2, ph - 36, 'Close', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#3b2a1a',
        })
        .setOrigin(0.5)
    );
  }

  toggleStats() {
    this.setStatsOpen(!this.statsOpen);
  }

  setStatsOpen(open) {
    this.statsOpen = open;
    this.statsRoot?.setVisible(open);
    if (open) this.refreshStats();
  }

  refresh() {
    const s = this.getState();
    this.nameText.setText(s.name || 'Hero');
    this.floorText.setText(`Floor ${s.floor}`);
    const ratio = s.maxHp > 0 ? s.hp / s.maxHp : 0;
    this.setBarRatio(this.hpBar, ratio);
    this.hpValue.setText(`${s.hp}/${s.maxHp}`);
    if (this.statsOpen) this.refreshStats();
  }

  refreshStats() {
    const s = this.getState();
    this.statsName.setText(s.name || 'Hero');
    this.statsBody.setText(
      `Attack   ${s.attack}\nDefense  ${s.defense}\nFloor    ${s.floor}`
    );
    this.setBarRatio(this.statsHpBar, s.maxHp > 0 ? s.hp / s.maxHp : 0);
    this.statsHpText.setText(`HP  ${s.hp} / ${s.maxHp}`);
    this.statsExtra.setText(
      `Gold     ${s.gold}\nPotions  ${s.potions}\n\nPress C or Tab to close`
    );

    this.portraitHolder.removeAll(true);
    const spr = createCharacterSprite(
      this.scene,
      0,
      0,
      s.appearance || defaultAppearance(),
      4
    );
    this.portraitHolder.add(spr);
  }

  showMessage(msg, ms = 1200) {
    this.messageText.setText(msg).setVisible(true);
    this.scene.time.delayedCall(ms, () => {
      if (!this.scene.dead) this.messageText.setVisible(false);
    });
  }

  setMessageVisible(v) {
    this.messageText.setVisible(v);
  }
}
