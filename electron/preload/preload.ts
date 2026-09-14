import { contextBridge, ipcRenderer } from 'electron'
import type { Project } from '../../src/types/document.js'

contextBridge.exposeInMainWorld('desktop', {
  openProject: () => ipcRenderer.invoke('file:open-project') as Promise<Project | null>,
  saveProject: (project: Project) => ipcRenderer.invoke('file:save-project', project) as Promise<string | null>,
  importImage: () => ipcRenderer.invoke('file:import-image') as Promise<string | null>,
  importPdf: () => ipcRenderer.invoke('file:import-pdf') as Promise<string | null>,
  importPptx: () => ipcRenderer.invoke('file:import-pptx') as Promise<string | null>,
  exportPptx: (project: Project) => ipcRenderer.invoke('export:pptx', project) as Promise<string | null>,
  exportPdf: (pagesHtml: string[], fileName: string) => ipcRenderer.invoke('export:pdf', pagesHtml, fileName) as Promise<string | null>,
  exportPng: (svg: string, fileName: string) => ipcRenderer.invoke('export:png', svg, fileName) as Promise<string | null>,
  reveal: (target: string) => ipcRenderer.invoke('system:reveal', target) as Promise<void>,
})
