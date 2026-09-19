import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import {
  resolveActiveConfig,
  parseConfigJson,
  saveConfigToStorage,
} from './autotile/config.js';

const autotile = await resolveActiveConfig();

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  backgroundColor: '#0a0a0f',
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },
};

const game = new Phaser.Game(config);
game.registry.set('autotile', autotile);

window.addEventListener('mdc-autotile-reload', async () => {
  const next = await resolveActiveConfig();
  game.registry.set('autotile', next);
});

// Drop a .json autotile config onto the game to apply + reload
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', async (e) => {
  e.preventDefault();
  const f = e.dataTransfer?.files?.[0];
  if (!f || !(f.type === 'application/json' || f.name.endsWith('.json'))) return;
  try {
    const cfg = parseConfigJson(await f.text());
    saveConfigToStorage(cfg);
    window.location.reload();
  } catch (err) {
    alert('Autotile import failed: ' + err.message);
  }
});
