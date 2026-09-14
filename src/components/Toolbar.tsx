import { ChevronDown, Copy, Download, Eraser, FileText, FolderOpen, Highlighter, ImagePlus, Minus, MousePointer2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, PenLine, Plus, Redo2, Save, Square, Trash2, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useEditorStore } from '../stores/editor.store'
import logoUrl from '../../assets/logo.png'
import type { DrawingStyle, ShapeKind } from '../types/document'

interface Props {
  saveLabel: string
  onSave: () => void
  onOpen: () => void
  onImportPdf: () => void
  onExportPdf: () => void
  onExportPng: () => void
  onImage: () => void
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  onToggleLeftSidebar: () => void
  onToggleRightSidebar: () => void
}

export function Toolbar({ saveLabel, onSave, onOpen, onImportPdf, onExportPdf, onExportPng, onImage, leftSidebarOpen, rightSidebarOpen, onToggleLeftSidebar, onToggleRightSidebar }: Props) {
  const addPage = useEditorStore((s) => s.addPage)
  const duplicatePage = useEditorStore((s) => s.duplicatePage)
  const deletePage = useEditorStore((s) => s.deletePage)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const zoom = useEditorStore((s) => s.zoom)
  const setZoom = useEditorStore((s) => s.setZoom)
  const [pdfOpen, setPdfOpen] = useState(false)
  const pdfMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!pdfMenuRef.current?.contains(event.target as Node)) setPdfOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const toolButton = (name: string, icon: ReactNode, onClick: () => void, active = false) => (
    <button type="button" title={name} aria-label={name} className={`tool ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
    </button>
  )

  return (
    <header className="topbar">
      <div className="toolbar-inner">
        <div className="brand" aria-label="Note Replace">
          <img className="brand-logo" src={logoUrl} alt="Note Replace" />
          <div className="brand-copy"><strong>Note Replace</strong><span>PDF editor</span></div>
        </div>
        <div className="toolbar-section compact" aria-label="Panels">
          {toolButton('Toggle pages sidebar', leftSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />, onToggleLeftSidebar, leftSidebarOpen)}
          {toolButton('Toggle properties sidebar', rightSidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />, onToggleRightSidebar, rightSidebarOpen)}
        </div>
        <div className="toolbar-section" aria-label="History">
          {toolButton('Undo', <Undo2 size={16} />, undo)}
          {toolButton('Redo', <Redo2 size={16} />, redo)}
        </div>
        <div className="toolbar-section page-actions-toolbar" aria-label="Pages">
          {toolButton('Add page', <Plus size={16} />, addPage)}
          {toolButton('Duplicate page', <Copy size={16} />, duplicatePage)}
          {toolButton('Delete page', <Trash2 size={16} />, deletePage)}
        </div>
        <div className="toolbar-section zoom-group" aria-label="Zoom">
          {toolButton('Zoom out', <ZoomOut size={16} />, () => setZoom(zoom - 0.1))}
          <span className="zoom-value" aria-live="polite">{Math.round(zoom * 100)}%</span>
          {toolButton('Zoom in', <ZoomIn size={16} />, () => setZoom(zoom + 0.1))}
          {toolButton('Reset zoom to 65%', <Minus size={16} />, () => setZoom(0.65))}
        </div>
        <div className="toolbar-spacer" />
        <div className="toolbar-section document-actions" aria-label="Document actions">
          <button type="button" className="secondary action-button" onClick={onOpen} title="Open project"><FolderOpen size={15} /><span>Open</span></button>
          <button type="button" className="secondary action-button primary-action" onClick={onSave} title={saveLabel}><Save size={15} /><span>{saveLabel}</span></button>
          <div className="menu-wrap pdf-control" ref={pdfMenuRef}>
            <button type="button" className="secondary action-button" onClick={() => setPdfOpen((value) => !value)} aria-expanded={pdfOpen} aria-haspopup="menu" title="PDF actions"><FileText size={15} /><span>PDF</span><ChevronDown size={14} className={pdfOpen ? 'menu-chevron open' : 'menu-chevron'} /></button>
            {pdfOpen && (
              <div className="tool-menu pdf-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => { setPdfOpen(false); onImportPdf() }}><span><strong>Import PDF</strong><small>Bring every PDF page into the editor</small></span></button>
                <button type="button" role="menuitem" onClick={() => { setPdfOpen(false); onExportPdf() }}><span><strong>Export PDF</strong><small>Save the edited document as PDF</small></span></button>
              </div>
            )}
          </div>
          <button type="button" className="secondary action-button" onClick={onImage} title="Insert image"><ImagePlus size={15} /><span>Image</span></button>
          <button type="button" className="secondary action-button" onClick={onExportPng} title="Export current page as PNG"><Download size={15} /><span>PNG</span></button>
        </div>
      </div>
    </header>
  )
}

const penColors = [
  { value: '#111827', label: 'Black' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#dc2626', label: 'Red' },
  { value: '#16a34a', label: 'Green' },
  { value: '#a855f7', label: 'Purple' },
]
const styles: Array<{ value: DrawingStyle; label: string; note: string }> = [
  { value: 'pen', label: 'Pen', note: 'Clean writing' },
  { value: 'brush', label: 'Brush', note: 'Soft & thick' },
  { value: 'marker', label: 'Marker', note: 'Bold stroke' },
  { value: 'magic', label: 'Magic pen', note: 'Glow for 5s' },
]
const shapes: Array<{ value: ShapeKind; label: string }> = [
  { value: 'rect', label: 'Square' },
  { value: 'roundRect', label: 'Rounded' },
  { value: 'ellipse', label: 'Circle' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'lineH', label: 'Horizontal' },
  { value: 'lineV', label: 'Vertical' },
]
const shapeColors = [
  { value: '#2563eb', label: 'Blue' },
  { value: '#dc2626', label: 'Red' },
  { value: '#16a34a', label: 'Green' },
  { value: '#111827', label: 'Black' },
  { value: '#a855f7', label: 'Purple' },
]

export function FloatingTools() {
  const tool = useEditorStore((s) => s.tool)
  const penColor = useEditorStore((s) => s.penColor)
  const penSize = useEditorStore((s) => s.penSize)
  const penStyle = useEditorStore((s) => s.penStyle)
  const shapeKind = useEditorStore((s) => s.shapeKind)
  const shapeColor = useEditorStore((s) => s.shapeColor)
  const setTool = useEditorStore((s) => s.setTool)
  const setPenColor = useEditorStore((s) => s.setPenColor)
  const setPenSize = useEditorStore((s) => s.setPenSize)
  const setPenStyle = useEditorStore((s) => s.setPenStyle)
  const setShapeKind = useEditorStore((s) => s.setShapeKind)
  const setShapeColor = useEditorStore((s) => s.setShapeColor)
  const [penOpen, setPenOpen] = useState(false)
  const [shapeOpen, setShapeOpen] = useState(false)

  const button = (name: string, icon: ReactNode, value: typeof tool) => (
    <button type="button" title={name} aria-label={name} className={`floating-tool ${tool === value ? 'active' : ''}`} onClick={() => setTool(value)}>
      {icon}
    </button>
  )

  return (
    <div className="floating-tools" aria-label="Board tools">
      {button('Select', <MousePointer2 size={17} />, 'select')}

      <div className="floating-tool-wrap">
        <button
          type="button"
          title="Pen options"
          aria-label="Pen options"
          className={`floating-tool ${tool === 'pen' ? 'active' : ''}`}
          onClick={() => {
            setTool('pen')
            setPenOpen((value) => !value)
            setShapeOpen(false)
          }}
        >
          <PenLine size={17} />
        </button>
        {penOpen && (
          <div className="tool-popover pen-popover">
            <div className="popover-title">Pen</div>
            <div className="popover-subtitle">Choose color, style and size</div>
            <div className="option-label">Colors</div>
            <div className="color-grid">
              {penColors.map((color) => (
                <button key={color.value} type="button" className={`swatch ${penColor === color.value ? 'selected' : ''}`} title={color.label} aria-label={color.label} style={{ background: color.value }} onClick={() => setPenColor(color.value)} />
              ))}
            </div>
            <div className="option-label">Pen style</div>
            <div className="style-list">
              {styles.map((style) => (
                <button key={style.value} type="button" className={`style-option ${penStyle === style.value ? 'selected' : ''}`} onClick={() => setPenStyle(style.value)}>
                  <span className={`style-preview ${style.value}`} style={{ background: penColor }} />
                  <span><strong>{style.label}</strong><small>{style.note}</small></span>
                </button>
              ))}
            </div>
            <div className="option-label">Point size <b>{Math.round(penSize * 100)}%</b></div>
            <input className="pen-size-slider" type="range" min="3" max="35" step="1" value={Math.round(penSize * 100)} onChange={(event) => setPenSize(Number(event.target.value) / 100)} />
            {penStyle === 'magic' && <div className="magic-note">Magic pen marks glow and pulse for 5 seconds.</div>}
          </div>
        )}
      </div>

      {button('Highlighter', <Highlighter size={17} />, 'highlighter')}
      {button('Eraser', <Eraser size={17} />, 'eraser')}

      <div className="floating-tool-wrap">
        <button
          type="button"
          title="Shape options"
          aria-label="Shape options"
          className={`floating-tool ${tool === 'shape' ? 'active' : ''}`}
          onClick={() => {
            setTool('shape')
            setShapeOpen((value) => !value)
            setPenOpen(false)
          }}
        >
          <Square size={17} />
        </button>
        {shapeOpen && (
          <div className="tool-popover shape-popover">
            <div className="popover-title">Shapes &amp; lines</div>
            <div className="popover-subtitle">Transparent fill, visible border</div>
            <div className="shape-grid">
              {shapes.map((shape) => (
                <button key={shape.value} type="button" className={`shape-option ${shapeKind === shape.value ? 'selected' : ''}`} onClick={() => setShapeKind(shape.value)}>
                  <span className={`shape-icon ${shape.value}`} />
                  <small>{shape.label}</small>
                </button>
              ))}
            </div>
            <div className="option-label">Border color</div>
            <div className="color-grid">
              {shapeColors.map((color) => (
                <button key={color.value} type="button" className={`swatch ${shapeColor === color.value ? 'selected' : ''}`} title={color.label} aria-label={color.label} style={{ background: color.value }} onClick={() => setShapeColor(color.value)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
