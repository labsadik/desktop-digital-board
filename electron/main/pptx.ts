import PptxGenJS from 'pptxgenjs'
import type { Project, DrawingElement } from '../../src/types/document.js'

function svgData(element: DrawingElement) {
  const minX = Math.min(...element.points.map((point) => point.x), 0)
  const minY = Math.min(...element.points.map((point) => point.y), 0)
  const maxX = Math.max(...element.points.map((point) => point.x), 1)
  const maxY = Math.max(...element.points.map((point) => point.y), 1)
  const width = Math.max(1, maxX - minX)
  const height = Math.max(1, maxY - minY)
  const points = element.points.map((point) => `${point.x - minX},${point.y - minY}`).join(' ')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}in" height="${height}in" viewBox="0 0 ${width} ${height}"><polyline points="${points}" fill="none" stroke="${element.stroke}" stroke-width="${Math.max(0.02, element.strokeWidth)}" opacity="${element.opacity}" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export async function createPptx(project: Project, outputPath: string) {
  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'NOTE_REPLACE', width: project.width, height: project.height })
  pptx.layout = 'NOTE_REPLACE'
  pptx.author = 'Note Replace'
  pptx.subject = 'Note Replace presentation'
  pptx.title = project.name

  for (const page of project.pages) {
    const slide = pptx.addSlide()
    slide.background = { color: page.background.replace('#', '') }
    for (const element of page.elements) {
      if (element.type === 'text') {
        slide.addText(element.text, { x: element.x, y: element.y, w: element.width, h: element.height, fontFace: element.fontFamily, fontSize: Math.max(8, element.fontSize * 72), color: element.fill.replace('#', ''), bold: element.fontWeight >= 700, margin: 0, breakLine: false })
      } else if (element.type === 'shape') {
        slide.addShape(PptxGenJS.ShapeType.rect, { x: element.x, y: element.y, w: element.width, h: element.height, rectRadius: element.radius ? Math.max(0.02, element.radius) : undefined, fill: { color: element.fill.replace('#', '') }, line: { color: element.stroke.replace('#', ''), width: Math.max(0.5, element.strokeWidth * 72) } })
      } else if (element.type === 'image') {
        slide.addImage({ data: element.src, x: element.x, y: element.y, w: element.width, h: element.height, transparency: element.opacity !== undefined ? Math.round((1 - element.opacity) * 100) : 0 })
      } else if (element.type === 'drawing') {
        slide.addImage({ data: svgData(element), x: element.x, y: element.y, w: Math.max(0.1, element.width), h: Math.max(0.1, element.height) })
      }
    }
  }
  await pptx.writeFile({ fileName: outputPath })
}
