import Phaser from 'phaser';
import LoginScene from './scenes/LoginScene.js';
import CharacterCreatorScene from './scenes/CharacterCreatorScene.js';
import GameScene from './scenes/GameScene.js';
import {
  resolveActiveConfig,
  parseConfigJson,
  saveConfigToStorage,
} from './autotile/config.js';
import { loadProfile } from './character/profile.js';

const autotile = await resolveActiveConfig();
const profile = loadProfile();

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  backgroundColor: '#0a0a0f',
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  dom: {
    createContainer: true,
  },
  scene: [LoginScene, CharacterCreatorScene, GameScene],
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
if (profile) game.registry.set('profile', profile);

window.addEventListener('mdc-autotile-reload', async () => {
  const next = await resolveActiveConfig();
  game.registry.set('autotile', next);
});

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
