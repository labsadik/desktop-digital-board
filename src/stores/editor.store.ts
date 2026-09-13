import { create } from 'zustand'
import type { Element, Project, Page } from '../types/document'
import { createPage, createProject } from '../core/document'
import { uid } from '../utils/id'

interface EditorState {
  project: Project; currentPageId: string; tool: 'select'|'pen'|'text'|'shape'|'eraser'; zoom: number
  setTool: (tool: EditorState['tool']) => void; selectPage: (id: string) => void; addPage: () => void; duplicatePage: () => void; deletePage: () => void; movePage: (from:number,to:number) => void
  addElement: (element: Element) => void; updateElement: (pageId:string, elementId:string, patch:Partial<Element>) => void; removeElement: (pageId:string, elementId:string) => void; loadProject: (project:Project) => void; setProjectName: (name:string) => void
}
const initial = createProject()
export const useEditorStore = create<EditorState>((set) => ({
  project: initial, currentPageId: initial.pages[0].id, tool: 'select', zoom: 1,
  setTool: (tool) => set({ tool }), selectPage: (id) => set({ currentPageId: id }),
  addPage: () => set((state) => { const page = createPage(state.project.pages.length, state.project.width, state.project.height); return { project:{...state.project,pages:[...state.project.pages,page]}, currentPageId:page.id } }),
  duplicatePage: () => set((state) => { const index=state.project.pages.findIndex(p=>p.id===state.currentPageId); const source=state.project.pages[index]; if(!source)return state; const page:Page=JSON.parse(JSON.stringify(source)); page.id=uid('page'); page.name=`${source.name} Copy`; const pages=[...state.project.pages]; pages.splice(index+1,0,page); return {project:{...state.project,pages},currentPageId:page.id} }),
  deletePage: () => set((state) => { if(state.project.pages.length<=1)return state; const index=state.project.pages.findIndex(p=>p.id===state.currentPageId); const pages=state.project.pages.filter(p=>p.id!==state.currentPageId); const next=pages[Math.max(0,Math.min(index,pages.length-1))]; return {project:{...state.project,pages},currentPageId:next.id} }),
  movePage: (from,to) => set((state)=>{const pages=[...state.project.pages]; const [page]=pages.splice(from,1); if(!page)return state; pages.splice(to,0,page); return {project:{...state.project,pages}}}),
  addElement: (element) => set((state)=>({project:{...state.project,pages:state.project.pages.map(p=>p.id===state.currentPageId?{...p,elements:[...p.elements,element]}:p)}})),
  updateElement: (pageId,elementId,patch) => set((state)=>({project:{...state.project,pages:state.project.pages.map(p=>p.id===pageId?{...p,elements:p.elements.map(item=>item.id===elementId?({...item,...patch} as Element):item)}:p)}})),
  removeElement: (pageId,elementId) => set((state)=>({project:{...state.project,pages:state.project.pages.map(p=>p.id===pageId?{...p,elements:p.elements.filter(item=>item.id!==elementId)}:p)}})),
  loadProject: (project) => set({project,currentPageId:project.pages[0]?.id??''}), setProjectName: (name)=>set(state=>({project:{...state.project,name}})),
}))
