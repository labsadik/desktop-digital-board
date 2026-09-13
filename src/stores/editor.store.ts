import { create } from 'zustand'
import type { Element, Project, Page } from '../types/document'
import { createPage, createProject } from '../core/document'
import { uid } from '../utils/id'

type Tool = 'select' | 'pen' | 'highlighter' | 'text' | 'shape' | 'eraser'

interface EditorState {
  project: Project
  currentPageId: string
  selectedElementId: string | null
  tool: Tool
  zoom: number
  past: Project[]
  future: Project[]
  setTool: (tool: Tool) => void
  selectPage: (id: string) => void
  selectElement: (id: string | null) => void
  addPage: () => void
  duplicatePage: () => void
  deletePage: () => void
  movePage: (from: number, to: number) => void
  renamePage: (id: string, name: string) => void
  addElement: (element: Element) => void
  updateElement: (pageId: string, elementId: string, patch: Partial<Element>) => void
  removeElement: (pageId: string, elementId: string) => void
  loadProject: (project: Project) => void
  setProjectName: (name: string) => void
  setZoom: (zoom: number) => void
  undo: () => void
  redo: () => void
}

const initial = createProject()
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value))

export const useEditorStore = create<EditorState>((set) => {
  const commit = (state: EditorState, project: Project, patch: Partial<EditorState> = {}): Partial<EditorState> => ({
    ...patch,
    project,
    past: [...state.past.slice(-39), clone(state.project)],
    future: [],
  })

  return {
    project: initial,
    currentPageId: initial.pages[0].id,
    selectedElementId: null,
    tool: 'select',
    zoom: 1,
    past: [],
    future: [],
    setTool: (tool) => set({ tool, selectedElementId: null }),
    selectPage: (id) => set({ currentPageId: id, selectedElementId: null }),
    selectElement: (id) => set({ selectedElementId: id }),
    addPage: () => set((state) => {
      const page = createPage(state.project.pages.length, state.project.width, state.project.height)
      return commit(state, { ...state.project, pages: [...state.project.pages, page] }, { currentPageId: page.id, selectedElementId: null })
    }),
    duplicatePage: () => set((state) => {
      const index = state.project.pages.findIndex((p) => p.id === state.currentPageId)
      const source = state.project.pages[index]
      if (!source) return state
      const page: Page = clone(source)
      page.id = uid('page')
      page.name = `${source.name} Copy`
      page.elements = page.elements.map((element) => ({ ...element, id: uid(element.type) }))
      const pages = [...state.project.pages]
      pages.splice(index + 1, 0, page)
      return commit(state, { ...state.project, pages }, { currentPageId: page.id, selectedElementId: null })
    }),
    deletePage: () => set((state) => {
      if (state.project.pages.length <= 1) return state
      const index = state.project.pages.findIndex((p) => p.id === state.currentPageId)
      const pages = state.project.pages.filter((p) => p.id !== state.currentPageId)
      const next = pages[Math.max(0, Math.min(index, pages.length - 1))]
      return commit(state, { ...state.project, pages }, { currentPageId: next.id, selectedElementId: null })
    }),
    movePage: (from, to) => set((state) => {
      if (from < 0 || to < 0 || from >= state.project.pages.length || to >= state.project.pages.length || from === to) return state
      const pages = [...state.project.pages]
      const [page] = pages.splice(from, 1)
      pages.splice(to, 0, page)
      return commit(state, { ...state.project, pages })
    }),
    renamePage: (id, name) => set((state) => commit(state, { ...state.project, pages: state.project.pages.map((page) => page.id === id ? { ...page, name } : page) })),
    addElement: (element) => set((state) => commit(state, { ...state.project, pages: state.project.pages.map((p) => p.id === state.currentPageId ? { ...p, elements: [...p.elements, element] } : p) }, { selectedElementId: element.id })),
    updateElement: (pageId, elementId, patch) => set((state) => commit(state, { ...state.project, pages: state.project.pages.map((p) => p.id === pageId ? { ...p, elements: p.elements.map((item) => item.id === elementId ? ({ ...item, ...patch } as Element) : item) } : p) }, { selectedElementId: elementId })),
    removeElement: (pageId, elementId) => set((state) => commit(state, { ...state.project, pages: state.project.pages.map((p) => p.id === pageId ? { ...p, elements: p.elements.filter((item) => item.id !== elementId) } : p) }, { selectedElementId: null })),
    loadProject: (project) => set({ project, currentPageId: project.pages[0]?.id ?? '', selectedElementId: null, past: [], future: [] }),
    setProjectName: (name) => set((state) => ({ project: { ...state.project, name } })),
    setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),
    undo: () => set((state) => {
      const previous = state.past[state.past.length - 1]
      if (!previous) return state
      return { project: clone(previous), currentPageId: previous.pages.some((p) => p.id === state.currentPageId) ? state.currentPageId : previous.pages[0].id, selectedElementId: null, past: state.past.slice(0, -1), future: [clone(state.project), ...state.future].slice(0, 40) }
    }),
    redo: () => set((state) => {
      const next = state.future[0]
      if (!next) return state
      return { project: clone(next), currentPageId: next.pages.some((p) => p.id === state.currentPageId) ? state.currentPageId : next.pages[0].id, selectedElementId: null, past: [...state.past, clone(state.project)].slice(-40), future: state.future.slice(1) }
    }),
  }
})
