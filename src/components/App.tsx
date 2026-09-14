import { FilePlus2, FileText, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { FloatingTools, Toolbar } from './Toolbar'
import { PageSidebar } from './PageSidebar'
import { EditorCanvas } from './EditorCanvas'
import { useEditorStore } from '../stores/editor.store'
import { pageToSvg, projectToPdfPages } from '../lib/export-html'
import logoUrl from '../../assets/logo.png'

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
  const setTool = useEditorStore((s) => s.setTool)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Ready')
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [showStart, setShowStart] = useState(true)
  const page = useMemo(() => project.pages.find((item) => item.id === currentPageId) ?? project.pages[0], [project.pages, currentPageId])
  const pageIndex = Math.max(0, project.pages.findIndex((item) => item.id === currentPageId))

  const run = async (label: string, task: () => Promise<string | null | void>) => {
    setBusy(true)
    setProgress(8)
    setMessage(label)
    const interval = window.setInterval(() => setProgress((value) => Math.min(92, value + Math.max(1, (92 - value) * 0.08))), 120)
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
      window.setTimeout(() => { setBusy(false); setProgress(0) }, 260)
    }
  }

  const save = () => { void run(project.sourceFormat === 'pdf' ? 'Preparing PDF…' : 'Preparing project…', async () => project.sourceFormat === 'pdf' ? window.desktop.exportPdf(projectToPdfPages(project), project.name) : window.desktop.saveProject(project)) }
  const open = () => { void run('Opening project…', async () => { const loaded = await window.desktop.openProject(); if (loaded) { loadProject(loaded); setShowStart(false) } return null }) }
  const importPdf = async () => { const dataUrl = await window.desktop.importPdf(); if (!dataUrl) return; await run('Importing PDF…', async () => { const { importPdfProject } = await import('../lib/import-pdf'); loadProject(await importPdfProject(dataUrl)); setShowStart(false); return null }) }
  const importImage = async () => { const src = await window.desktop.importImage(); if (!src) return; await run('Importing image…', async () => { useEditorStore.getState().addElement({ id: crypto.randomUUID(), type: 'image', x: 1, y: 1, width: 4, height: 2.5, rotation: 0, src }); return null }) }
  const exportPdf = () => { void run('Preparing PDF export…', () => window.desktop.exportPdf(projectToPdfPages(project), project.name)) }
  const exportPng = () => { void run('Preparing PNG export…', async () => page ? window.desktop.exportPng(pageToSvg(page), `${project.name}-${page.name}`) : null) }

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
        <div className="board-header"><span className="board-label">Digital board</span><span className="board-page-count">Page {pageIndex + 1} of {project.pages.length}</span><strong>{page?.name ?? 'Page'}</strong></div>
        <EditorCanvas />
        <FloatingTools />
      </div>
      {rightSidebarOpen && <aside className="right-panel"><div className="panel-title">Document</div><label>Project name<input value={project.name} onChange={(event) => setProjectName(event.target.value)} /></label>{page && <label>Page name<input value={page.name} onChange={(event) => renamePage(page.id, event.target.value)} /></label>}<div className="panel-card"><strong>Canvas</strong><span>{project.width.toFixed(2)} × {project.height.toFixed(2)} in</span><span>{project.pages.length} pages</span><span>{page?.elements.length ?? 0} elements</span></div><div className="panel-card"><strong>Current page</strong><span>Only the selected page is rendered on the canvas.</span><span>Choose a thumbnail to switch pages.</span></div><div className="panel-card"><strong>Source</strong><span>{project.sourceFormat === 'pdf' ? 'Imported PDF' : 'Native Note Replace project'}</span></div><div className="panel-card"><strong>Saving</strong><span>PDF export uses each page's exact canvas dimensions.</span><span>Ctrl/Cmd+S saves the current document.</span></div></aside>}
    </div>
    <div className="app-status"><span>{busy ? '● Working' : '● Ready'} — {message}</span><span>Page {pageIndex + 1}/{project.pages.length} • {page?.elements.length ?? 0} elements</span></div>
    {showStart && <div className="start-overlay"><div className="start-card"><div className="start-brand"><img src={logoUrl} alt="Note Replace" /><div><strong>Note Replace</strong><span>Digital board workspace</span></div></div><div className="start-title"><h1>What are you creating?</h1><p>Import a PDF or start with a clean digital-board page.</p></div><div className="start-options"><button type="button" className="start-option" onClick={() => { void importPdf() }}><span className="start-icon pdf"><FileText size={28} /></span><span><strong>Import PDF</strong><small>Import every PDF page into the vertical page strip.</small></span><span className="start-arrow">→</span></button><button type="button" className="start-option" onClick={chooseBlank}><span className="start-icon blank"><FilePlus2 size={28} /></span><span><strong>Blank canvas</strong><small>Start with one page and add more with the + control.</small></span><span className="start-arrow">→</span></button></div><div className="start-footer">The selected page is the only page rendered in the main canvas.</div></div></div>}
    {busy && <div className="progress-overlay"><div className="progress-card"><div className="progress-spinner"><LoaderCircle size={25} /></div><div className="progress-copy"><strong>{message}</strong><span>Working on the selected document…</span></div><b>{progress}%</b><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div></div>}
  </div>
}
