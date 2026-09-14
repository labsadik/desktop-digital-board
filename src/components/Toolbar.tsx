import { Copy, Download, Eraser, FileText, FolderOpen, Highlighter, ImagePlus, Info, Minus, MousePointer2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, PenLine, Plus, Redo2, Save, Square, Trash2, Undo2, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useEditorStore } from '../stores/editor.store'
import type { DrawingStyle, ShapeKind } from '../types/document'

interface Props {
  onSave: () => void
  onOpen: () => void
  onImportPdf: () => void
  onExportPng: () => void
  onImage: () => void
  onAbout: () => void
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  onToggleLeftSidebar: () => void
  onToggleRightSidebar: () => void
}

export function Toolbar({ onSave, onOpen, onImportPdf, onExportPng, onImage, onAbout, leftSidebarOpen, rightSidebarOpen, onToggleLeftSidebar, onToggleRightSidebar }: Props) {
  const addPage = useEditorStore((s) => s.addPage)
  const duplicatePage = useEditorStore((s) => s.duplicatePage)
  const deletePage = useEditorStore((s) => s.deletePage)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const zoom = useEditorStore((s) => s.zoom)
  const setZoom = useEditorStore((s) => s.setZoom)
  const toolButton = (name: string, icon: ReactNode, onClick: () => void, active = false) => <button type="button" title={name} aria-label={name} className={`tool ${active ? 'active' : ''}`} onClick={onClick}>{icon}</button>

  return <header className="topbar"><div className="toolbar-inner">
    <div className="toolbar-section compact" aria-label="Panels">
      {toolButton('Toggle pages sidebar', leftSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />, onToggleLeftSidebar, leftSidebarOpen)}
      {toolButton('Toggle properties sidebar', rightSidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />, onToggleRightSidebar, rightSidebarOpen)}
    </div>
    <div className="toolbar-section" aria-label="History">{toolButton('Undo', <Undo2 size={16} />, undo)}{toolButton('Redo', <Redo2 size={16} />, redo)}</div>
    <div className="toolbar-section page-actions-toolbar" aria-label="Pages">{toolButton('Add page', <Plus size={16} />, addPage)}{toolButton('Duplicate page', <Copy size={16} />, duplicatePage)}{toolButton('Delete page', <Trash2 size={16} />, deletePage)}</div>
    <div className="toolbar-section zoom-group" aria-label="Zoom">{toolButton('Zoom out', <ZoomOut size={16} />, () => setZoom(zoom - 0.1))}<span className="zoom-value" aria-live="polite">{Math.round(zoom * 100)}%</span>{toolButton('Zoom in', <ZoomIn size={16} />, () => setZoom(zoom + 0.1))}{toolButton('Reset zoom to 65%', <Minus size={16} />, () => setZoom(0.65))}</div>
    <div className="toolbar-spacer" />
    <div className="toolbar-section document-actions" aria-label="Document actions">
      {toolButton('Open project', <FolderOpen size={16} />, onOpen)}{toolButton('Save', <Save size={16} />, onSave, true)}{toolButton('Import PDF', <FileText size={16} />, onImportPdf)}{toolButton('Insert image', <ImagePlus size={16} />, onImage)}{toolButton('Export current page as PNG', <Download size={16} />, onExportPng)}{toolButton('About, user setup and license', <Info size={16} />, onAbout)}
    </div>
  </div></header>
}

const penColors = [{ value: '#111827', label: 'Black' }, { value: '#2563eb', label: 'Blue' }, { value: '#dc2626', label: 'Red' }, { value: '#16a34a', label: 'Green' }, { value: '#a855f7', label: 'Purple' }]
const styles: Array<{ value: DrawingStyle; label: string }> = [{ value: 'pen', label: 'Pen' }, { value: 'brush', label: 'Brush' }]
const shapes: Array<{ value: ShapeKind; label: string }> = [{ value: 'rect', label: 'Square' }, { value: 'roundRect', label: 'Rounded' }, { value: 'ellipse', label: 'Circle' }, { value: 'diamond', label: 'Diamond' }, { value: 'lineH', label: 'Horizontal' }, { value: 'lineV', label: 'Vertical' }]
const shapeColors = [{ value: '#2563eb', label: 'Blue' }, { value: '#dc2626', label: 'Red' }, { value: '#16a34a', label: 'Green' }, { value: '#111827', label: 'Black' }, { value: '#a855f7', label: 'Purple' }]

