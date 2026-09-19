import Phaser from 'phaser';
import { generateDungeon, CELL } from '../dungeon/generate.js';
import { TILE, TILE_SIZE } from '../tiles.js';
import { pickWall as pickWallFrame } from '../autotile/pickWall.js';
import { createDefaultConfig } from '../autotile/defaults.js';
import { createCharacterSprite } from '../character/sprite.js';
import { loadProfile } from '../character/profile.js';
import { defaultAppearance } from '../character/layers.js';
import { CHAR_SHEET } from '../character/layers.js';

const SCALE = 3;
const PLAYER_MAX_HP = 10;
const BAT = { frame: TILE.ENEMY_BAT, hp: 2, dmg: 1, name: 'Bat' };
const SPIDER = { frame: TILE.ENEMY_SPIDER, hp: 3, dmg: 2, name: 'Spider' };

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.floorNum = data.floor ?? 1;
  }

  preload() {
    this.load.spritesheet('tiles', 'assets/tilemap_packed.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    if (!this.textures.exists('chars')) {
      this.load.spritesheet(CHAR_SHEET.key, CHAR_SHEET.path, {
        frameWidth: CHAR_SHEET.frameWidth,
        frameHeight: CHAR_SHEET.frameHeight,
        spacing: CHAR_SHEET.spacing,
      });
    }
  }

  create() {
    this.cameras.main.fadeIn(200, 0, 0, 0);
    this.autotile = this.registry.get('autotile') || createDefaultConfig();
    this.profile =
      this.registry.get('profile') || loadProfile() || {
        name: 'Hero',
        appearance: defaultAppearance(),
      };
    this.registry.set('profile', this.profile);
    this.moving = false;
    this.dead = false;
    this.wonFloor = false;
    this.playerHp = PLAYER_MAX_HP;
    this.enemies = [];
    this.pickups = [];

    this.dungeon = generateDungeon({
      roomCount: 32 + Math.min(this.floorNum * 2, 16),
      meanW: 7 + Math.min(this.floorNum, 3),
      meanH: 6 + Math.min(this.floorNum, 2),
    });

    const { width, height, grid, start, stairs } = this.dungeon;

    // Map pixel size
    this.mapPixelW = width * TILE_SIZE * SCALE;
    this.mapPixelH = height * TILE_SIZE * SCALE;

    this.walkable = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => false)
    );

    // WALL shell (≥2 thick) rendered as Kenney autotile; EMPTY stays void.
    // Brick faces only on cells with floor immediately south.
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = grid[y][x];
        const px = x * TILE_SIZE * SCALE;
        const py = y * TILE_SIZE * SCALE;
        let frame;

        if (cell === CELL.FLOOR || cell === CELL.STAIRS) {
          frame = this.pickFloor(x, y);
          this.walkable[y][x] = true;
        } else if (cell === CELL.WALL) {
          // Only WALL cells — EMPTY stays void/black beyond the ≥2-thick shell
          frame = pickWallFrame(x, y, grid, this.autotile.rules);
        } else {
          continue; // void
        }

        const spr = this.add
          .image(px, py, 'tiles', frame)
          .setOrigin(0)
          .setScale(SCALE)
          .setDepth(0);
        spr.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

        if (cell === CELL.STAIRS) {
          this.add
            .image(px, py, 'tiles', TILE.STAIRS)
            .setOrigin(0)
            .setScale(SCALE)
            .setDepth(1);
        }
      }
    }

    // Ensure texture filtering
    this.textures.get('tiles').setFilter(Phaser.Textures.FilterMode.NEAREST);

    // Spawn entities
    this.spawnPickups();
    this.spawnEnemies();

    this.playerTx = start.x;
    this.playerTy = start.y;
    if (this.textures.exists('chars')) {
      this.textures.get('chars').setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    this.player = createCharacterSprite(
      this,
      start.x * TILE_SIZE * SCALE,
      start.y * TILE_SIZE * SCALE,
      this.profile.appearance || defaultAppearance(),
      SCALE
    );
    this.player.setDepth(10);

    this.stairsPos = { x: stairs.x, y: stairs.y };

    this.cameras.main.setBounds(0, 0, this.mapPixelW, this.mapPixelH);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    this.cameras.main.setZoom(1);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');

    this.createHud();
    this.input.keyboard.on('keydown-R', () => {
      if (this.dead || this.wonFloor) return;
      this.scene.restart({ floor: this.floorNum });
    });
    this.input.keyboard.on('keydown-E', () => {
      window.location.href = new URL('autotile.html', window.location.href).href;
    });
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('LoginScene');
    });

    this.events.on('shutdown', () => {
      this.input.keyboard.off('keydown-R');
      this.input.keyboard.off('keydown-E');
      this.input.keyboard.off('keydown-ESC');
    });
  }

  pickFloor(x, y) {
    const n = (x * 17 + y * 31) % 10;
    if (n === 0 || n === 5) return TILE.FLOOR_VAR;
    if (n === 1 || n === 6) return TILE.FLOOR_PEBBLE;
    if (n === 2) return TILE.FLOOR_STONE;
    if (n === 3) return TILE.FLOOR_ALT;
    return TILE.FLOOR;
  }

  occupied(tx, ty) {
    if (tx === this.playerTx && ty === this.playerTy) return true;
    return this.enemies.some((e) => e.tx === tx && e.ty === ty && e.hp > 0);
  }

  spawnPickups() {
    const { floors, start, stairs } = this.dungeon;
    const candidates = floors.filter(
      (f) =>
        Math.hypot(f.x - start.x, f.y - start.y) > 4 &&
        !(f.x === stairs.x && f.y === stairs.y)
    );
    Phaser.Utils.Array.Shuffle(candidates);

    const potionCount = 1 + Math.floor(Math.random() * 2);
    const chestCount = 1;

    for (let i = 0; i < potionCount && i < candidates.length; i++) {
      const p = candidates[i];
      const spr = this.add
        .image(p.x * TILE_SIZE * SCALE, p.y * TILE_SIZE * SCALE, 'tiles', TILE.POTION_RED)
        .setOrigin(0)
        .setScale(SCALE)
        .setDepth(5);
      this.pickups.push({ tx: p.x, ty: p.y, type: 'potion', spr, taken: false });
    }
    for (let i = potionCount; i < potionCount + chestCount && i < candidates.length; i++) {
      const p = candidates[i];
      const spr = this.add
        .image(p.x * TILE_SIZE * SCALE, p.y * TILE_SIZE * SCALE, 'tiles', TILE.CHEST)
        .setOrigin(0)
        .setScale(SCALE)
        .setDepth(5);
      this.pickups.push({ tx: p.x, ty: p.y, type: 'chest', spr, taken: false });
    }
  }

  spawnEnemies() {
    const { floors, start, stairs, mainRooms } = this.dungeon;
    const candidates = floors.filter(
      (f) =>
        Math.hypot(f.x - start.x, f.y - start.y) > 6 &&
        !(f.x === stairs.x && f.y === stairs.y)
    );
    Phaser.Utils.Array.Shuffle(candidates);

    const count = 6 + this.floorNum * 2;
    for (let i = 0; i < count && i < candidates.length; i++) {
      const p = candidates[i];
      const kind = Math.random() < 0.55 ? BAT : SPIDER;
      const spr = this.add
        .image(p.x * TILE_SIZE * SCALE, p.y * TILE_SIZE * SCALE, 'tiles', kind.frame)
        .setOrigin(0)
        .setScale(SCALE)
        .setDepth(8);
      this.enemies.push({
        tx: p.x,
        ty: p.y,
        hp: kind.hp,
        dmg: kind.dmg,
        name: kind.name,
        spr,
      });
    }
  }

  createHud() {
    const cam = this.cameras.main;
    this.hudBg = this.add
      .rectangle(0, 0, cam.width, 40, 0x000000, 0.65)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(100);
    this.hudText = this.add
      .text(8, 8, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f0e6d2',
      })
      .setScrollFactor(0)
      .setDepth(101);
    this.hintText = this.add
      .text(8, cam.height - 28, 'WASD move · bump attack · stairs · R regen · E editor · Esc login', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#a09080',
      })
      .setScrollFactor(0)
      .setDepth(101);
    this.messageText = this.add
      .text(cam.width / 2, cam.height / 2, '', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffe080',
        align: 'center',
        backgroundColor: '#000000aa',
        padding: { x: 16, y: 12 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(102)
      .setVisible(false);

    this.updateHud();
  }

  updateHud() {
    const hearts = '♥'.repeat(Math.max(0, this.playerHp)) + '♡'.repeat(Math.max(0, PLAYER_MAX_HP - this.playerHp));
    this.hudText.setText(`${this.profile?.name || "Hero"} · Floor ${this.floorNum}   HP ${hearts} (${this.playerHp}/${PLAYER_MAX_HP})`);
  }

  showMessage(msg, ms = 1200) {
    this.messageText.setText(msg).setVisible(true);
    this.time.delayedCall(ms, () => {
      if (!this.dead) this.messageText.setVisible(false);
    });
  }

  update() {
    if (this.dead || this.wonFloor || this.moving) return;

    let dx = 0;
    let dy = 0;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.keys.A))
      dx = -1;
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.keys.D))
      dx = 1;
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.W))
      dy = -1;
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.keys.S))
      dy = 1;

    if (dx !== 0 || dy !== 0) {
      this.tryMove(dx, dy);
    }
  }

  tryMove(dx, dy) {
    const nx = this.playerTx + dx;
    const ny = this.playerTy + dy;
    const { width, height } = this.dungeon;

    if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
    if (!this.walkable[ny][nx]) return;

    // Bump combat
    const enemy = this.enemies.find((e) => e.tx === nx && e.ty === ny && e.hp > 0);
    if (enemy) {
      this.attackEnemy(enemy);
      return;
    }

    this.moving = true;
    this.playerTx = nx;
    this.playerTy = ny;
    this.tweens.add({
      targets: this.player,
      x: nx * TILE_SIZE * SCALE,
      y: ny * TILE_SIZE * SCALE,
      duration: 80,
      onComplete: () => {
        this.moving = false;
        this.afterPlayerMove();
      },
    });
  }

  attackEnemy(enemy) {
    this.moving = true;
    enemy.hp -= 1;
    this.tweens.add({
      targets: enemy.spr,
      alpha: 0.3,
      yoyo: true,
      duration: 60,
      onComplete: () => {
        if (enemy.hp <= 0) {
          enemy.spr.destroy();
          this.showMessage(`Defeated ${enemy.name}!`, 700);
        }
        // Enemy counter-attacks if alive and adjacent after
        this.enemyTurns();
        this.moving = false;
      },
    });
  }

  afterPlayerMove() {
    // Pickups
    for (const p of this.pickups) {
      if (p.taken) continue;
      if (p.tx === this.playerTx && p.ty === this.playerTy) {
        p.taken = true;
        if (p.type === 'potion') {
          const heal = 3;
          this.playerHp = Math.min(PLAYER_MAX_HP, this.playerHp + heal);
          this.showMessage(`+${heal} HP`);
          this.updateHud();
          p.spr.destroy();
        } else if (p.type === 'chest') {
          p.spr.setTexture('tiles', TILE.CHEST_OPEN);
          const heal = 2;
          this.playerHp = Math.min(PLAYER_MAX_HP, this.playerHp + heal);
          this.showMessage('Chest! +2 HP');
          this.updateHud();
        }
      }
    }

    // Stairs
    if (this.playerTx === this.stairsPos.x && this.playerTy === this.stairsPos.y) {
      this.wonFloor = true;
      this.showMessage(`${this.profile?.name || "Hero"} · Floor ${this.floorNum} cleared!\nDescending...`, 900);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.restart({ floor: this.floorNum + 1 });
      });
      return;
    }

    this.enemyTurns();
  }

  enemyTurns() {
    if (this.dead || this.wonFloor) return;

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const dist = Math.abs(e.tx - this.playerTx) + Math.abs(e.ty - this.playerTy);
      if (dist === 1) {
        // Attack player
        this.playerHp -= e.dmg;
        this.updateHud();
        this.cameras.main.shake(80, 0.008);
        this.showMessage(`${e.name} hits for ${e.dmg}!`, 600);
        if (this.playerHp <= 0) {
          this.playerHp = 0;
          this.updateHud();
          this.playerDie();
          return;
        }
        continue;
      }
      if (dist > 8) continue; // idle if far

      // Step toward player (greedy)
      let dx = Math.sign(this.playerTx - e.tx);
      let dy = Math.sign(this.playerTy - e.ty);
      // Prefer the larger axis
      if (Math.abs(this.playerTx - e.tx) >= Math.abs(this.playerTy - e.ty)) {
        dy = 0;
      } else {
        dx = 0;
      }

      const nx = e.tx + dx;
      const ny = e.ty + dy;
      if (
        this.walkable[ny]?.[nx] &&
        !this.occupied(nx, ny) &&
        !(nx === this.stairsPos.x && ny === this.stairsPos.y)
      ) {
        e.tx = nx;
        e.ty = ny;
        this.tweens.add({
          targets: e.spr,
          x: nx * TILE_SIZE * SCALE,
          y: ny * TILE_SIZE * SCALE,
          duration: 80,
        });
      }
    }
  }

  playerDie() {
    this.dead = true;
    this.messageText
      .setText(`You died on floor ${this.floorNum}.\nPress R to restart`)
      .setVisible(true);
    this.player.setTint(0x882222);
    this.input.keyboard.once('keydown-R', () => {
      this.scene.restart({ floor: 1 });
    });
  }
}
