# Math Dungeon Crawler

A playable browser dungeon crawler built with **Phaser 3** and a **TinyKeep-style** random dungeon generator. Art from [Kenney Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) (CC0).

## Play

**GitHub Pages:** https://thebestninja.github.io/math-dungeon-crawler/

## Controls

| Input | Action |
|-------|--------|
| **WASD** / **Arrow keys** | Move (grid / tile-snapped) |
| Bump into enemy | Attack |
| Walk onto red potion / chest | Heal |
| Reach the dark pit (stairs) | Next floor |
| **R** | Regenerate current floor (or restart after death) |

## Goal

Explore the procedural dungeon, fight bats and spiders, grab potions, and reach the stairs pit to descend. You die at 0 HP.

## Local development

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/math-dungeon-crawler/`).

```bash
npm run build    # output in dist/
npm run preview  # preview production build
```

## Dungeon generation (TinyKeep-style)

Algorithm based on [Procedural Dungeon Generation Algorithm](https://www.gamedeveloper.com/programming/procedural-dungeon-generation-algorithm):

1. Spawn rooms with normally distributed sizes inside an ellipse; snap to the tile grid (`roundm`).
2. Iteratively push overlapping rooms apart (grid-snapped).
3. Mark **main/hub** rooms above ~1.25 × mean width and height.
4. **Delaunay** triangulation on main-room centers.
5. **Minimum spanning tree**, then add back ~8–15% of discarded edges for loops.
6. Carve **H / V / L** corridors (≥3 tiles wide); non-main rooms that intersect corridor lines become hallway rooms.
7. Rasterize to a 2D grid and render with Kenney wall/floor tiles.

Each run and each new floor gets a fresh layout.

## Tech

- Phaser 3.88
- Vite (base path `/math-dungeon-crawler/` for GitHub Pages)
- Deployed to GitHub Pages (`gh-pages` branch)

## Credits

- **Kenney** — [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) tiles & characters ([www.kenney.nl](https://www.kenney.nl)), license **CC0 1.0**
- Dungeon algorithm inspired by TinyKeep / Adonaac’s GameDeveloper write-up

## License

Game code: MIT-style — free to use. Assets: CC0 (Kenney).

## Deploy (GitHub Pages)

```bash
npm run build
# publish dist/ to the gh-pages branch (already configured as the Pages source)
```

Live site: https://thebestninja.github.io/math-dungeon-crawler/
