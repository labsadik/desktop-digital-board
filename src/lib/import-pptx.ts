import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'
import type { Page, Project, TextElement, ShapeElement } from '../types/document'
import { uid } from '../utils/id'

const EMU_PER_INCH = 914400
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  textNodeName: '#text',
  trimValues: true,
})

function arr<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function readText(sp: any) {
  const runs = arr(sp?.txBody?.p?.r)
  const direct = sp?.txBody?.p?.['#text']
  const text = runs.map((run: any) => String(run?.t ?? '')).join('')
  return text || String(direct ?? '')
}

function readGeometry(sp: any, slideWidth: number, slideHeight: number) {
  const xfrm = sp?.spPr?.xfrm
  const off = xfrm?.off ?? {}
  const ext = xfrm?.ext ?? {}
  return {
    x: Math.max(0, num(off['@_x']) / EMU_PER_INCH),
    y: Math.max(0, num(off['@_y']) / EMU_PER_INCH),
    width: Math.max(0.15, Math.min(slideWidth, num(ext['@_cx']) / EMU_PER_INCH)),
    height: Math.max(0.15, Math.min(slideHeight, num(ext['@_cy']) / EMU_PER_INCH)),
  }
}

function readFill(sp: any) {
  const solid = sp?.spPr?.solidFill
  const rgb = solid?.srgbClr?.['@_val']
  return rgb ? `#${rgb}` : '#ffffff'
}

export async function importPptxProject(dataUrl: string): Promise<Project> {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) throw new Error('Invalid PowerPoint data.')
  const binary = atob(dataUrl.slice(comma + 1))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  const zip = await JSZip.loadAsync(bytes)

  const presentationXml = await zip.file('ppt/presentation.xml')?.async('string')
  if (!presentationXml) throw new Error('PowerPoint presentation.xml is missing.')
  const presentation = parser.parse(presentationXml)
  const size = presentation?.presentation?.sldSz ?? {}
  const projectWidth = Math.max(1, num(size['@_cx'], 12192000) / EMU_PER_INCH)
  const projectHeight = Math.max(1, num(size['@_cy'], 6858000) / EMU_PER_INCH)

  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1] ?? 0) - Number(b.match(/slide(\d+)/)?.[1] ?? 0))

  if (!slideNames.length) throw new Error('No slides were found in the PowerPoint file.')

  const pages: Page[] = []
  for (let index = 0; index < slideNames.length; index += 1) {
    const xml = await zip.file(slideNames[index])!.async('string')
    const slide = parser.parse(xml)
    const tree = slide?.sld?.cSld?.spTree ?? {}
    const elements: Array<TextElement | ShapeElement> = []

    for (const sp of arr(tree.sp)) {
      const geometry = readGeometry(sp, projectWidth, projectHeight)
      const text = readText(sp).trim()
      if (text) {
        elements.push({
          id: uid('text'),
          type: 'text',
          ...geometry,
          rotation: 0,
          text,
          fontFamily: 'Arial',
          fontSize: 0.28,
          fontWeight: 500,
          fill: '#111827',
        })
      } else {
        elements.push({
          id: uid('shape'),
          type: 'shape',
          ...geometry,
          rotation: 0,
          fill: readFill(sp),
          stroke: '#64748b',
          strokeWidth: 0.012,
          radius: 0.02,
        })
      }
    }

    pages.push({
      id: uid('page'),
      name: `PPTX Slide ${index + 1}`,
      width: projectWidth,
      height: projectHeight,
      background: '#ffffff',
      elements,
    })
  }

  return { version: 1, name: 'Imported PowerPoint', width: projectWidth, height: projectHeight, pages }
}
