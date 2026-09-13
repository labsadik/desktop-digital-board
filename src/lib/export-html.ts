import type { Project, Page, Element } from '../types/document'
function esc(value:string){return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
function elementSvg(element:Element){
  if(element.type==='text')return `<text x="${element.x}" y="${element.y+element.fontSize/1.25}" font-family="${esc(element.fontFamily)}" font-size="${element.fontSize}" font-weight="${element.fontWeight}" fill="${element.fill}">${esc(element.text)}</text>`
  if(element.type==='shape')return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" fill="${element.fill}" stroke="${element.stroke}" stroke-width="${element.strokeWidth}"/>`
  if(element.type==='image')return `<image href="${esc(element.src)}" x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" preserveAspectRatio="none"/>`
  return `<polyline points="${element.points.map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="${element.stroke}" stroke-width="${element.strokeWidth}" opacity="${element.opacity}" stroke-linecap="round" stroke-linejoin="round"/>`
}
export function pageToSvg(page:Page){return `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}in" height="${page.height}in" viewBox="0 0 ${page.width} ${page.height}"><rect width="100%" height="100%" fill="${page.background}"/>${page.elements.map(elementSvg).join('')}</svg>`}
export function projectToPdfHtml(project:Project){return `<!doctype html><html><head><style>@page{size:${project.width}in ${project.height}in;margin:0}html,body{margin:0;padding:0;background:#111}section{width:${project.width}in;height:${project.height}in;page-break-after:always;overflow:hidden}section:last-child{page-break-after:auto}svg{display:block;width:100%;height:100%}</style></head><body>${project.pages.map(page=>`<section>${pageToSvg(page)}</section>`).join('')}</body></html>`}