export function FloatingTools() {
  const tool = useEditorStore((s) => s.tool), penColor = useEditorStore((s) => s.penColor), penSize = useEditorStore((s) => s.penSize), penStyle = useEditorStore((s) => s.penStyle), shapeKind = useEditorStore((s) => s.shapeKind), shapeColor = useEditorStore((s) => s.shapeColor)
  const setTool = useEditorStore((s) => s.setTool), setPenColor = useEditorStore((s) => s.setPenColor), setPenSize = useEditorStore((s) => s.setPenSize), setPenStyle = useEditorStore((s) => s.setPenStyle), setShapeKind = useEditorStore((s) => s.setShapeKind), setShapeColor = useEditorStore((s) => s.setShapeColor)
  const [penOpen, setPenOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const close = (event: PointerEvent) => { if (penOpen && !popoverRef.current?.contains(event.target as Node)) setPenOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [penOpen])

  const chooseTool = (value: typeof tool) => { setTool(value); setPenOpen(false) }
  const button = (name: string, icon: ReactNode, value: typeof tool) => <button type="button" title={name} aria-label={name} className={`floating-tool ${tool === value ? 'active' : ''}`} onClick={() => chooseTool(value)}>{icon}</button>

  return <div className="floating-tools" aria-label="Board tools">
    {button('Select', <MousePointer2 size={17} />, 'select')}
    <div className="floating-tool-wrap">
      <button type="button" title="Pen settings" aria-label="Pen settings" className={`floating-tool ${tool === 'pen' ? 'active' : ''}`} aria-expanded={penOpen} onClick={() => { setTool('pen'); setPenOpen((value) => !value) }}><PenLine size={17} /></button>
      {penOpen && <div ref={popoverRef} className="tool-popover pen-popover compact-pen-popover" aria-label="Pen settings">
        <div className="popover-head"><div><strong>Pen</strong><small>Style, size and color</small></div><button type="button" className="popover-close" title="Close pen settings" aria-label="Close pen settings" onClick={() => setPenOpen(false)}><X size={15} /></button></div>
        <div className="pen-settings-row"><span className="settings-label">Type</span><div className="style-choice-row">{styles.map((style) => <button key={style.value} type="button" className={`style-choice ${penStyle === style.value ? 'selected' : ''}`} onClick={() => { setPenStyle(style.value); setPenOpen(false) }}><span className={`style-preview ${style.value}`} style={{ background: penColor }} />{style.label}</button>)}</div></div>
        <div className="pen-settings-row"><span className="settings-label">Color</span><div className="inline-colors">{penColors.map((color) => <button key={color.value} type="button" className={`swatch ${penColor === color.value ? 'selected' : ''}`} title={color.label} aria-label={color.label} style={{ background: color.value }} onClick={() => { setPenColor(color.value); setPenOpen(false) }} />)}</div></div>
        <label className="inline-slider pen-settings-row" title="Pen size"><span className="settings-label">Size <b>{Math.round(penSize * 100)}%</b></span><input aria-label="Pen size" type="range" min="3" max="35" step="1" value={Math.round(penSize * 100)} onChange={(event) => setPenSize(Number(event.target.value) / 100)} /></label>
      </div>}
    </div>
    {button('Highlighter', <Highlighter size={17} />, 'highlighter')}
    {button('Eraser', <Eraser size={17} />, 'eraser')}
    {button('Shape', <Square size={17} />, 'shape')}
    {tool === 'shape' && <div className="inline-tool-panel shape-inline-panel" aria-label="Shape settings">
      <div className="inline-shapes">{shapes.map((shape) => <button key={shape.value} type="button" className={`mini-shape ${shapeKind === shape.value ? 'selected' : ''}`} title={shape.label} aria-label={shape.label} onClick={() => setShapeKind(shape.value)}><span className={`shape-icon ${shape.value}`} /></button>)}</div>
      <div className="inline-colors">{shapeColors.map((color) => <button key={color.value} type="button" className={`swatch ${shapeColor === color.value ? 'selected' : ''}`} title={`${color.label} border`} aria-label={`${color.label} border`} style={{ background: color.value }} onClick={() => setShapeColor(color.value)} />)}</div>
    </div>}
  </div>
}
