import type { Project, Page, Element } from '../types/document'

function esc(value: string) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;') }
function elementSvg(element: Element) {
  if (element.type === 'text') return `<text x="${element.x}" y="${element.y + element.fontSize / 1.25}" font-family="${esc(element.fontFamily)}" font-size="${element.fontSize}" font-weight="${element.fontWeight}" fill="${element.fill}">${esc(element.text)}</text>`
  if (element.type === 'shape') return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" fill="${element.fill}" stroke="${element.stroke}" stroke-width="${element.strokeWidth}"/>`
  if (element.type === 'image') return `<image href="${esc(element.src)}" x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" preserveAspectRatio="none"/>`
  return `<polyline points="${element.points.map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="${element.stroke}" stroke-width="${element.strokeWidth}" opacity="${element.opacity}" stroke-linecap="round" stroke-linejoin="round"/>`
}
export function pageToSvg(page: Page) { return `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}in" height="${page.height}in" viewBox="0 0 ${page.width} ${page.height}"><rect width="100%" height="100%" fill="${page.background}"/>${page.elements.map(elementSvg).join('')}</svg>` }

export function pageToPdfHtml(page: Page) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:${page.width}in ${page.height}in;margin:0}html,body{margin:0;padding:0;width:${page.width}in;height:${page.height}in;background:#fff;overflow:hidden}.print-page{display:block;box-sizing:border-box;width:${page.width}in;height:${page.height}in;margin:0;padding:0;overflow:hidden}.print-page svg{display:block;width:${page.width}in;height:${page.height}in;margin:0;padding:0}</style></head><body><section class="print-page">${pageToSvg(page)}</section></body></html>`
}

export function projectToPdfPages(project: Project) {
  return project.pages.map(pageToPdfHtml)
}

export function projectToPdfHtml(project: Project) {
  const sections = project.pages.map((page, index) => `<section class="print-page" data-page-index="${index}" style="width:${page.width}in;height:${page.height}in"><div class="page-frame">${pageToSvg(page)}</div></section>`).join('')
  const first = project.pages[0]
  const size = first ? `${first.width}in ${first.height}in` : '13.333in 7.5in'
  return `<!doctype html><html><head><style>@page{size:${size};margin:0}html,body{margin:0;padding:0;background:#fff}body{overflow:hidden}.print-page{display:block;position:relative;box-sizing:border-box;overflow:hidden;margin:0;padding:0;break-inside:avoid;page-break-inside:avoid;break-after:page;page-break-after:always}.print-page:last-child{break-after:auto;page-break-after:auto}.page-frame{display:block;width:100%;height:100%;margin:0;padding:0}.page-frame svg{display:block;width:100%;height:100%;margin:0;padding:0}</style></head><body>${sections}</body></html>`
}
