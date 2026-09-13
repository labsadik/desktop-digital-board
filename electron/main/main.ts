import { app, BrowserWindow, dialog, ipcMain, nativeImage, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createPptx } from './pptx.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    title: 'Note Replace',
    backgroundColor: '#0b0d12',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  })

  if (!app.isPackaged) {
    void mainWindow.loadURL('http://127.0.0.1:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    // electron/main/main.js lives at <app>/dist-electron/electron/main.
    // The renderer build is at <app>/dist, so three parent traversals are required.
    void mainWindow.loadFile(path.join(__dirname, '../../../dist/index.html'))
  }
}

function safeName(name: string) {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() || 'Untitled'
}

function toDataUrl(pathname: string) {
  const extension = path.extname(pathname).toLowerCase().slice(1)
  const mime = extension === 'svg' ? 'image/svg+xml' : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : extension === 'webp' ? 'image/webp' : extension === 'gif' ? 'image/gif' : extension === 'pdf' ? 'application/pdf' : 'image/png'
  return fs.readFile(pathname).then((buffer) => `data:${mime};base64,${buffer.toString('base64')}`)
}

app.whenReady().then(() => {
  ipcMain.handle('file:open-project', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Note Replace Project', extensions: ['myed', 'json'] }],
    })
    if (result.canceled || !result.filePaths[0]) return null
    try {
      const parsed = JSON.parse(await fs.readFile(result.filePaths[0], 'utf8'))
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.pages)) throw new Error('Invalid project file')
      return parsed
    } catch (error) {
      await dialog.showMessageBox({ type: 'error', title: 'Open project failed', message: error instanceof Error ? error.message : 'The selected project is invalid.' })
      return null
    }
  })

  ipcMain.handle('file:save-project', async (_event, project: unknown) => {
    if (!project || typeof project !== 'object') throw new Error('Invalid project')
    const candidate = project as { name?: unknown }
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'Note Replace Project', extensions: ['myed'] }],
      defaultPath: `${safeName(typeof candidate.name === 'string' ? candidate.name : 'Untitled')}.myed`,
    })
    if (result.canceled || !result.filePath) return null
    await fs.writeFile(result.filePath, JSON.stringify(project, null, 2), 'utf8')
    return result.filePath
  })

  ipcMain.handle('file:import-image', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] }],
    })
    if (result.canceled || !result.filePaths[0]) return null
    return toDataUrl(result.filePaths[0])
  })

  ipcMain.handle('file:import-pdf', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF documents', extensions: ['pdf'] }],
    })
    if (result.canceled || !result.filePaths[0]) return null
    return toDataUrl(result.filePaths[0])
  })

  ipcMain.handle('export:pptx', async (_event, project: Parameters<typeof createPptx>[0]) => {
    const result = await dialog.showSaveDialog({
      defaultPath: `${safeName(project.name || 'presentation')}.pptx`,
      filters: [{ name: 'PowerPoint', extensions: ['pptx'] }],
    })
    if (result.canceled || !result.filePath) return null
    await createPptx(project, result.filePath)
    return result.filePath
  })

  ipcMain.handle('export:pdf', async (_event, html: string, fileName: string) => {
    if (typeof html !== 'string' || html.length > 30_000_000) throw new Error('Export payload is too large.')
    const result = await dialog.showSaveDialog({
      defaultPath: `${safeName(fileName || 'presentation')}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })
    if (result.canceled || !result.filePath) return null
    const exportWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } })
    try {
      await exportWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      const pdf = await exportWindow.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true })
      await fs.writeFile(result.filePath, pdf)
      return result.filePath
    } finally {
      if (!exportWindow.isDestroyed()) exportWindow.destroy()
    }
  })

  ipcMain.handle('export:png', async (_event, svg: string, fileName: string) => {
    if (typeof svg !== 'string' || !svg.startsWith('<svg')) throw new Error('Invalid SVG export.')
    const result = await dialog.showSaveDialog({
      defaultPath: `${safeName(fileName || 'page')}.png`,
      filters: [{ name: 'PNG image', extensions: ['png'] }],
    })
    if (result.canceled || !result.filePath) return null
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
    const image = nativeImage.createFromDataURL(dataUrl)
    if (image.isEmpty()) throw new Error('Could not render the page image.')
    await fs.writeFile(result.filePath, image.toPNG())
    return result.filePath
  })

  ipcMain.handle('system:reveal', async (_event, target: string) => {
    if (typeof target === 'string' && target) await shell.showItemInFolder(target)
  })

  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
