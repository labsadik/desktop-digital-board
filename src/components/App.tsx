import { useEffect, useMemo, useState } from 'react'
import { Toolbar } from './Toolbar'
import { PageSidebar } from './PageSidebar'
import { EditorCanvas } from './EditorCanvas'
import { useEditorStore } from '../stores/editor.store'
import { importPdfProject } from '../lib/import-pdf'
import { importPptxProject } from '../lib/import-pptx'
import { pageToSvg, projectToPdfHtml } from '../lib/export-html'

export function App() {
  const project = useEditorStore((s) => s.project)
  const currentPageId = useEditorStore((s) => s.currentPageId)
  const loadProject = useEditorStore((s) => s.loadProject)
  const setProjectName = useEditorStore((s) => s.setProjectName)
  const renamePage = useEditorStore((s) => s.renamePage)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const selectedElementId = useEditorStore((s) => s.selectedElementId)
  const removeElement = useEditorStore((s) => s.removeElement)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Ready')
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)

  const page = useMemo(() => project.pages.find((item) => item.id === currentPageId) ?? project.pages[0], [project.pages, currentPageId])

  const run = async (label: string, task: () => Promise<void>) => {
    setBusy(true)
    setMessage(label)
    try {
      await task()
      setMessage('Ready')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Operation failed')
    } finally {
      setBusy(false)
    }
  }

  const save = () => run('Saving…', async () => {
    const path = await window.desktop.saveProject(project)
    if (path) setMessage(`Saved: ${path}`)
  })

  const open = () => run('Opening…', async () => {
    const loaded = await window.desktop.openProject()
    if (loaded) loadProject(loaded)
  })

  const importPdf = () => run('Importing PDF…', async () => {
    const dataUrl = await window.desktop.importPdf()
    if (dataUrl) loadProject(await importPdfProject(dataUrl))
  })

  const importPptx = () => run('Importing PowerPoint…', async () => {
    const dataUrl = await window.desktop.importPptx()
    if (dataUrl) loadProject(await importPptxProject(dataUrl))
  })

  const importImage = () => run('Importing image…', async () => {
    const src = await window.desktop.importImage()
    if (!src) return
    useEditorStore.getState().addElement({ id: crypto.randomUUID(), type: 'image', x: 1, y: 1, width: 4, height: 2.5, rotation: 0, src })
  })

  const exportPdf = () => run('Exporting PDF…', async () => {
    await window.desktop.exportPdf(projectToPdfHtml(project), project.name)
  })

  const exportPptx = () => run('Exporting PowerPoint…', async () => {
    await window.desktop.exportPptx(project)
  })

  const exportPng = () => run('Exporting PNG…', async () => {
    if (page) await window.desktop.exportPng(pageToSvg(page), `${project.name}-${page.name}`)
  })

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey
      if (mod && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); return }
      if (mod && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); return }
      if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); void save(); return }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElementId) {
        const tag = (event.target as HTMLElement | null)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        event.preventDefault()
        removeElement(currentPageId, selectedElementId)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentPageId, removeElement, redo, save, selectedElementId, undo])

  return (
    <div className="app-shell">
      <Toolbar
        onSave={save}
        onOpen={open}
        onImportPdf={importPdf}
        onImportPptx={importPptx}
        onExportPptx={exportPptx}
        onExportPdf={exportPdf}
        onExportPng={exportPng}
        onImage={importImage}
        leftSidebarOpen={leftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
        onToggleLeftSidebar={() => setLeftSidebarOpen((value) => !value)}
        onToggleRightSidebar={() => setRightSidebarOpen((value) => !value)}
      />
      <div className="editor-layout">
        {leftSidebarOpen && <PageSidebar />}
        <EditorCanvas />
        {rightSidebarOpen && <aside className="right-panel">
          <div className="panel-title">Document</div>
          <label>Project name<input value={project.name} onChange={(event) => setProjectName(event.target.value)} /></label>
          {page && <label>Page name<input value={page.name} onChange={(event) => renamePage(page.id, event.target.value)} /></label>}
          <div className="panel-card"><strong>Canvas</strong><span>{project.width.toFixed(2)} × {project.height.toFixed(2)} in</span><span>{project.pages.length} pages</span><span>{page?.elements.length ?? 0} elements</span></div>
          <div className="panel-card"><strong>Shortcuts</strong><span>Click and drag objects.</span><span>Double-click text to edit.</span><span>Delete removes selection.</span><span>Ctrl/Cmd+Z / Y undo and redo.</span></div>
        </aside>}
      </div>
      <div className="app-status"><span>{busy ? '● Working' : '● Ready'} — {message}</span><span>{project.pages.length} pages • {page?.elements.length ?? 0} elements</span></div>
    </div>
  )
}
