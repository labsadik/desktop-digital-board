import { Presentation, FileText, FilePlus2, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { FloatingTools, Toolbar } from './Toolbar'
import { PageSidebar } from './PageSidebar'
import { EditorCanvas } from './EditorCanvas'
import { useEditorStore } from '../stores/editor.store'
import { pageToSvg, projectToPdfHtml } from '../lib/export-html'
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

  const save = () => { void run(project.sourceFormat === 'pdf' ? 'Preparing PDF…' : project.sourceFormat === 'pptx' ? 'Preparing PowerPoint…' : 'Preparing project…', async () => project.sourceFormat === 'pdf' ? window.desktop.exportPdf(projectToPdfHtml(project), project.name, project.pages.length) : project.sourceFormat === 'pptx' ? window.desktop.exportPptx(project) : window.desktop.saveProject(project)) }
  const open = () => { void run('Opening project…', async () => { const loaded = await window.desktop.openProject(); if (loaded) { loadProject(loaded); setShowStart(false) } return null }) }
  const importPdf = async () => {
    const dataUrl = await window.desktop.importPdf()
    if (!dataUrl) return
    await run('Importing PDF…', async () => { const { importPdfProject } = await import('../lib/import-pdf'); loadProject(await importPdfProject(dataUrl)); setShowStart(false); return null })
  }
  const importPptx = async () => {
    const dataUrl = await window.desktop.importPptx()
    if (!dataUrl) return
    await run('Importing PowerPoint…', async () => { const { importPptxProject } = await import('../lib/import-pptx'); loadProject(await importPptxProject(dataUrl)); setShowStart(false); return null })
  }
  const importImage = async () => {
    const src = await window.desktop.importImage()
    if (!src) return
    await run('Importing image…', async () => { useEditorStore.getState().addElement({ id: crypto.randomUUID(), type: 'image', x: 1, y: 1, width: 4, height: 2.5, rotation: 0, src }); return null })
  }
  const exportPdf = () => { void run('Preparing PDF export…', () => window.desktop.exportPdf(projectToPdfHtml(project), project.name, project.pages.length)) }
  const exportPptx = () => { void run('Preparing PowerPoint export…', () => window.desktop.exportPptx(project)) }
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

  const saveLabel = project.sourceFormat === 'pdf' ? 'Save PDF' : project.sourceFormat === 'pptx' ? 'Save PPTX' : 'Save Project'
  const chooseBlank = () => setShowStart(false)

  return <div className="app-shell">
    <Toolbar saveLabel={saveLabel} onSave={save} onOpen={open} onImportPdf={() => { void importPdf() }} onImportPptx={() => { void importPptx() }} onExportPptx={exportPptx} onExportPdf={exportPdf} onExportPng={exportPng} onImage={() => { void importImage() }} leftSidebarOpen={leftSidebarOpen} rightSidebarOpen={rightSidebarOpen} onToggleLeftSidebar={() => setLeftSidebarOpen((value) => !value)} onToggleRightSidebar={() => setRightSidebarOpen((value) => !value)} />
    <div className="editor-layout">{leftSidebarOpen && <PageSidebar />}<div className="canvas-column"><EditorCanvas /><FloatingTools /></div>{rightSidebarOpen && <aside className="right-panel"><div className="panel-title">Document</div><label>Project name<input value={project.name} onChange={(event) => setProjectName(event.target.value)} /></label>{page && <label>Page name<input value={page.name} onChange={(event) => renamePage(page.id, event.target.value)} /></label>}<div className="panel-card"><strong>Canvas</strong><span>{project.width.toFixed(2)} × {project.height.toFixed(2)} in</span><span>{project.pages.length} pages</span><span>{page?.elements.length ?? 0} elements</span></div><div className="panel-card"><strong>Source</strong><span>{project.sourceFormat === 'pdf' ? 'Imported PDF' : project.sourceFormat === 'pptx' ? 'Imported PowerPoint' : 'Native Note Replace project'}</span></div><div className="panel-card"><strong>Saving</strong><span>Progress appears after a file is selected or export work actually begins.</span><span>Ctrl/Cmd+S saves in the current format.</span></div></aside>}</div>
    <div className="app-status"><span>{busy ? '● Working' : '● Ready'} — {message}</span><span>{project.pages.length} pages • {page?.elements.length ?? 0} elements</span></div>
    {showStart && <div className="start-overlay"><div className="start-card"><div className="start-brand"><img src={logoUrl} alt="Note Replace" /><div><strong>Note Replace</strong><span>Fast desktop document workspace</span></div></div><div className="start-title"><h1>What are you creating?</h1><p>Start from an existing document or open a clean blank canvas.</p></div><div className="start-options"><button type="button" className="start-option" onClick={() => { void importPdf() }}><span className="start-icon pdf"><FileText size={28} /></span><span><strong>Import PDF</strong><small>Turn every PDF page into an editable workspace.</small></span><span className="start-arrow">→</span></button><button type="button" className="start-option" onClick={() => { void importPptx() }}><span className="start-icon ppt"><Presentation size={28} /></span><span><strong>Import PowerPoint</strong><small>Bring a presentation into the page editor.</small></span><span className="start-arrow">→</span></button><button type="button" className="start-option" onClick={chooseBlank}><span className="start-icon blank"><FilePlus2 size={28} /></span><span><strong>Blank canvas</strong><small>Open a fresh white page and add pages only when needed.</small></span><span className="start-arrow">→</span></button></div><div className="start-footer">Your document stays local to this desktop app until you export or save it.</div></div></div>}
    {busy && <div className="progress-overlay"><div className="progress-card"><div className="progress-spinner"><LoaderCircle size={25} /></div><div className="progress-copy"><strong>{message}</strong><span>Working on the selected document…</span></div><b>{progress}%</b><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div></div>}
  </div>
}
