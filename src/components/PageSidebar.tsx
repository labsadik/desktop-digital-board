import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react'
import { useEditorStore } from '../stores/editor.store'
import type { Element } from '../types/document'

function drawVectorElement(element: Element) {
  if (element.type === 'text') return <text key={element.id} x={element.x} y={element.y + element.fontSize / 1.25} fontSize={Math.max(0.22, element.fontSize / 18)} fill={element.fill}>{element.text.slice(0, 16)}</text>
  if (element.type === 'shape') return <rect key={element.id} x={element.x} y={element.y} width={element.width} height={element.height} rx={element.radius ?? 0} fill="transparent" stroke={element.stroke} strokeWidth={element.strokeWidth} />
  if (element.type === 'drawing') return <polyline key={element.id} points={element.points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={element.stroke} strokeWidth={Math.max(element.strokeWidth, 0.025)} />
  return null
}

export function PageSidebar() {
  const pages = useEditorStore((s) => s.project.pages)
  const current = useEditorStore((s) => s.currentPageId)
  const selectPage = useEditorStore((s) => s.selectPage)
  const movePage = useEditorStore((s) => s.movePage)
  const duplicatePage = useEditorStore((s) => s.duplicatePage)
  const deletePage = useEditorStore((s) => s.deletePage)
  const addPage = useEditorStore((s) => s.addPage)

  return <aside className="sidebar">
    <div className="sidebar-title"><span className="sidebar-title-label">Pages <b>{pages.length}</b></span><button type="button" className="add-page-button" title="Add blank page" onClick={addPage}><Plus size={15} /><span>Add page</span></button></div>
    <div className="page-list">
      {pages.map((page, index) => {
        const image = page.elements.find((element) => element.type === 'image')
        const vectors = page.elements.filter((element) => element.type !== 'image').slice(0, 12)
        return <div key={page.id} className={`page-row ${current === page.id ? 'selected' : ''}`}>
          <button type="button" className="page-thumb" onClick={() => selectPage(page.id)} title={`Open ${page.name}`}>
            <div className="thumb-number">{index + 1}</div>
            <div className="thumb-preview" style={{ background: page.background, aspectRatio: `${page.width} / ${page.height}` }}>
              {image?.type === 'image' && <img className="thumb-image" src={image.previewSrc ?? image.src} alt="" loading="lazy" decoding="async" draggable={false} />}
              <svg className="thumb-vectors" viewBox={`0 0 ${page.width} ${page.height}`} preserveAspectRatio="none">
                <rect width="100%" height="100%" fill={page.background} fillOpacity={image ? 0.04 : 1} />
                {vectors.map(drawVectorElement)}
              </svg>
            </div>
            <span className="page-name">{page.name}</span>
          </button>
          <div className="page-actions">
            <button type="button" title="Move page up" disabled={index === 0} onClick={() => movePage(index, index - 1)}><ChevronUp size={14} /></button>
            <button type="button" title="Move page down" disabled={index === pages.length - 1} onClick={() => movePage(index, index + 1)}><ChevronDown size={14} /></button>
            <button type="button" title="Duplicate page" onClick={() => { selectPage(page.id); duplicatePage() }}><Copy size={14} /></button>
            <button type="button" title="Delete page" disabled={pages.length <= 1} onClick={() => { selectPage(page.id); deletePage() }}><Trash2 size={14} /></button>
          </div>
        </div>
      })}
      <button type="button" className="page-add-card" onClick={addPage} title="Add a blank page"><span className="page-add-icon"><Plus size={22} /></span><span><strong>Add blank page</strong><small>New page after the current page</small></span></button>
    </div>
  </aside>
}
