import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { Page, Project } from '../types/document'
import { uid } from '../utils/id'

export async function importPdfProject(dataUrl: string): Promise<Project> {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) throw new Error('Invalid PDF data.')
  const binary = atob(dataUrl.slice(comma + 1))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  const pdf = await pdfjsLib.getDocument({ data: bytes, disableWorker: true }).promise
  const pages: Page[] = []

  for (let index = 1; index <= pdf.numPages; index += 1) {
    const pdfPage = await pdf.getPage(index)
    const baseViewport = pdfPage.getViewport({ scale: 1 })
    const width = Math.max(1, baseViewport.width / 72)
    const height = Math.max(1, baseViewport.height / 72)
    const scale = Math.min(2, 1800 / Math.max(baseViewport.width, baseViewport.height))
    const viewport = pdfPage.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.ceil(viewport.width))
    canvas.height = Math.max(1, Math.ceil(viewport.height))
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Could not create a PDF rendering context.')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    await pdfPage.render({ canvas, canvasContext: context, viewport }).promise

    pages.push({
      id: uid('page'),
      name: `PDF Page ${index}`,
      width,
      height,
      background: '#ffffff',
      elements: [{
        id: uid('image'),
        type: 'image',
        x: 0,
        y: 0,
        width,
        height,
        rotation: 0,
        src: canvas.toDataURL('image/png'),
      }],
    })

    canvas.width = 1
    canvas.height = 1
    pdfPage.cleanup()
  }

  const first = pages[0]
  return {
    version: 1,
    name: 'Imported PDF',
    width: first?.width ?? 13.333,
    height: first?.height ?? 7.5,
    pages,
  }
}
