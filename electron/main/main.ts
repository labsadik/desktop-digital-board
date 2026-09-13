import { app, BrowserWindow, dialog, ipcMain, nativeImage, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
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
    webPreferences: { preload: path.join(__dirname, '../preload/preload.js'), contextIsolation: true, sandbox: false, nodeIntegration: false, spellcheck: true },
  })
  mainWindow.on('closed', () => { mainWindow = null })
  if (!app.isPackaged) void mainWindow.loadURL('http://127.0.0.1:5173')
  else void mainWindow.loadFile(path.join(__dirname, '../../../dist/index.html'))
}

function safeName(name: string) { return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim() || 'Untitled' }
function toDataUrl(pathname: string) {
  const extension = path.extname(pathname).toLowerCase().slice(1)
  const mime = extension === 'svg' ? 'image/svg+xml' : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : extension === 'webp' ? 'image/webp' : extension === 'gif' ? 'image/gif' : extension === 'pdf' ? 'application/pdf' : extension === 'pptx' ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' : 'image/png'
  return fs.readFile(pathname).then((buffer) => `data:${mime};base64,${buffer.toString('base64')}`)
}
function showOpen(options: Electron.OpenDialogOptions) { return mainWindow && !mainWindow.isDestroyed() ? dialog.showOpenDialog(mainWindow, options) : dialog.showOpenDialog(options) }
function showSave(options: Electron.SaveDialogOptions) { return mainWindow && !mainWindow.isDestroyed() ? dialog.showSaveDialog(mainWindow, options) : dialog.showSaveDialog(options) }
async function atomicReplace(tempPath: string, targetPath: string) { await fs.rm(targetPath, { force: true }); await fs.rename(tempPath, targetPath) }
async function writeAtomic(targetPath: string, data: string | Uint8Array) {
  const directory = path.dirname(targetPath)
  const temporary = path.join(directory, `.${path.basename(targetPath)}.${randomUUID()}.tmp`)
  try { await fs.writeFile(temporary, data); await atomicReplace(temporary, targetPath) } finally { await fs.rm(temporary, { force: true }).catch(() => undefined) }
}
async function makeTempDir() { return fs.mkdtemp(path.join(app.getPath('temp'), 'note-replace-')) }

app.whenReady().then(() => {
  ipcMain.handle('file:open-project', async () => {
    const result = await showOpen({ properties: ['openFile'], filters: [{ name: 'Note Replace Project', extensions: ['myed', 'json'] }] })
    if (result.canceled || !result.filePaths[0]) return null
    try {
      const parsed = JSON.parse(await fs.readFile(result.filePaths[0], 'utf8'))
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.pages)) throw new Error('Invalid project file')
      return parsed
    } catch (error) {
      if (mainWindow && !mainWindow.isDestroyed()) await dialog.showMessageBox(mainWindow, { type: 'error', title: 'Open project failed', message: error instanceof Error ? error.message : 'The selected project is invalid.' })
      return null
    }
  })

  ipcMain.handle('file:save-project', async (_event, project: unknown) => {
    if (!project || typeof project !== 'object') throw new Error('Invalid project')
    const candidate = project as { name?: unknown }
    const result = await showSave({ filters: [{ name: 'Note Replace Project', extensions: ['myed'] }], defaultPath: `${safeName(typeof candidate.name === 'string' ? candidate.name : 'Untitled')}.myed` })
    if (result.canceled || !result.filePath) return null
    await writeAtomic(result.filePath, JSON.stringify(project, null, 2))
    return result.filePath
  })

  ipcMain.handle('file:import-image', async () => {
    const result = await showOpen({ properties: ['openFile'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] }] })
    if (result.canceled || !result.filePaths[0]) return null
    return toDataUrl(result.filePaths[0])
  })
  ipcMain.handle('file:import-pdf', async () => {
    const result = await showOpen({ properties: ['openFile'], filters: [{ name: 'PDF documents', extensions: ['pdf'] }] })
    if (result.canceled || !result.filePaths[0]) return null
    return toDataUrl(result.filePaths[0])
  })
  ipcMain.handle('file:import-pptx', async () => {
    const result = await showOpen({ properties: ['openFile'], filters: [{ name: 'PowerPoint presentations', extensions: ['pptx'] }] })
    if (result.canceled || !result.filePaths[0]) return null
    return toDataUrl(result.filePaths[0])
  })

  ipcMain.handle('export:pptx', async (_event, project: Parameters<typeof createPptx>[0]) => {
    const result = await showSave({ defaultPath: `${safeName(project.name || 'presentation')}.pptx`, filters: [{ name: 'PowerPoint', extensions: ['pptx'] }] })
    if (result.canceled || !result.filePath) return null
    const temporary = path.join(path.dirname(result.filePath), `.${path.basename(result.filePath)}.${randomUUID()}.tmp.pptx`)
    try {
      await createPptx(project, temporary)
      const stat = await fs.stat(temporary)
      if (stat.size < 1024) throw new Error('PowerPoint export produced an invalid file.')
      await atomicReplace(temporary, result.filePath)
      return result.filePath
    } finally { await fs.rm(temporary, { force: true }).catch(() => undefined) }
  })

  ipcMain.handle('export:pdf', async (_event, html: string, fileName: string) => {
    if (typeof html !== 'string' || html.length > 250_000_000) throw new Error('Export payload is too large.')
    const result = await showSave({ defaultPath: `${safeName(fileName || 'presentation')}.pdf`, filters: [{ name: 'PDF', extensions: ['pdf'] }] })
    if (result.canceled || !result.filePath) return null
    const temporary = path.join(path.dirname(result.filePath), `.${path.basename(result.filePath)}.${randomUUID()}.tmp.pdf`)
    const tempDir = await makeTempDir()
    const htmlPath = path.join(tempDir, 'document.html')
    const exportWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } })
    try {
      await fs.writeFile(htmlPath, html, 'utf8')
      await exportWindow.loadFile(htmlPath)
      const pdf = await exportWindow.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true })
      if (pdf.length < 1024) throw new Error('PDF export produced an invalid file.')
      await fs.writeFile(temporary, pdf)
      await atomicReplace(temporary, result.filePath)
      return result.filePath
    } finally {
      if (!exportWindow.isDestroyed()) exportWindow.destroy()
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
      await fs.rm(temporary, { force: true }).catch(() => undefined)
    }
  })

  ipcMain.handle('export:png', async (_event, svg: string, fileName: string) => {
    if (typeof svg !== 'string' || !svg.startsWith('<svg')) throw new Error('Invalid SVG export.')
    const result = await showSave({ defaultPath: `${safeName(fileName || 'page')}.png`, filters: [{ name: 'PNG image', extensions: ['png'] }] })
    if (result.canceled || !result.filePath) return null
    const image = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`)
    if (image.isEmpty()) throw new Error('Could not render the page image.')
    await writeAtomic(result.filePath, image.toPNG())
    return result.filePath
  })

  ipcMain.handle('system:reveal', async (_event, target: string) => { if (typeof target === 'string' && target) await shell.showItemInFolder(target) })
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
