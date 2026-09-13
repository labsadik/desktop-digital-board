import { Copy, Download, Eraser, FilePlus2, FileUp, Highlighter, ImagePlus, LayoutPanelLeft, LayoutPanelRight, Minus, MousePointer2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, PenLine, Plus, Redo2, Save, Square, Trash2, Type, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEditorStore } from '../stores/editor.store'

interface Props {
  onSave: () => void
  onOpen: () => void
  onImportPdf: () => void
  onImportPptx: () => void
  onExportPptx: () => void
  onExportPdf: () => void
  onExportPng: () => void
  onImage: () => void
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  onToggleLeftSidebar: () => void
  onToggleRightSidebar: () => void
}

export function Toolbar({ onSave, onOpen, onImportPdf, onImportPptx, onExportPptx, onExportPdf, onExportPng, onImage, leftSidebarOpen, rightSidebarOpen, onToggleLeftSidebar, onToggleRightSidebar }: Props) {
  const tool = useEditorStore((s) => s.tool)
  const setTool = useEditorStore((s) => s.setTool)
  const addPage = useEditorStore((s) => s.addPage)
  const duplicatePage = useEditorStore((s) => s.duplicatePage)
  const deletePage = useEditorStore((s) => s.deletePage)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const zoom = useEditorStore((s) => s.zoom)
  const setZoom = useEditorStore((s) => s.setZoom)

  const button = (name: string, icon: ReactNode, onClick: () => void, active = false, disabled = false) => <button type="button" title={name} aria-label={name} className={`tool ${active ? 'active' : ''}`} disabled={disabled} onClick={onClick}>{icon}</button>

  return <header className="topbar">
    <div className="brand"><span className="brand-mark">N</span><span>Note Replace</span></div>
    <div className="toolbar-group primary-tools">
      {button('Left sidebar', leftSidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />, onToggleLeftSidebar, leftSidebarOpen)}
      {button('Right sidebar', rightSidebarOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />, onToggleRightSidebar, rightSidebarOpen)}
      {button('Select / move', <MousePointer2 size={17} />, () => setTool('select'), tool === 'select')}
      {button('Pen', <PenLine size={17} />, () => setTool('pen'), tool === 'pen')}
      {button('Highlighter', <Highlighter size={17} />, () => setTool('highlighter'), tool === 'highlighter')}
      {button('Eraser', <Eraser size={17} />, () => setTool('eraser'), tool === 'eraser')}
      {button('Text', <Type size={17} />, () => setTool('text'), tool === 'text')}
      {button('Rectangle', <Square size={17} />, () => setTool('shape'), tool === 'shape')}
      {button('Add image', <ImagePlus size={17} />, onImage)}
    </div>
    <div className="toolbar-group center-actions">
      {button('Undo', <Undo2 size={17} />, undo)}
      {button('Redo', <Redo2 size={17} />, redo)}
      {button('Add page', <Plus size={17} />, addPage)}
      {button('Duplicate page', <Copy size={17} />, duplicatePage)}
      {button('Delete page', <Trash2 size={17} />, deletePage)}
      {button('Zoom out', <ZoomOut size={17} />, () => setZoom(zoom - 0.1))}
      <span className="zoom-value">{Math.round(zoom * 100)}%</span>
      {button('Zoom in', <ZoomIn size={17} />, () => setZoom(zoom + 0.1))}
      {button('Reset zoom', <Minus size={17} />, () => setZoom(1))}
    </div>
    <div className="toolbar-group end-actions">
      <button type="button" className="secondary" onClick={onOpen}><FilePlus2 size={16} />Open</button>
      <button type="button" className="secondary" onClick={onImportPdf}><FileUp size={16} />PDF Import</button>
      <button type="button" className="secondary" onClick={onImportPptx}><FileUp size={16} />PPTX Import</button>
      <button type="button" className="secondary" onClick={onSave}><Save size={16} />Save</button>
      <button type="button" className="secondary" onClick={onExportPng}><Download size={16} />PNG</button>
      <button type="button" className="secondary" onClick={onExportPptx}><Download size={16} />PPTX Export</button>
      <button type="button" className="primary" onClick={onExportPdf}><Download size={16} />PDF Export</button>
    </div>
  </header>
}
