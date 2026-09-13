import { ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react'
import { useEditorStore } from '../stores/editor.store'

export function PageSidebar() {
  const pages = useEditorStore((s) => s.project.pages)
  const current = useEditorStore((s) => s.currentPageId)
  const selectPage = useEditorStore((s) => s.selectPage)
  const movePage = useEditorStore((s) => s.movePage)
  const duplicatePage = useEditorStore((s) => s.duplicatePage)
  const deletePage = useEditorStore((s) => s.deletePage)

  return <aside className="sidebar">
    <div className="sidebar-title">Pages <span>{pages.length}</span></div>
    <div className="page-list">
      {pages.map((page, index) => <div key={page.id} className={`page-row ${current === page.id ? 'selected' : ''}`}>
        <button type="button" className="page-thumb" onClick={() => selectPage(page.id)} title={`Open ${page.name}`}>
          <div className="thumb-number">{index + 1}</div>
          <div className="thumb-preview" style={{ background: page.background, aspectRatio: `${page.width} / ${page.height}` }}>
            <svg viewBox={`0 0 ${page.width} ${page.height}`} preserveAspectRatio="none">
              <rect width="100%" height="100%" fill={page.background} />
              {page.elements.slice(0, 12).map((element) =>
                element.type === 'image' ? <image key={element.id} href={element.src} x={element.x} y={element.y} width={element.width} height={element.height} preserveAspectRatio="xMidYMid slice" />
                  : element.type === 'text' ? <text key={element.id} x={element.x} y={element.y + element.fontSize / 1.25} fontSize={Math.max(0.22, element.fontSize / 18)} fill={element.fill}>{element.text.slice(0, 16)}</text>
                    : element.type === 'shape' ? <rect key={element.id} x={element.x} y={element.y} width={element.width} height={element.height} rx={element.radius ?? 0} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />
                      : <polyline key={element.id} points={element.points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={element.stroke} strokeWidth={Math.max(element.strokeWidth, 0.025)} />
              )}
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
      </div>)}
    </div>
  </aside>
}
