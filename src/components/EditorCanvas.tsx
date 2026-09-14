import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useEditorStore } from '../stores/editor.store'
import { uid } from '../utils/id'
import { pageToSvg } from '../lib/export-html'
import type { DrawingElement, Element, ShapeElement } from '../types/document'

type Interaction =
  | { mode: 'move' | 'resize'; element: Element; start: { x: number; y: number; width?: number; height?: number }; pointerStart: { x: number; y: number } }
  | null

type Point = { x: number; y: number }

function pointFromEvent(svg: SVGSVGElement, event: ReactPointerEvent<SVGSVGElement>): Point {
  const rect = svg.getBoundingClientRect()
  const viewBox = svg.viewBox.baseVal
  return { x: Math.max(0, Math.min(viewBox.width, (event.clientX - rect.left) / rect.width * viewBox.width)), y: Math.max(0, Math.min(viewBox.height, (event.clientY - rect.top) / rect.height * viewBox.height)) }
}

function moveElement(element: Element, dx: number, dy: number, pageWidth: number, pageHeight: number): Element {
  const x = Math.max(0, Math.min(pageWidth - element.width, element.x + dx))
  const y = Math.max(0, Math.min(pageHeight - element.height, element.y + dy))
  if (element.type !== 'drawing') return { ...element, x, y }
  const points = element.points.map((point) => ({ x: Math.max(0, Math.min(pageWidth, point.x + dx)), y: Math.max(0, Math.min(pageHeight, point.y + dy)) }))
  return { ...element, x, y, points }
}

function resizeElement(element: Element, dx: number, dy: number, pageWidth: number, pageHeight: number): Element {
  const width = Math.max(0.2, Math.min(pageWidth - element.x, element.width + dx))
  const height = Math.max(0.2, Math.min(pageHeight - element.y, element.height + dy))
  return { ...element, width, height }
}

function hitElement(element: Element, point: Point, padding = 0.16) {
  if (element.type === 'image' && element.x === 0 && element.y === 0 && Math.abs(element.width) >= 0.99 && Math.abs(element.height) >= 0.99) return false
  if (element.type === 'drawing') return element.points.some((candidate) => Math.hypot(candidate.x - point.x, candidate.y - point.y) <= padding + element.strokeWidth * 1.5)
  return point.x >= element.x - padding && point.x <= element.x + element.width + padding && point.y >= element.y - padding && point.y <= element.y + element.height + padding
}

