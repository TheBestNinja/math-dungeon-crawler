# Math Dungeon Crawler

A playable browser dungeon crawler built with **Phaser 3** and a **TinyKeep-style** random dungeon generator. Art from [Kenney Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) (CC0).

## Play

**GitHub Pages:** https://thebestninja.github.io/math-dungeon-crawler/

**Auto-tile editor:** https://thebestninja.github.io/math-dungeon-crawler/autotile.html

## Controls

| Input | Action |
|-------|--------|
| **WASD** / **Arrow keys** | Move (grid / tile-snapped) |
| Bump into enemy | Attack |
| Walk onto red potion / chest | Heal |
| Reach the dark pit (stairs) | Next floor |
| **R** | Regenerate current floor (or restart after death) |
| **E** | Open the wall auto-tile editor |
| **Esc** | Return to login / character screen |

Or click **Auto-tile editor** (top-right on the game page).


## Login & character creator

On load you get a **login screen** (local profile only — no server).

1. Enter a **display name**.
2. **Create character** — layer Kenney Roguelike Characters parts (body, pants, armor, hair, facial hair, headgear, weapon, shield) with a live preview.
3. **Save**, then **Play** to enter the dungeon as that hero.
4. Profile is stored in `localStorage` (`mdc-character-v1`). **Esc** in-game returns to login.

Assets: `public/assets/chars/roguelikeChar_transparent.png` (16×16, 1px spacing). Credit **Kenney** — [Roguelike Characters](https://kenney.nl/assets/roguelike-characters) (CC0).

## Goal

Explore the procedural dungeon, fight bats and spiders, grab potions, and reach the stairs pit to descend. You die at 0 HP.

## Wall auto-tile editor

Configure which Kenney tile frame each wall situation uses, preview a sample room, then **Export JSON** or **Apply to game** (saves to `localStorage` in this browser).

### Open the editor

- Live: https://thebestninja.github.io/math-dungeon-crawler/autotile.html
- Local: `npm run dev` → open `/autotile.html` (or press **E** in-game)
- From the game: top-right link or **E**

### Workflow

1. Select a **rule slot** (e.g. “Brick face”, “Top strip mid”).
2. Click a tile on the **palette** (`tilemap_packed.png`, 12×11, 16px, no spacing).
3. Watch the **live preview** update.
4. **Export JSON** to download `autotile-config.json`, and/or **Apply to game** so the crawler uses it on the next load (same origin / browser).
5. **Import JSON** (button or drag-and-drop a `.json` file) to reload a saved config.
6. **Reset defaults** restores the built-in Kenney / sampleMap mapping.

### How the game loads config

Priority order:

1. URL query `?autotile=` — either a path/URL to a JSON file (e.g. `?autotile=autotile-default.json`) or inline JSON starting with `{`
2. `localStorage` key `mdc-autotile-v1` (written by **Apply to game**)
3. Built-in Kenney defaults

Example:

```
https://thebestninja.github.io/math-dungeon-crawler/?autotile=autotile-default.json
```

### JSON schema

```json
{
  "version": 1,
  "tileset": {
    "image": "assets/tilemap_packed.png",
    "tileSize": 16,
    "spacing": 0,
    "columns": 12,
    "rows": 11
  },
  "rules": {
    "wall_fill": 0,
    "wall_face": 40,
    "wall_face_window": 28,
    "wall_face_banner": 29,
    "wall_face_sw": 57,
    "wall_face_se": 59,
    "wall_south": 26,
    "wall_south_sw": 25,
    "wall_south_se": 27,
    "wall_south_inner_w": 4,
    "wall_south_inner_e": 5,
    "wall_west": 13,
    "wall_east": 15,
    "wall_west_alt": 17,
    "wall_east_alt": 16,
    "wall_top": 2,
    "wall_top_w": 1,
    "wall_top_e": 3,
    "floor": 48
  }
}
```

| Field | Meaning |
|-------|---------|
| `version` | Schema version (`1`) |
| `tileset` | Sheet metadata. This project uses the **packed** Kenney sheet (**spacing `0`**). |
| `rules.*` | Named situations → frame index (row-major, 12 columns). |

A checked-in default lives at [`public/autotile-default.json`](public/autotile-default.json).

Neighbor **logic** (when to use face vs lip vs top strip, etc.) stays in code (`src/autotile/pickWall.js`); the JSON only remaps which **frame** each situation draws.

## Local development

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/math-dungeon-crawler/`).

```bash
npm run build    # output in dist/ (game + autotile.html)
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
7. Rasterize to a 2D grid and render with Kenney wall/floor tiles (autotile rules above).

Each run and each new floor gets a fresh layout.

## Tech

- Phaser 3.88
- Vite (base path `/math-dungeon-crawler/` for GitHub Pages; multi-page: `index.html` + `autotile.html`)
- Deployed to GitHub Pages (`gh-pages` branch)

## Credits

- **Kenney** — [Roguelike Characters](https://kenney.nl/assets/roguelike-characters) (character creator, CC0)
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
