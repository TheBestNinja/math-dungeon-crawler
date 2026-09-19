import { DRAW_ORDER } from './layers.js';

/**
 * Build a Phaser Container of layered char sheet images (origin top-left).
 * @returns {Phaser.GameObjects.Container}
 */
export function createCharacterSprite(scene, x, y, appearance, scale = 3) {
  const container = scene.add.container(x, y);
  const layers = [];
  for (const key of DRAW_ORDER) {
    const frame = appearance?.[key];
    if (frame == null) continue;
    const img = scene.add
      .image(0, 0, 'chars', frame)
      .setOrigin(0)
      .setScale(scale);
    container.add(img);
    layers.push(img);
  }
  container.setSize(16 * scale, 16 * scale);
  container.list.forEach((c) => {
    if (c.texture) c.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  });
  return container;
}

/** Draw appearance onto a 2d canvas context (editor / HUD). */
export function paintAppearance(ctx, sheetImg, appearance, dx, dy, scale, columns = 54) {
  const tw = 16;
  const step = tw + 1;
  ctx.imageSmoothingEnabled = false;
  for (const key of DRAW_ORDER) {
    const frame = appearance?.[key];
    if (frame == null) continue;
    const col = frame % columns;
    const row = Math.floor(frame / columns);
    ctx.drawImage(
      sheetImg,
      col * step,
      row * step,
      tw,
      tw,
      dx,
      dy,
      tw * scale,
      tw * scale
    );
  }
}
