export type ElementType = 'text' | 'shape' | 'image' | 'drawing'

export interface BaseElement { id: string; type: ElementType; x: number; y: number; width: number; height: number; rotation: number }
export interface TextElement extends BaseElement { type: 'text'; text: string; fontFamily: string; fontSize: number; fontWeight: number; fill: string }
export interface ShapeElement extends BaseElement { type: 'shape'; fill: string; stroke: string; strokeWidth: number; radius?: number }
export interface ImageElement extends BaseElement { type: 'image'; src: string; opacity?: number }
export interface DrawingElement extends BaseElement { type: 'drawing'; points: Array<{ x: number; y: number }>; stroke: string; strokeWidth: number; opacity: number }
export type Element = TextElement | ShapeElement | ImageElement | DrawingElement
export interface Page { id: string; name: string; width: number; height: number; background: string; elements: Element[] }
export interface Project { version: 1; name: string; width: number; height: number; pages: Page[] }
