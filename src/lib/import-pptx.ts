import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'
import type { Page, Project, TextElement, ShapeElement } from '../types/document'
import { uid } from '../utils/id'

const EMU_PER_INCH = 914400
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', removeNSPrefix: true, textNodeName: '#text', trimValues: true })
function arr<T>(value: T | T[] | undefined): T[] { return value === undefined ? [] : Array.isArray(value) ? value : [value] }
function num(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function readText(sp: any) { return arr(sp?.txBody?.p).map((p: any) => arr(p?.r).map((run: any) => String(run?.t ?? '')).join('') || String(p?.['#text'] ?? '')).filter(Boolean).join('\n') }
function readGeometry(sp: any, slideWidth: number, slideHeight: number) { const xfrm = sp?.spPr?.xfrm ?? {}, off = xfrm?.off ?? {}, ext = xfrm?.ext ?? {}; return { x: Math.max(0, Math.min(slideWidth, num(off['@_x']) / EMU_PER_INCH)), y: Math.max(0, Math.min(slideHeight, num(off['@_y']) / EMU_PER_INCH)), width: Math.max(0.15, Math.min(slideWidth, num(ext['@_cx']) / EMU_PER_INCH)), height: Math.max(0.15, Math.min(slideHeight, num(ext['@_cy']) / EMU_PER_INCH)) } }
function readFill(sp: any) { const rgb = sp?.spPr?.solidFill?.srgbClr?.['@_val']; return rgb ? `#${rgb}` : '#e5e7eb' }
function esc(value: string) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;') }
function buildSlideImage(width: number, height: number, elements: Array<TextElement | ShapeElement>) {
  const content = elements.map((element) => element.type === 'text'
    ? `<text x="${element.x}" y="${element.y + element.fontSize}" font-family="${esc(element.fontFamily)}" font-size="${element.fontSize}" font-weight="${element.fontWeight}" fill="${element.fill}">${element.text.split(/\r?\n/).map((line, index) => `<tspan x="${element.x}" dy="${index === 0 ? 0 : element.fontSize * 1.2}">${esc(line)}</tspan>`).join('')}</text>`
    : `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rx="${element.radius ?? 0}" fill="${element.fill}" stroke="${element.stroke}" stroke-width="${element.strokeWidth}"/>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}in" height="${height}in" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#ffffff"/>${content}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
export async function importPptxProject(dataUrl: string): Promise<Project> {
  const comma = dataUrl.indexOf(','); if (comma < 0) throw new Error('Invalid PowerPoint data.')
  const binary = atob(dataUrl.slice(comma + 1)); const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0)); const zip = await JSZip.loadAsync(bytes)
  const presentationXml = await zip.file('ppt/presentation.xml')?.async('string'); if (!presentationXml) throw new Error('PowerPoint presentation.xml is missing.')
  const presentation = parser.parse(presentationXml); const size = presentation?.presentation?.sldSz ?? {}
  const projectWidth = Math.max(1, num(size['@_cx'], 12192000) / EMU_PER_INCH); const projectHeight = Math.max(1, num(size['@_cy'], 6858000) / EMU_PER_INCH)
  const slideNames = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a, b) => Number(a.match(/slide(\d+)/)?.[1] ?? 0) - Number(b.match(/slide(\d+)/)?.[1] ?? 0))
  if (!slideNames.length) throw new Error('No slides were found in the PowerPoint file.')
  const pages: Page[] = []
  for (let index = 0; index < slideNames.length; index += 1) {
    const xml = await zip.file(slideNames[index])!.async('string'); const slide = parser.parse(xml); const tree = slide?.sld?.cSld?.spTree ?? {}; const elements: Array<TextElement | ShapeElement> = []
    for (const sp of arr(tree.sp)) { const geometry = readGeometry(sp, projectWidth, projectHeight); const text = readText(sp).trim(); if (text) elements.push({ id: uid('text'), type: 'text', ...geometry, rotation: 0, text, fontFamily: 'Arial', fontSize: 0.28, fontWeight: 500, fill: '#111827' }); else elements.push({ id: uid('shape'), type: 'shape', ...geometry, rotation: 0, fill: readFill(sp), stroke: '#64748b', strokeWidth: 0.012, radius: 0.02 }) }
    pages.push({ id: uid('page'), name: `PPTX Slide ${index + 1}`, width: projectWidth, height: projectHeight, background: '#ffffff', elements: [{ id: uid('image'), type: 'image', x: 0, y: 0, width: projectWidth, height: projectHeight, rotation: 0, src: buildSlideImage(projectWidth, projectHeight, elements) }] })
  }
  return { version: 1, name: 'Imported PowerPoint', width: projectWidth, height: projectHeight, pages, sourceFormat: 'pptx' }
}
