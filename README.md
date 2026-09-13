# Note Replace

A lightweight Electron desktop editor for presentations and PDF annotation.

## Features in this first production foundation
- Page sidebar with add, duplicate, delete and selection.
- SVG-backed editor with text, shapes, images and freehand pen strokes.
- Native Electron IPC with context isolation, sandboxing and no renderer Node access.
- `.myed` JSON project files.
- PDF export through Electron's print-to-PDF pipeline.
- PPTX export for native text/shapes and image elements.
- Local unit tests for the document model.

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
