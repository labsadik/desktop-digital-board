import PptxGenJS from 'pptxgenjs'
import type { Project } from '../../src/types/document.js'

export async function createPptx(project: Project, outputPath: string) {
  const pptx = new PptxGenJS()
  pptx.layout = project.width / project.height > 1.35 ? 'LAYOUT_WIDE' : 'LAYOUT_STANDARD'
  pptx.author = 'Note Replace'
  pptx.subject = 'Note Replace presentation'
  pptx.title = project.name
  for (const page of project.pages) {
    const slide = pptx.addSlide()
    slide.background = { color: page.background.replace('#', '') }
    for (const element of page.elements) {
      if (element.type === 'text') {
        slide.addText(element.text, { x: element.x, y: element.y, w: element.width, h: element.height, fontFace: element.fontFamily, fontSize: element.fontSize, color: element.fill.replace('#', ''), bold: element.fontWeight >= 700, margin: 0 })
      } else if (element.type === 'shape') {
        slide.addShape(PptxGenJS.ShapeType.rect, { x: element.x, y: element.y, w: element.width, h: element.height, fill: { color: element.fill.replace('#', '') }, line: { color: element.stroke.replace('#', ''), width: element.strokeWidth } })
      } else if (element.type === 'image') {
        slide.addImage({ path: element.src, x: element.x, y: element.y, w: element.width, h: element.height })
      }
    }
  }
  await pptx.writeFile({ fileName: outputPath })
}
