import type { Project } from './types/document'

declare global {
  interface Window {
    desktop: {
      openProject(): Promise<Project | null>
      saveProject(project: Project): Promise<string | null>
      importImage(): Promise<string | null>
      importPdf(): Promise<string | null>
      importPptx(): Promise<string | null>
      exportPptx(project: Project): Promise<string | null>
      exportPdf(pagesHtml: string[], fileName: string): Promise<string | null>
      exportPng(svg: string, fileName: string): Promise<string | null>
      reveal(target: string): Promise<void>
    }
  }
}

export {}
