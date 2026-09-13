import { describe, expect, it } from 'vitest'
import { createPage, createProject } from '../src/core/document'
describe('document model',()=>{it('creates a valid initial project',()=>{const project=createProject();expect(project.version).toBe(1);expect(project.pages).toHaveLength(1);expect(project.pages[0].background).toBe('#ffffff')});it('creates unique pages',()=>{const a=createPage(0,13.333,7.5),b=createPage(1,13.333,7.5);expect(a.id).not.toBe(b.id)})})
