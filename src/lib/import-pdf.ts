import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'
import type { Page, Project } from '../types/document'
import { uid } from '../utils/id'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const activeImports = new Set<Promise<void>>()

export interface PdfImportProgress {
  pageId: string
  elementId: string
  pageNumber: number
  totalPages: number
  src: string
}

function decodeDataUrl(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) throw new Error('Invalid PDF data.')
  const binary = atob(dataUrl.slice(comma + 1))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function idleTick() {
  return new Promise<void>((resolve) => {
    const callback = () => resolve()
    const requestIdle = window.requestIdleCallback
    if (typeof requestIdle === 'function') requestIdle(callback, { timeout: 80 })
    else globalThis.setTimeout(callback, 0)
  })
}

function placeholderDataUrl() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="#f8fafc"/><path d="M145 85h30M160 70v30" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round"/></svg>'
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

async function renderPage(pdfPage: pdfjsLib.PDFPageProxy): Promise<string> {
  const baseViewport = pdfPage.getViewport({ scale: 1 })
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
  const src = canvas.toDataURL('image/jpeg', 0.86)
  canvas.width = 1
  canvas.height = 1
  pdfPage.cleanup()
  return src
}

export async function waitForPdfImports() {
  if (!activeImports.size) return
  await Promise.all([...activeImports])
}

export async function importPdfProject(dataUrl: string, onPageReady?: (progress: PdfImportProgress) => void): Promise<Project> {
  const bytes = decodeDataUrl(dataUrl)
  const pdf = await pdfjsLib.getDocument({ data: bytes, useWorkerFetch: true }).promise
  const pages: Page[] = []
  let projectWidth = 13.333
  let projectHeight = 7.5
  const placeholder = placeholderDataUrl()

  for (let index = 1; index <= pdf.numPages; index += 1) {
    const pdfPage = await pdf.getPage(index)
    const baseViewport = pdfPage.getViewport({ scale: 1 })
    const width = Math.max(1, baseViewport.width / 72)
    const height = Math.max(1, baseViewport.height / 72)
    if (index === 1) { projectWidth = width; projectHeight = height }
    const pageId = uid('page')
    const elementId = uid('image')
    const element = { id: elementId, type: 'image' as const, x: 0, y: 0, width, height, rotation: 0, src: placeholder }
    pages.push({ id: pageId, name: `PDF Page ${index}`, width, height, background: '#ffffff', elements: [element] })

    if (index === 1) {
      const src = await renderPage(pdfPage)
      pages[0].elements[0] = { ...element, src }
      onPageReady?.({ pageId, elementId, pageNumber: 1, totalPages: pdf.numPages, src })
    } else {
      pdfPage.cleanup()
    }
    if (index % 8 === 0) await idleTick()
  }

  const project: Project = { version: 1, name: 'Imported PDF', width: projectWidth, height: projectHeight, pages, sourceFormat: 'pdf' }

  const background = (async () => {
    for (let index = 2; index <= pdf.numPages; index += 1) {
      const pdfPage = await pdf.getPage(index)
      const src = await renderPage(pdfPage)
      const page = pages[index - 1]
      const element = page.elements[0]
      if (element.type === 'image') element.src = src
      onPageReady?.({ pageId: page.id, elementId: element.id, pageNumber: index, totalPages: pdf.numPages, src })
      await idleTick()
    }
  })()

  activeImports.add(background)
  void background.catch(() => undefined).finally(() => activeImports.delete(background))
  return project
}
