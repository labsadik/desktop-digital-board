import { Copy, Download, Eraser, FilePlus2, FileUp, Highlighter, ImagePlus, Minus, MousePointer2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, PenLine, Plus, Redo2, Save, Square, Trash2, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useEditorStore } from '../stores/editor.store'
import logoUrl from '../../assets/logo.png'

interface Props { saveLabel: string; onSave: () => void; onOpen: () => void; onImportPdf: () => void; onImportPptx: () => void; onExportPptx: () => void; onExportPdf: () => void; onExportPng: () => void; onImage: () => void; leftSidebarOpen: boolean; rightSidebarOpen: boolean; onToggleLeftSidebar: () => void; onToggleRightSidebar: () => void }

export function Toolbar({ saveLabel, onSave, onOpen, onImportPdf, onImportPptx, onExportPptx, onExportPdf, onExportPng, onImage, leftSidebarOpen, rightSidebarOpen, onToggleLeftSidebar, onToggleRightSidebar }: Props) {
  const addPage = useEditorStore((s) => s.addPage)
  const duplicatePage = useEditorStore((s) => s.duplicatePage)
  const deletePage = useEditorStore((s) => s.deletePage)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const zoom = useEditorStore((s) => s.zoom)
  const setZoom = useEditorStore((s) => s.setZoom)
  const [openMenu, setOpenMenu] = useState<'pdf' | 'pptx' | null>(null)
  const toolButton = (name: string, icon: ReactNode, onClick: () => void, active = false) => <button type="button" title={name} aria-label={name} className={`tool ${active ? 'active' : ''}`} onClick={onClick}>{icon}</button>
  const menuButton = (label: string, menu: 'pdf' | 'pptx') => <div className="menu-wrap"><button type="button" className="secondary menu-trigger" onClick={() => setOpenMenu(openMenu === menu ? null : menu)} aria-expanded={openMenu === menu}><FileUp size={15} /><span>{label}</span><span className="menu-caret">▾</span></button>{openMenu === menu && <div className="tool-menu" role="menu"><button type="button" onClick={() => { setOpenMenu(null); menu === 'pdf' ? onImportPdf() : onImportPptx() }}>{label} Import</button><button type="button" onClick={() => { setOpenMenu(null); menu === 'pdf' ? onExportPdf() : onExportPptx() }}>{label} Export</button><button type="button" onClick={() => { setOpenMenu(null); menu === 'pdf' ? onExportPptx() : onExportPdf() }}>{menu === 'pdf' ? 'PDF → PPTX' : 'PPTX → PDF'}</button></div>}</div>
  return <header className="topbar"><div className="toolbar-inner"><div className="brand"><img className="brand-logo" src={logoUrl} alt="Note Replace" /><span>Note Replace</span></div><div className="toolbar-section compact">{toolButton('Left sidebar', leftSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />, onToggleLeftSidebar, leftSidebarOpen)}{toolButton('Right sidebar', rightSidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />, onToggleRightSidebar, rightSidebarOpen)}</div><div className="toolbar-section">{toolButton('Undo', <Undo2 size={16} />, undo)}{toolButton('Redo', <Redo2 size={16} />, redo)}</div><div className="toolbar-section">{toolButton('Blank page', <Plus size={16} />, addPage)}{toolButton('Duplicate page', <Copy size={16} />, duplicatePage)}{toolButton('Delete page', <Trash2 size={16} />, deletePage)}</div><div className="toolbar-section zoom-group">{toolButton('Zoom out', <ZoomOut size={16} />, () => setZoom(zoom - 0.1))}<span className="zoom-value">{Math.round(zoom * 100)}%</span>{toolButton('Zoom in', <ZoomIn size={16} />, () => setZoom(zoom + 0.1))}{toolButton('Reset zoom', <Minus size={16} />, () => setZoom(1))}</div><div className="toolbar-section document-actions"><button type="button" className="secondary" onClick={onOpen}><FilePlus2 size={15} />Open</button><button type="button" className="secondary save-button" onClick={onSave}><Save size={15} />{saveLabel}</button>{menuButton('PDF', 'pdf')}{menuButton('PPTX', 'pptx')}<button type="button" className="secondary" onClick={onImage}><ImagePlus size={15} />Image</button><button type="button" className="secondary" onClick={onExportPng}><Download size={15} />PNG</button></div></div></header>
}

export function FloatingTools() {
  const tool = useEditorStore((s) => s.tool)
  const penColor = useEditorStore((s) => s.penColor)
  const setTool = useEditorStore((s) => s.setTool)
  const setPenColor = useEditorStore((s) => s.setPenColor)
  const button = (name: string, icon: ReactNode, value: typeof tool) => <button type="button" title={name} aria-label={name} className={`floating-tool ${tool === value ? 'active' : ''}`} onClick={() => setTool(value)}>{icon}</button>
  const colors = [{ value: '#111827', label: 'Black' }, { value: '#2563eb', label: 'Blue' }, { value: '#dc2626', label: 'Red' }]
  return <div className="floating-tools" aria-label="Board tools">{button('Select', <MousePointer2 size={17} />, 'select')}{button('Pen', <PenLine size={17} />, 'pen')}{tool === 'pen' && <div className="pen-colors" aria-label="Pen colors">{colors.map((color) => <button key={color.value} type="button" className={`pen-color ${penColor === color.value ? 'active' : ''}`} title={`${color.label} pen`} aria-label={`${color.label} pen`} style={{ background: color.value }} onClick={() => setPenColor(color.value)} />)}</div>}{button('Highlighter', <Highlighter size={17} />, 'highlighter')}{button('Eraser', <Eraser size={17} />, 'eraser')}{button('Rectangle', <Square size={17} />, 'shape')}</div>
}
