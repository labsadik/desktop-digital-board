import type { Project, Page, Element } from '../types/document'

function esc(value: string) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;') }
function elementSvg(element: Element) {
  if (element.type === 'text') return `<text x="${element.x}" y="${element.y + element.fontSize / 1.25}" font-family="${esc(element.fontFamily)}" font-size="${element.fontSize}" font-weight="${element.fontWeight}" fill="${element.fill}">${esc(element.text)}</text>`
  if (element.type === 'shape') return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" fill="${element.fill}" stroke="${element.stroke}" stroke-width="${element.strokeWidth}"/>`
  if (element.type === 'image') return `<image href="${esc(element.src)}" x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" preserveAspectRatio="none"/>`
  return `<polyline points="${element.points.map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="${element.stroke}" stroke-width="${element.strokeWidth}" opacity="${element.opacity}" stroke-linecap="round" stroke-linejoin="round"/>`
}
export function pageToSvg(page: Page) { return `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}in" height="${page.height}in" viewBox="0 0 ${page.width} ${page.height}"><rect width="100%" height="100%" fill="${page.background}"/>${page.elements.map(elementSvg).join('')}</svg>` }
export function projectToPdfHtml(project: Project) {
  const sections = project.pages.map((page, index) => `<section class="print-page" data-page-index="${index}" style="width:${page.width}in;height:${page.height}in"><div class="page-frame">${pageToSvg(page)}</div></section>`).join('')
  return `<!doctype html><html><head><style>@page{margin:0}html,body{margin:0;padding:0;background:#fff;width:100%;height:100%}body{overflow:hidden}.print-page{display:block;position:relative;box-sizing:border-box;overflow:hidden;margin:0;padding:0;break-inside:avoid;page-break-inside:avoid;break-after:page;page-break-after:always}.print-page:last-child{break-after:auto;page-break-after:auto}.page-frame{display:block;width:100%;height:100%;margin:0;padding:0}.page-frame svg{display:block;width:100%;height:100%;margin:0;padding:0}</style></head><body>${sections}</body></html>`
}
