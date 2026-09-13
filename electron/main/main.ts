import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
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
    backgroundColor: '#11131a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  })

  if (!app.isPackaged) {
    void mainWindow.loadURL('http://127.0.0.1:5173')
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('file:open-project', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Note Replace Project', extensions: ['myed', 'json'] }],
    })
    if (result.canceled || !result.filePaths[0]) return null
    return JSON.parse(await fs.readFile(result.filePaths[0], 'utf8'))
  })

  ipcMain.handle('file:save-project', async (_event, project: unknown) => {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'Note Replace Project', extensions: ['myed'] }],
      defaultPath: 'Untitled.myed',
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
    return result.canceled ? null : result.filePaths[0] ?? null
  })

  ipcMain.handle('export:pptx', async (_event, project: Parameters<typeof createPptx>[0]) => {
    const result = await dialog.showSaveDialog({
      defaultPath: `${project.name || 'presentation'}.pptx`,
      filters: [{ name: 'PowerPoint', extensions: ['pptx'] }],
    })
    if (result.canceled || !result.filePath) return null
    await createPptx(project, result.filePath)
    return result.filePath
  })

  ipcMain.handle('export:pdf', async (_event, html: string, fileName: string) => {
    const result = await dialog.showSaveDialog({
      defaultPath: `${fileName || 'presentation'}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })
    if (result.canceled || !result.filePath) return null
    const exportWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true } })
    try {
      await exportWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      const pdf = await exportWindow.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true })
      await fs.writeFile(result.filePath, pdf)
      return result.filePath
    } finally {
      exportWindow.close()
    }
  })

  ipcMain.handle('system:reveal', async (_event, target: string) => {
    await shell.showItemInFolder(target)
  })

  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
