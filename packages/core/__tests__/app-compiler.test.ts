import { describe, expect, it } from 'vitest'

import {
  compileApp,
  linkAndCompileApp,
  parse,
  type AppManifest,
  type AppModuleInput,
  type AppSourceSpan,
  type ComponentUseNode,
  type LayoutDefinitionNode,
  type PageNode,
  type SourceLocation,
} from '../src'

function count(value: string, needle: string): number {
  return value.split(needle).length - 1
}

function location(line: number, offset: number): SourceLocation {
  return {
    start: { line, column: 1, offset },
    end: { line, column: 2, offset: offset + 1 },
  }
}

function source(sourceId: string, node: { loc?: SourceLocation }): AppSourceSpan {
  return { sourceId, location: node.loc ?? location(1, 0) }
}

function inputs(): { manifest: AppManifest; modules: AppModuleInput[] } {
  const sharedSource = `component badge(label: string) { card { text "$label" } }
layout shell {
  header { title "Shared shell" }
  slot
  footer { use badge(label="Shared footer") }
}`
  const screensSource = `page "One" id=one uses=shell { use badge(label="First") }
page "Two" id=two uses=shell { use badge(label="Second") }
page "Three" id=three uses=shell { use badge(label="Third") }`
  const sharedDocument = parse(sharedSource)
  const screensDocument = parse(screensSource)
  const layout = sharedDocument.children.find(
    (node): node is LayoutDefinitionNode => node.type === 'Layout',
  )
  const component = sharedDocument.children.find((node) => node.type === 'Component')
  const screens = screensDocument.children.filter((node): node is PageNode => node.type === 'Page')
  if (layout === undefined || component === undefined)
    throw new Error('expected shared definitions')

  for (const screen of screens) {
    const use = screen.children[0] as ComponentUseNode
    use.namespace = 'shared'
  }

  const sharedId = 'shared.wf'
  const screensId = 'screens.wf'
  const manifest: AppManifest = {
    id: 'three-screen-app',
    sourceId: 'wireweave.app.json',
    modules: [
      { id: 'shared', namespace: 'shared', location: location(1, 0) },
      { id: 'screens', namespace: 'app', location: location(2, 10) },
    ],
  }
  const modules: AppModuleInput[] = [
    {
      id: 'shared',
      source: source(sharedId, layout),
      layouts: [{ id: layout.name, node: layout, source: source(sharedId, layout) }],
      components: [{ id: component.name, node: component, source: source(sharedId, component) }],
      screens: [],
    },
    {
      id: 'screens',
      source: source(screensId, screens[0] ?? {}),
      layouts: [],
      components: [],
      screens: screens.map((screen) => ({
        id: screen.id ?? screen.title ?? 'screen',
        node: screen,
        source: source(screensId, screen),
        references: [
          {
            kind: 'layout',
            id: 'shell',
            namespace: 'shared',
            source: source(screensId, screen),
          },
        ],
      })),
    },
  ]
  return { manifest, modules }
}

describe('Core application compiler', () => {
  it('emits one deterministic document for 3+ screens with shared layout and components', () => {
    const { manifest, modules } = inputs()
    const first = linkAndCompileApp(manifest, [...modules].reverse())
    const second = linkAndCompileApp(manifest, modules)
    expect(first.ok).toBe(true)
    expect(second).toEqual(first)
    if (!first.ok) return

    const html = first.html
    expect(compileApp(first.document)).toBe(html)
    expect(count(html, '<!DOCTYPE html>')).toBe(1)
    expect(count(html, '<style>')).toBe(1)
    expect(count(html, '<script>')).toBe(1)
    expect(count(html, 'var R = ')).toBe(1)
    expect(count(html, 'data-layout="shared:layout:shell"')).toBe(1)
    expect(count(html, 'data-screen="')).toBe(3)
    expect(count(html, 'data-wf-instance="')).toBe(4)
    expect(count(html, 'Shared shell')).toBe(1)
    expect(count(html, 'Shared footer')).toBe(1)
    expect(html).toContain('background: #000000')
    expect(html).not.toContain('#3b82f6')
  })

  it('is self-contained and does not emit host screen or arrow controls', () => {
    const { manifest, modules } = inputs()
    const result = linkAndCompileApp(manifest, modules)
    if (!result.ok) throw new Error('expected application to compile')

    expect(result.html).not.toContain('<link')
    expect(result.html).not.toMatch(/<script[^>]+>/)
    expect(result.html).not.toContain('@import')
    expect(result.html).not.toContain('<select')
    expect(result.html).not.toContain('screen-picker')
    expect(result.html).not.toContain('wf-arrow')
  })

  it('preserves deterministic linker diagnostics without partial HTML', () => {
    const { manifest, modules } = inputs()
    const broken = linkAndCompileApp(
      manifest,
      modules.filter((module) => module.id !== 'shared'),
    )

    expect(broken).toMatchObject({
      ok: false,
      document: null,
      html: null,
    })
    expect(broken.diagnostics.map((diagnostic) => diagnostic.code)).toContain('missing-module')
  })
})
