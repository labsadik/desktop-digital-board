# Note Replace

A production-focused Electron desktop PDF annotation and digital-board editor.

**Version:** 1.0.0  
**Developer:** Sadik Laskar  
**License:** Proprietary • All Rights Reserved

## What it does

- Imports PDF documents page by page and keeps each page editable.
- Renders only the selected page in the main canvas for lower memory use.
- Supports Select, Pen, Brush, Highlighter, Eraser and Shapes.
- Pen settings live in one compact popup: type, size and color.
- Pen popup has a visible **×** close control and closes automatically when a pen type/color is selected or another tool is chosen.
- Shapes support square, rounded rectangle, circle, diamond, horizontal line and vertical line with transparent fill and selectable borders.
- Pages can be added, duplicated, deleted, renamed and reordered.
- Images can be imported onto the current page.
- Undo/redo, keyboard shortcuts and zoom from 25% to 200% are supported.
- PDF export preserves the document canvas dimensions.
- Current page can be exported as PNG.
- Native `.myed` project files are supported.
- Windows/macOS/Linux use `assets/logo.png` as the application icon.

## How to use

1. Start the app and choose **Import PDF** or **Blank canvas**.
2. Use the page sidebar to switch pages. Only the selected page is rendered on the main canvas.
3. Use **Select** to move and resize objects.
4. Use **Pen** to open the compact Pen settings. Choose Pen or Brush, pick a color, and adjust size. Selecting a type/color closes the popup automatically; the **×** button closes it manually.
5. Use **Highlighter** for transparent highlighting and **Eraser** to remove objects by clicking or dragging across them.
6. Use **Shape** to select a shape and border color.
7. Use **Save** for native project files or for saving an edited imported PDF.

## Keyboard commands

| Shortcut | Action |
|---|---|
| `V` | Select |
| `P` | Pen |
| `H` | Highlighter |
| `E` | Eraser |
| `R` | Shapes |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Save |
| `Delete` / `Backspace` | Delete selected object |
| `Esc` | Close About/license dialog |

## Development commands

Install dependencies:

```bash
npm install
```

Run the development app:

```bash
npm run dev
```

Run tests:

```bash
npm test -- --run
```

Build renderer and Electron code:

```bash
npm run build
```

Create a Windows NSIS installer:

```bash
npm run dist:win
```

The Windows installer is generated under `release/`.

## Production notes

The renderer runs without Node integration and uses isolated Electron preload IPC. PDF imports are processed progressively, page images are optimized before storage in the editor state, and background PDF hydration does not create undo-history entries.

## License

This repository is proprietary source-available software. Copyright © 2026 Sadik Laskar. All rights reserved. See `LICENSE` for the complete license terms and commercial licensing contact information.