export function EditorCanvas() {
  const project = useEditorStore((s) => s.project)
  const currentPageId = useEditorStore((s) => s.currentPageId)
  const selectedElementId = useEditorStore((s) => s.selectedElementId)
  const tool = useEditorStore((s) => s.tool)
  const penColor = useEditorStore((s) => s.penColor)
  const zoom = useEditorStore((s) => s.zoom)
  const selectPage = useEditorStore((s) => s.selectPage)
  const page = project.pages.find((p) => p.id === currentPageId) ?? project.pages[0]
  const addElement = useEditorStore((s) => s.addElement)
  const updateElement = useEditorStore((s) => s.updateElement)
  const removeElement = useEditorStore((s) => s.removeElement)
  const selectElement = useEditorStore((s) => s.selectElement)
  const [drawing, setDrawing] = useState<Point[]>([])
  const [interaction, setInteraction] = useState<Interaction>(null)
  const [livePoint, setLivePoint] = useState<Point | null>(null)
  const [erasing, setErasing] = useState(false)
  const erasedIds = useRef(new Set<string>())
  const svgRef = useRef<SVGSVGElement | null>(null)
  const motionFrame = useRef<number | null>(null)
  const motionPoint = useRef<Point | null>(null)

  if (!page) return null
  const pointerPoint = (event: ReactPointerEvent<SVGSVGElement>) => pointFromEvent(svgRef.current!, event)
  const eraseAtPoint = (point: Point) => {
    const hit = [...page.elements].reverse().find((element) => !erasedIds.current.has(element.id) && hitElement(element, point))
    if (hit) { erasedIds.current.add(hit.id); removeElement(page.id, hit.id) }
  }
  const queueLivePoint = (point: Point) => {
    motionPoint.current = point
    if (motionFrame.current !== null) return
    motionFrame.current = window.requestAnimationFrame(() => {
      motionFrame.current = null
      if (motionPoint.current) setLivePoint(motionPoint.current)
    })
  }
  const cancelMotionFrame = () => {
    if (motionFrame.current !== null) window.cancelAnimationFrame(motionFrame.current)
    motionFrame.current = null
    motionPoint.current = null
  }

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = pointerPoint(event)
    const target = event.target as SVGElement
    const elementId = target.dataset.elementId
    const resizeHandle = target.dataset.resizeHandle
    if (resizeHandle && selectedElementId && tool === 'select') {
      const element = page.elements.find((item) => item.id === selectedElementId)
      if (element) { svgRef.current?.setPointerCapture(event.pointerId); setInteraction({ mode: 'resize', element, start: { x: element.x, y: element.y, width: element.width, height: element.height }, pointerStart: point }); setLivePoint(point) }
      return
    }
    if (tool === 'eraser') {
      erasedIds.current.clear(); svgRef.current?.setPointerCapture(event.pointerId); setErasing(true); eraseAtPoint(point); return
    }
    if (tool === 'select') {
      if (elementId) {
        const element = page.elements.find((item) => item.id === elementId)
        selectElement(elementId)
        if (element) { svgRef.current?.setPointerCapture(event.pointerId); setInteraction({ mode: 'move', element, start: { x: element.x, y: element.y }, pointerStart: point }); setLivePoint(point) }
      } else selectElement(null)
      return
    }
    if (tool === 'pen' || tool === 'highlighter') { svgRef.current?.setPointerCapture(event.pointerId); setDrawing([point]); return }
    if (tool === 'shape') {
      const width = Math.min(3.2, page.width - point.x)
      const height = Math.min(1.8, page.height - point.y)
      const shape: ShapeElement = { id: uid('shape'), type: 'shape', x: point.x, y: point.y, width: Math.max(0.2, width), height: Math.max(0.2, height), rotation: 0, fill: '#eef2ff', stroke: '#4f46e5', strokeWidth: 0.025, radius: 0.08 }
      addElement(shape)
    }
  }

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = pointerPoint(event)
    if (erasing) { eraseAtPoint(point); return }
    if (interaction) { queueLivePoint(point); return }
    if (drawing.length > 0) setDrawing((current) => [...current, point])
  }

  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = pointerPoint(event)
    cancelMotionFrame()
    if (drawing.length > 1) {
      const isHighlighter = tool === 'highlighter'
      const item: DrawingElement = { id: uid('draw'), type: 'drawing', x: drawing[0].x, y: drawing[0].y, width: page.width, height: page.height, rotation: 0, points: drawing, stroke: isHighlighter ? '#facc15' : penColor, strokeWidth: isHighlighter ? 0.18 : 0.04, opacity: isHighlighter ? 0.35 : 1 }
      addElement(item); setDrawing([]); setLivePoint(null); return
    }
    if (erasing) { setErasing(false); erasedIds.current.clear(); return }
    if (interaction) {
      const dx = point.x - interaction.pointerStart.x
      const dy = point.y - interaction.pointerStart.y
      if (interaction.mode === 'move' && Math.abs(dx) + Math.abs(dy) > 0.01) updateElement(page.id, interaction.element.id, moveElement(interaction.element, dx, dy, page.width, page.height))
      else if (interaction.mode === 'resize') updateElement(page.id, interaction.element.id, resizeElement(interaction.element, dx, dy, page.width, page.height))
      setInteraction(null); setLivePoint(null)
    }
  }

  const renderElement = (source: Element) => {
    const isLive = interaction?.element.id === source.id && livePoint
    const liveElement = isLive
      ? interaction.mode === 'move'
        ? moveElement(source, livePoint.x - interaction.pointerStart.x, livePoint.y - interaction.pointerStart.y, page.width, page.height)
        : resizeElement(source, livePoint.x - interaction.pointerStart.x, livePoint.y - interaction.pointerStart.y, page.width, page.height)
      : source
    const element = liveElement
    const className = selectedElementId === element.id ? 'canvas-element selected' : 'canvas-element'
    const common = { 'data-element-id': element.id, className }
    if (element.type === 'text') return <text {...common} x={element.x} y={element.y + element.fontSize / 1.25} fontFamily={element.fontFamily} fontSize={element.fontSize} fontWeight={element.fontWeight} fill={element.fill}>{element.text}</text>
    if (element.type === 'shape') return <rect {...common} x={element.x} y={element.y} width={element.width} height={element.height} rx={element.radius ?? 0} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />
    if (element.type === 'image') return <image {...common} href={element.src} x={element.x} y={element.y} width={element.width} height={element.height} opacity={element.opacity ?? 1} preserveAspectRatio="none" />
    return <polyline {...common} points={element.points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={element.stroke} strokeWidth={element.strokeWidth} opacity={element.opacity} strokeLinecap="round" strokeLinejoin="round" />
  }

  const selected = page.elements.find((element) => element.id === selectedElementId)
  const selectedLive = selected && interaction?.element.id === selected.id && livePoint
    ? interaction.mode === 'move'
      ? moveElement(selected, livePoint.x - interaction.pointerStart.x, livePoint.y - interaction.pointerStart.y, page.width, page.height)
      : resizeElement(selected, livePoint.x - interaction.pointerStart.x, livePoint.y - interaction.pointerStart.y, page.width, page.height)
    : selected

  return <main className="workspace">
    <div className="canvas-scroll">
      <div className="board-pages">
        {project.pages.map((boardPage) => {
          const active = boardPage.id === page.id
          if (!active) return <button key={boardPage.id} type="button" className="board-page board-page-preview" onClick={() => selectPage(boardPage.id)} aria-label={`Open ${boardPage.name}`}><div className="board-page-label"><span>{project.pages.indexOf(boardPage) + 1}</span><strong>{boardPage.name}</strong></div><div className="board-preview" style={{ aspectRatio: `${boardPage.width} / ${boardPage.height}` }} dangerouslySetInnerHTML={{ __html: pageToSvg(boardPage) }} /></button>
          return <section key={boardPage.id} className="board-page board-page-active"><div className="board-page-label"><span>{project.pages.indexOf(boardPage) + 1}</span><strong>{boardPage.name}</strong><small>{boardPage.elements.length} elements</small></div><div className="canvas-stage" style={{ width: 'min(1120px, 92vw)', aspectRatio: `${page.width} / ${page.height}` }}><svg key={page.id} ref={svgRef} className="page-canvas" viewBox={`0 0 ${page.width} ${page.height}`} preserveAspectRatio="none" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}><rect width="100%" height="100%" fill={page.background} pointerEvents="all" />{page.elements.map(renderElement)}{drawing.length > 1 && <polyline points={drawing.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={tool === 'highlighter' ? '#facc15' : penColor} strokeWidth={tool === 'highlighter' ? 0.18 : 0.04} opacity={tool === 'highlighter' ? 0.35 : 1} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />}{selectedLive && !interaction && selectedLive.type !== 'drawing' && tool === 'select' && <g><rect x={selectedLive.x - 0.06} y={selectedLive.y - 0.06} width={selectedLive.width + 0.12} height={selectedLive.height + 0.12} fill="none" stroke="#4f46e5" strokeWidth="0.018" strokeDasharray="0.08 0.06" pointerEvents="none" /><rect data-resize-handle="br" x={selectedLive.x + selectedLive.width - 0.08} y={selectedLive.y + selectedLive.height - 0.08} width="0.16" height="0.16" fill="#ffffff" stroke="#4f46e5" strokeWidth="0.02" /></g>}</svg></div></section>
        })}
      </div>
    </div>
    <div className="statusbar"><span>{page.name}</span><span>{page.elements.length} elements</span><span>{Math.round(zoom * 100)}%</span><span className="tool-status">{tool === 'select' ? 'Select' : tool === 'pen' ? `Pen · ${penColor === '#2563eb' ? 'Blue' : penColor === '#dc2626' ? 'Red' : 'Black'}` : tool === 'highlighter' ? 'Highlighter' : tool === 'shape' ? 'Shape' : 'Eraser'}</span></div>
  </main>
}
