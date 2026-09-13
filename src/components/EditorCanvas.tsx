import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useEditorStore } from '../stores/editor.store'
import { uid } from '../utils/id'
import type { DrawingElement, Element, ShapeElement, TextElement } from '../types/document'

type Interaction =
  | { mode: 'move' | 'resize'; element: Element; start: { x: number; y: number }; pointerStart: { x: number; y: number } }
  | null

type Point = { x: number; y: number }

function pointFromEvent(svg: SVGSVGElement, event: ReactPointerEvent<SVGSVGElement>): Point {
  const rect = svg.getBoundingClientRect()
  const viewBox = svg.viewBox.baseVal
  return { x: (event.clientX - rect.left) / rect.width * viewBox.width, y: (event.clientY - rect.top) / rect.height * viewBox.height }
}

function moveElement(element: Element, dx: number, dy: number, pageWidth: number, pageHeight: number): Element {
  const x = Math.max(0, Math.min(pageWidth - element.width, element.x + dx))
  const y = Math.max(0, Math.min(pageHeight - element.height, element.y + dy))
  if (element.type !== 'drawing') return { ...element, x, y }
  const points = element.points.map((point) => ({ x: point.x + dx, y: point.y + dy }))
  return { ...element, x, y, points }
}

export function EditorCanvas() {
  const project = useEditorStore((s) => s.project)
  const currentPageId = useEditorStore((s) => s.currentPageId)
  const selectedElementId = useEditorStore((s) => s.selectedElementId)
  const tool = useEditorStore((s) => s.tool)
  const zoom = useEditorStore((s) => s.zoom)
  const page = project.pages.find((p) => p.id === currentPageId) ?? project.pages[0]
  const addElement = useEditorStore((s) => s.addElement)
  const updateElement = useEditorStore((s) => s.updateElement)
  const removeElement = useEditorStore((s) => s.removeElement)
  const selectElement = useEditorStore((s) => s.selectElement)
  const [drawing, setDrawing] = useState<Point[]>([])
  const [interaction, setInteraction] = useState<Interaction>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  if (!page) return null

  const pointerPoint = (event: ReactPointerEvent<SVGSVGElement>) => pointFromEvent(svgRef.current!, event)

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = pointerPoint(event)
    const target = event.target as SVGElement
    const elementId = target.dataset.elementId
    const resizeHandle = target.dataset.resizeHandle

    if (resizeHandle && selectedElementId) {
      const element = page.elements.find((item) => item.id === selectedElementId)
      if (element) {
        svgRef.current?.setPointerCapture(event.pointerId)
        setInteraction({ mode: 'resize', element, start: { x: element.width, y: element.height }, pointerStart: point })
      }
      return
    }

    if (tool === 'eraser') {
      if (elementId) removeElement(page.id, elementId)
      return
    }

    if (tool === 'select') {
      if (elementId) {
        const element = page.elements.find((item) => item.id === elementId)
        selectElement(elementId)
        if (element) {
          svgRef.current?.setPointerCapture(event.pointerId)
          setInteraction({ mode: 'move', element, start: { x: element.x, y: element.y }, pointerStart: point })
        }
      } else {
        selectElement(null)
      }
      return
    }

    if (tool === 'pen' || tool === 'highlighter') {
      svgRef.current?.setPointerCapture(event.pointerId)
      setDrawing([point])
      return
    }

    if (tool === 'text') {
      const text: TextElement = { id: uid('text'), type: 'text', x: point.x, y: point.y, width: 4.2, height: 0.7, rotation: 0, text: 'Double-click to edit', fontFamily: 'Arial', fontSize: 0.48, fontWeight: 600, fill: '#111827' }
      addElement(text)
      useEditorStore.getState().setTool('select')
      return
    }

    if (tool === 'shape') {
      const shape: ShapeElement = { id: uid('shape'), type: 'shape', x: point.x, y: point.y, width: Math.min(3.2, page.width - point.x), height: Math.min(1.8, page.height - point.y), rotation: 0, fill: '#eef2ff', stroke: '#4f46e5', strokeWidth: 0.025, radius: 0.08 }
      addElement(shape)
      useEditorStore.getState().setTool('select')
    }
  }

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (drawing.length > 0) setDrawing((current) => [...current, pointerPoint(event)])
  }

  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = pointerPoint(event)
    if (drawing.length > 1) {
      const isHighlighter = tool === 'highlighter'
      const item: DrawingElement = { id: uid('draw'), type: 'drawing', x: drawing[0].x, y: drawing[0].y, width: page.width, height: page.height, rotation: 0, points: drawing, stroke: isHighlighter ? '#facc15' : '#111827', strokeWidth: isHighlighter ? 0.18 : 0.04, opacity: isHighlighter ? 0.35 : 1 }
      addElement(item)
      setDrawing([])
      useEditorStore.getState().setTool('select')
      return
    }
    if (interaction) {
      const dx = point.x - interaction.pointerStart.x
      const dy = point.y - interaction.pointerStart.y
      if (interaction.mode === 'move' && Math.abs(dx) + Math.abs(dy) > 0.01) {
        updateElement(page.id, interaction.element.id, moveElement(interaction.element, dx, dy, page.width, page.height))
      } else if (interaction.mode === 'resize') {
        const width = Math.max(0.2, Math.min(page.width - interaction.element.x, interaction.start.x + dx))
        const height = Math.max(0.2, Math.min(page.height - interaction.element.y, interaction.start.y + dy))
        updateElement(page.id, interaction.element.id, { width, height })
      }
      setInteraction(null)
    }
  }

  const renderElement = (element: Element) => {
    const className = selectedElementId === element.id ? 'canvas-element selected' : 'canvas-element'
    const common = { 'data-element-id': element.id, className }
    if (element.type === 'text') return <text {...common} x={element.x} y={element.y + element.fontSize / 1.25} fontFamily={element.fontFamily} fontSize={element.fontSize} fontWeight={element.fontWeight} fill={element.fill} onDoubleClick={(event) => { event.stopPropagation(); const next = window.prompt('Edit text', element.text); if (next !== null) updateElement(page.id, element.id, { text: next }) }}>{element.text}</text>
    if (element.type === 'shape') return <rect {...common} x={element.x} y={element.y} width={element.width} height={element.height} rx={element.radius ?? 0} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />
    if (element.type === 'image') return <image {...common} href={element.src} x={element.x} y={element.y} width={element.width} height={element.height} opacity={element.opacity ?? 1} preserveAspectRatio="none" />
    return <polyline {...common} points={element.points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={element.stroke} strokeWidth={element.strokeWidth} opacity={element.opacity} strokeLinecap="round" strokeLinejoin="round" />
  }

  const selected = page.elements.find((element) => element.id === selectedElementId)

  return (
    <main className="workspace">
      <div className="canvas-scroll">
        <div className="canvas-stage" style={{ transform: `scale(${zoom})` }}>
          <svg ref={svgRef} className="page-canvas" viewBox={`0 0 ${page.width} ${page.height}`} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
            <rect width="100%" height="100%" fill={page.background} pointerEvents="all" />
            {page.elements.map(renderElement)}
            {drawing.length > 1 && <polyline points={drawing.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={tool === 'highlighter' ? '#facc15' : '#111827'} strokeWidth={tool === 'highlighter' ? 0.18 : 0.04} opacity={tool === 'highlighter' ? 0.35 : 1} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />}
            {selected && !interaction && selected.type !== 'drawing' && <g><rect x={selected.x - 0.06} y={selected.y - 0.06} width={selected.width + 0.12} height={selected.height + 0.12} fill="none" stroke="#4f46e5" strokeWidth="0.018" strokeDasharray="0.08 0.06" pointerEvents="none" /><rect data-resize-handle="br" x={selected.x + selected.width - 0.08} y={selected.y + selected.height - 0.08} width="0.16" height="0.16" fill="#ffffff" stroke="#4f46e5" strokeWidth="0.02" /></g>}
          </svg>
        </div>
      </div>
      <div className="statusbar"><span>{page.name}</span><span>{page.elements.length} elements</span><span>{Math.round(zoom * 100)}%</span></div>
    </main>
  )
}
