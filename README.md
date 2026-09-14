# Note Replace

A lightweight Electron desktop digital-board editor for PDF annotation.

## Features
- Page sidebar with add, duplicate, delete and selection.
- SVG-backed editor with text, shapes, images and freehand pen strokes.
- Real page-by-page canvas switching and zoom.
- PDF import with every source page preserved as a separate editable page.
- PDF export that preserves each edited page's exact canvas dimensions.
- Native Electron IPC with context isolation and no renderer Node access.
- `.myed` JSON project files.
- Windows, macOS and Linux app icons use the shared `assets/logo.png` asset.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run test
npm run build
```
