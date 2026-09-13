import type { Page, Project } from '../types/document'
import { uid } from '../utils/id'

export function createPage(index: number, width: number, height: number): Page {
  return { id: uid('page'), name: `Page ${index + 1}`, width, height, background: '#ffffff', elements: [] }
}
export function createProject(): Project {
  const width = 13.333, height = 7.5
  return { version: 1, name: 'Untitled', width, height, pages: [createPage(0, width, height)], sourceFormat: 'native' }
}
