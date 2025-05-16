# Tertris
tertris - the tetris like game completely different tho
# Modern Tetris (HTML5, CSS, JavaScript)

This is a vanilla-HTML5 Tetris clone with ghost and hold pieces, canvas rendering, mobile touch controls, and a frosted-glass UI.

## Files

- `index.html` — Main game page (contains two `<canvas>` elements and controls)
- `style.css` — Styling (glass effect, button styles, responsive layout)
- `script.js` — Game logic (piece definitions, movement, ghost, hold, rendering, etc.)
- `audio/` — Folder with placeholder MP3s: `bgm.mp3`, `move.mp3`, `drop.mp3`, `clear.mp3`.

## Running Locally

1. Clone or unzip this repo.
2. Ensure the `audio/` folder contains valid `.mp3` files with the above names (they can be silent placeholders).
3. Open `index.html` in a modern browser (desktop or mobile). The game should start immediately.

## GitHub Pages Deployment

To deploy on GitHub Pages:

1. Push all files (with the flat structure above) to a GitHub repository.
2. Go to **Settings > Pages** in your repo and select the branch containing `index.html` (usually `main` or `gh-pages`) and the root folder.
3. After saving, your site will be available at `https://<username>.github.io/<repo>/`.
4. Ensure the `audio/` folder and all files are included in the commit.

That’s it! Opening the page will show the Tetris game with all listed features.
