# Note Replace

![Note Replace product workflow](docs/readme-product-flow.svg)

Note Replace is a desktop PDF annotation and editing application built with Electron, React, and TypeScript.

**Version:** 1.0.0  
**Developer:** [@labsadik](https://github.com/labsadik)  
**Copyright:** © 2026 Sadik Laskar. All Rights Reserved.  
**License:** Proprietary — see [`LICENSE`](LICENSE)

## Features

- Import PDF files page by page.
- Edit the selected PDF page on the main canvas.
- Create a blank canvas.
- Select, move, and resize objects.
- Draw with Pen or Brush.
- Use Highlighter and Eraser tools.
- Add shapes: square, rounded square, circle/ellipse, diamond, horizontal line, and vertical line.
- Choose pen color and size.
- Choose shape border colors and transparent fill.
- Add images to the current page.
- Add, duplicate, delete, rename, and reorder pages.
- Undo and redo edits.
- Zoom from 25% to 200%; the default zoom is 65%.
- Export the current page as PNG.
- Save and reopen native `.myed` project files.
- Save edits from an imported PDF as a PDF.
- Use keyboard shortcuts for common tools and editing actions.

## Product references

![Note Replace reference 1](https://ik.imagekit.io/xvqovhmcyr/Note%20Replace%209_14_2026%2012_27_47%20PM.png)

![Note Replace reference 2](https://ik.imagekit.io/xvqovhmcyr/Note%20Replace%209_14_2026%2012_27_54%20PM.png)

![Note Replace reference 3](https://ik.imagekit.io/xvqovhmcyr/Note%20Replace%209_14_2026%2012_28_09%20PM.png)

![Note Replace reference 4](https://ik.imagekit.io/xvqovhmcyr/Note%20Replace%209_14_2026%2012_28_25%20PM.png)

![Note Replace reference 5](https://ik.imagekit.io/xvqovhmcyr/Note%20Replace%209_14_2026%2012_28_29%20PM.png)

## Demo

A compiled demo application is available from the repository releases:

[**Download the free Windows demo EXE from Releases**](https://github.com/WorkRCS/note_replace/releases)

The released application build may be used free of charge and without a time limit, subject to the terms of [`LICENSE`](LICENSE).

The free-use permission applies to the compiled application. It does **not** grant permission to clone, fork, copy, modify, rebrand, redistribute, or republish the repository or its source code, and it does not permit using the source code or proprietary implementation as the basis of another application or repository.

## How to use

1. Start the application.
2. Open a PDF or create a blank canvas.
3. Select a page from the page sidebar.
4. Choose a tool from the toolbar.
5. Edit the page, add drawings, shapes, or images.
6. Use the page controls to add, duplicate, delete, rename, or reorder pages.
7. Save the project or export the current work.

## Keyboard shortcuts

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
| `Esc` | Close the About dialog |

## Development

### Install

```bash
npm install
```

### Run the application

```bash
npm run dev
```

### Run tests

```bash
npm test -- --run
```

### Build

```bash
npm run build
```

### Run the built application

```bash
npm start
```

### Create the Windows installer

```bash
npm run dist:win
```

The Windows installer is written to the `release/` directory.

## License and ownership

Note Replace is proprietary software. Copyright © 2026 Sadik Laskar. All rights reserved.

The repository is not released under an open-source license. The compiled demo/application may be used free of charge and without a time limit under the terms of [`LICENSE`](LICENSE).

Without prior written permission from the copyright holder, the repository and proprietary parts of the application may not be cloned, forked, copied, republished, redistributed, modified, rebranded, resold, or used as the basis of another application or repository. Copyright and attribution notices may not be removed or changed.

Third-party libraries included in the project remain subject to their own licenses.

**Copyright © 2026 Sadik Laskar. All Rights Reserved.**
