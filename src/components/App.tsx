import { FilePlus2, FileText, LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FloatingTools, Toolbar } from './Toolbar'
import { PageSidebar } from './PageSidebar'
import { EditorCanvas } from './EditorCanvas'
import { useEditorStore } from '../stores/editor.store'
import { importPdfProject, waitForPdfImports, type PdfImportProgress } from '../lib/import-pdf'
import { pageToSvg, projectToPdfPages } from '../lib/export-html'
import logoUrl from '../../assets/logo.png'

export function App() {
  const project = useEditorStore((s) => s.project)
  const currentPageId = useEditorStore((s) => s.currentPageId)
  const loadProject = useEditorStore((s) => s.loadProject)
  const hydrateElement = useEditorStore((s) => s.hydrateElement)
  const setProjectName = useEditorStore((s) => s.setProjectName)
  const renamePage = useEditorStore((s) => s.renamePage)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const selectedElementId = useEditorStore((s) => s.selectedElementId)
  const removeElement = useEditorStore((s) => s.removeElement)
  const setTool = useEditorStore((s) => s.setTool)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Ready')
  const [pdfProgress, setPdfProgress] = useState<{ done: number; total: number } | null>(null)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [showStart, setShowStart] = useState(true)
  const page = useMemo(() => project.pages.find((item) => item.id === currentPageId) ?? project.pages[0], [project.pages, currentPageId])
  const pageIndex = Math.max(0, project.pages.findIndex((item) => item.id === currentPageId))

  const run = useCallback(async (label: string, task: () => Promise<string | null | void>) => {
    setBusy(true)
    setProgress(8)
    setMessage(label)
    const interval = window.setInterval(() => setProgress((value) => Math.min(92, value + Math.max(1, (92 - value) * 0.1))), 120)
    try {
      const result = await task()
      setProgress(100)
      setMessage(typeof result === 'string' ? `Saved: ${result}` : 'Ready')
      return result
    } catch (error) {
      setProgress(100)
      setMessage(error instanceof Error ? error.message : 'Operation failed')
      return null
    } finally {
      window.clearInterval(interval)
      window.setTimeout(() => { setBusy(false); setProgress(0) }, 220)
    }
  }, [])

  const save = useCallback(() => {
    void run(project.sourceFormat === 'pdf' ? 'Preparing PDF…' : 'Preparing project…', async () => {
      if (project.sourceFormat === 'pdf') await waitForPdfImports()
      const latestProject = useEditorStore.getState().project
      return latestProject.sourceFormat === 'pdf' ? window.desktop.exportPdf(projectToPdfPages(latestProject), latestProject.name) : window.desktop.saveProject(latestProject)
    })
  }, [project.sourceFormat, run])

  const open = useCallback(() => {
    void run('Opening project…', async () => {
      const loaded = await window.desktop.openProject()
      if (loaded) { loadProject(loaded); setShowStart(false); setPdfProgress(null) }
      return null
    })
  }, [loadProject, run])

  const handlePdfPageReady = useCallback((info: PdfImportProgress) => {
    hydrateElement(info.pageId, info.elementId, { src: info.src, previewSrc: info.src })
    setPdfProgress({ done: info.pageNumber, total: info.totalPages })
    if (info.pageNumber === info.totalPages) setTimeout(() => setPdfProgress(null), 250)
  }, [hydrateElement])

  const importPdf = useCallback(async () => {
    const dataUrl = await window.desktop.importPdf()
    if (!dataUrl) return
    await run('Importing PDF…', async () => {
      const imported = await importPdfProject(dataUrl, handlePdfPageReady)
      loadProject(imported)
      if (imported.pages.length > 1) setPdfProgress({ done: 1, total: imported.pages.length })
      else setPdfProgress(null)
      setShowStart(false)
      return null
    })
  }, [handlePdfPageReady, loadProject, run])

  const importImage = useCallback(async () => {
    const src = await window.desktop.importImage()
    if (!src) return
    await run('Importing image…', async () => {
      useEditorStore.getState().addElement({ id: crypto.randomUUID(), type: 'image', x: 1, y: 1, width: 4, height: 2.5, rotation: 0, src })
      return null
    })
  }, [run])

  const exportPdf = useCallback(() => {
    void run('Preparing PDF export…', async () => {
      if (project.sourceFormat === 'pdf') await waitForPdfImports()
      const latestProject = useEditorStore.getState().project
      return window.desktop.exportPdf(projectToPdfPages(latestProject), latestProject.name)
    })
  }, [project.sourceFormat, run])

  const exportPng = useCallback(() => {
    void run('Preparing PNG export…', async () => {
      if (project.sourceFormat === 'pdf') await waitForPdfImports()
      const latestProject = useEditorStore.getState().project
      const current = latestProject.pages.find((item) => item.id === currentPageId) ?? latestProject.pages[0]
      return current ? window.desktop.exportPng(pageToSvg(current), `${latestProject.name}-${current.name}`) : null
    })
  }, [currentPageId, project.sourceFormat, run])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable
      if (!typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const shortcuts: Record<string, Parameters<typeof setTool>[0]> = { v: 'select', p: 'pen', h: 'highlighter', r: 'shape', e: 'eraser' }
        const nextTool = shortcuts[event.key.toLowerCase()]
        if (nextTool) { event.preventDefault(); setTool(nextTool); return }
      }
      const mod = event.ctrlKey || event.metaKey
      if (mod && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); return }
      if (mod && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); return }
      if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); save(); return }
      if (!typing && (event.key === 'Delete' || event.key === 'Backspace') && selectedElementId) { event.preventDefault(); removeElement(currentPageId, selectedElementId) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentPageId, removeElement, redo, save, selectedElementId, setTool, undo])

  const saveLabel = project.sourceFormat === 'pdf' ? 'Save PDF' : 'Save Project'
  const chooseBlank = () => setShowStart(false)

  return <div className="app-shell">
    <Toolbar saveLabel={saveLabel} onSave={save} onOpen={open} onImportPdf={() => { void importPdf() }} onExportPdf={exportPdf} onExportPng={exportPng} onImage={() => { void importImage() }} leftSidebarOpen={leftSidebarOpen} rightSidebarOpen={rightSidebarOpen} onToggleLeftSidebar={() => setLeftSidebarOpen((value) => !value)} onToggleRightSidebar={() => setRightSidebarOpen((value) => !value)} />
    <div className="editor-layout">
      {leftSidebarOpen && <PageSidebar />}
      <div className="canvas-column board-column">
        <EditorCanvas />
        <FloatingTools />
      </div>
      {rightSidebarOpen && <aside className="right-panel">
        <div className="panel-title">Document</div>
        <label>Project name<input value={project.name} onChange={(event) => setProjectName(event.target.value)} /></label>
        {page && <label>Page name<input value={page.name} onChange={(event) => renamePage(page.id, event.target.value)} /></label>}
        <div className="panel-card"><strong>Canvas</strong><span>{project.width.toFixed(2)} × {project.height.toFixed(2)} in</span><span>{project.pages.length} pages</span><span>{page?.elements.length ?? 0} elements</span></div>
        <div className="panel-card"><strong>Current page</strong><span>Only the selected page is rendered on the canvas.</span><span>Choose a thumbnail to switch pages.</span></div>
        <div className="panel-card"><strong>Source</strong><span>{project.sourceFormat === 'pdf' ? 'Imported PDF' : 'Native Note Replace project'}</span></div>
      </aside>}
    </div>
    <div className="app-status"><span>{busy ? '● Working' : '● Ready'} — {message}</span><span>{pdfProgress ? `PDF pages ${pdfProgress.done}/${pdfProgress.total}` : `Page ${pageIndex + 1}/${project.pages.length} • ${page?.elements.length ?? 0} elements`}</span></div>
    {showStart && <div className="start-overlay"><div className="start-card"><div className="start-brand"><img src={logoUrl} alt="Note Replace" /><div><strong>Note Replace</strong><span>PDF editor</span></div></div><div className="start-title"><h1>What are you creating?</h1><p>Import a PDF or start with a clean digital-board page.</p></div><div className="start-options"><button type="button" className="start-option" onClick={() => { void importPdf() }}><span className="start-icon pdf"><FileText size={28} /></span><span><strong>Import PDF</strong><small>Open the first page immediately; remaining pages load in the background.</small></span><span className="start-arrow">→</span></button><button type="button" className="start-option" onClick={chooseBlank}><span className="start-icon blank"><FilePlus2 size={28} /></span><span><strong>Blank canvas</strong><small>Start with one page and add more with the + control.</small></span><span className="start-arrow">→</span></button></div><div className="start-footer">The selected page is the only page rendered in the main canvas.</div></div></div>}
    {busy && <div className="progress-overlay"><div className="progress-card"><div className="progress-spinner"><LoaderCircle size={25} /></div><div className="progress-copy"><strong>{message}</strong><span>Preparing the document…</span></div><b>{progress}%</b><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div></div>}
  </div>
}
