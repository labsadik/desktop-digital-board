import { useEffect, useMemo, useState } from 'react'
import { FloatingTools, Toolbar } from './Toolbar'
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

  const run = async (label: string, task: () => Promise<string | null | void>) => {
    setBusy(true); setMessage(label)
    try { const result = await task(); setMessage(typeof result === 'string' ? `Saved: ${result}` : 'Ready') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Operation failed') }
    finally { setBusy(false) }
  }

  const save = () => run(project.sourceFormat === 'pdf' ? 'Saving PDF…' : project.sourceFormat === 'pptx' ? 'Saving PowerPoint…' : 'Saving project…', async () => {
    if (project.sourceFormat === 'pdf') return window.desktop.exportPdf(projectToPdfHtml(project), project.name)
    if (project.sourceFormat === 'pptx') return window.desktop.exportPptx(project)
    return window.desktop.saveProject(project)
  })
  const open = () => run('Opening…', async () => { const loaded = await window.desktop.openProject(); if (loaded) loadProject(loaded); return null })
  const importPdf = () => run('Importing PDF…', async () => { const dataUrl = await window.desktop.importPdf(); if (dataUrl) loadProject(await importPdfProject(dataUrl)); return null })
  const importPptx = () => run('Importing PowerPoint…', async () => { const dataUrl = await window.desktop.importPptx(); if (dataUrl) loadProject(await importPptxProject(dataUrl)); return null })
  const importImage = () => run('Importing image…', async () => { const src = await window.desktop.importImage(); if (!src) return null; useEditorStore.getState().addElement({ id: crypto.randomUUID(), type: 'image', x: 1, y: 1, width: 4, height: 2.5, rotation: 0, src }); return null })
  const exportPdf = () => run('Exporting PDF…', () => window.desktop.exportPdf(projectToPdfHtml(project), project.name))
  const exportPptx = () => run('Exporting PowerPoint…', () => window.desktop.exportPptx(project))
  const exportPng = () => run('Exporting PNG…', async () => page ? window.desktop.exportPng(pageToSvg(page), `${project.name}-${page.name}`) : null)

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey
      if (mod && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); return }
      if (mod && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); return }
      if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); void save(); return }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElementId) {
        const tag = (event.target as HTMLElement | null)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        event.preventDefault(); removeElement(currentPageId, selectedElementId)
      }
    }
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler)
  }, [currentPageId, removeElement, redo, save, selectedElementId, undo])

  const saveLabel = project.sourceFormat === 'pdf' ? 'Save PDF' : project.sourceFormat === 'pptx' ? 'Save PPTX' : 'Save Project'

  return <div className="app-shell">
    <Toolbar saveLabel={saveLabel} onSave={save} onOpen={open} onImportPdf={importPdf} onImportPptx={importPptx} onExportPptx={exportPptx} onExportPdf={exportPdf} onExportPng={exportPng} onImage={importImage} leftSidebarOpen={leftSidebarOpen} rightSidebarOpen={rightSidebarOpen} onToggleLeftSidebar={() => setLeftSidebarOpen((value) => !value)} onToggleRightSidebar={() => setRightSidebarOpen((value) => !value)} />
    <div className="editor-layout">
      {leftSidebarOpen && <PageSidebar />}
      <EditorCanvas />
      <FloatingTools />
      {rightSidebarOpen && <aside className="right-panel">
        <div className="panel-title">Document</div>
        <label>Project name<input value={project.name} onChange={(event) => setProjectName(event.target.value)} /></label>
        {page && <label>Page name<input value={page.name} onChange={(event) => renamePage(page.id, event.target.value)} /></label>}
        <div className="panel-card"><strong>Canvas</strong><span>{project.width.toFixed(2)} × {project.height.toFixed(2)} in</span><span>{project.pages.length} pages</span><span>{page?.elements.length ?? 0} elements</span></div>
        <div className="panel-card"><strong>Source</strong><span>{project.sourceFormat === 'pdf' ? 'Imported PDF' : project.sourceFormat === 'pptx' ? 'Imported PowerPoint' : 'Native Note Replace project'}</span></div>
        <div className="panel-card"><strong>Saving</strong><span>Save opens the Windows save dialog.</span><span>Ctrl/Cmd+S saves in the current format.</span></div>
      </aside>}
    </div>
    <div className="app-status"><span>{busy ? '● Working' : '● Ready'} — {message}</span><span>{project.pages.length} pages • {page?.elements.length ?? 0} elements</span></div>
  </div>
}
