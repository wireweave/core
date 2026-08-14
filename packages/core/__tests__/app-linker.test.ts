import { describe, expect, it } from 'vitest'

import {
  createAppNodeId,
  linkApp,
  type AppComponentInput,
  type AppLayoutInput,
  type AppManifest,
  type AppModuleInput,
  type AppReferenceInput,
  type AppScreenInput,
  type AppSourceSpan,
  type SourceLocation,
} from '../src'

function location(line: number, offset: number): SourceLocation {
  return {
    start: { line, column: 1, offset },
    end: { line, column: 8, offset: offset + 7 },
  }
}

function source(sourceId: string, line: number, offset: number): AppSourceSpan {
  return { sourceId, location: location(line, offset) }
}

function manifest(entries: readonly { id: string; namespace: string }[]): AppManifest {
  return {
    id: 'example-app',
    sourceId: 'app.json',
    modules: entries.map((entry, index) => ({
      ...entry,
      location: location(index + 1, index * 10),
    })),
  }
}

function layout(
  id: string,
  line: number,
  references: readonly AppReferenceInput[] = [],
): AppLayoutInput {
  return {
    id,
    node: { type: 'Layout', name: id, children: [] },
    source: source('module.wf', line, line * 10),
    references,
  }
}

function component(
  id: string,
  line: number,
  references: readonly AppReferenceInput[] = [],
): AppComponentInput {
  return {
    id,
    node: { type: 'Component', name: id, children: [] },
    source: source('module.wf', line, line * 10),
    references,
  }
}

function screen(
  id: string,
  line: number,
  references: readonly AppReferenceInput[] = [],
): AppScreenInput {
  return {
    id,
    node: { type: 'Page', id, title: id, children: [] },
    source: source('screen.wf', line, line * 10),
    references,
  }
}

function moduleInput(
  id: string,
  values: {
    layouts?: readonly AppLayoutInput[]
    components?: readonly AppComponentInput[]
    screens?: readonly AppScreenInput[]
  },
): AppModuleInput {
  return {
    id,
    source: source(`${id}.wf`, 1, 0),
    layouts: values.layouts ?? [],
    components: values.components ?? [],
    screens: values.screens ?? [],
  }
}

function reference(
  kind: 'layout' | 'component',
  id: string,
  line: number,
  namespace?: string,
): AppReferenceInput {
  return {
    kind,
    id,
    ...(namespace === undefined ? {} : { namespace }),
    source: source('references.wf', line, line * 10),
  }
}

describe('Core app module linker', () => {
  it('links modules in manifest order with stable namespaces, identities, and source maps', () => {
    const shared = moduleInput('shared', {
      layouts: [layout('shell', 2, [reference('component', 'nav', 2)])],
      components: [component('nav', 4)],
    })
    const account = moduleInput('account', {
      screens: [
        screen('home', 3, [
          reference('layout', 'shell', 3, 'shared/ui'),
          reference('component', 'nav', 3, 'shared/ui'),
        ]),
      ],
    })

    const result = linkApp(
      manifest([
        { id: 'shared', namespace: 'shared/ui' },
        { id: 'account', namespace: 'account' },
      ]),
      [account, shared],
    )

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected a linked app')

    expect(result.document.modules.map(({ id, namespace }) => ({ id, namespace }))).toEqual([
      { id: 'shared', namespace: 'shared/ui' },
      { id: 'account', namespace: 'account' },
    ])
    expect(result.document.layouts[0]?.nodeId).toBe('shared%2Fui:layout:shell')
    expect(result.document.components[0]?.nodeId).toBe('shared%2Fui:component:nav')
    expect(result.document.screens[0]?.references.map((item) => item.targetId)).toEqual([
      createAppNodeId('shared/ui', 'layout', 'shell'),
      createAppNodeId('shared/ui', 'component', 'nav'),
    ])
    expect(result.document.sourceMap).toEqual([
      {
        nodeId: createAppNodeId('shared/ui', 'layout', 'shell'),
        source: shared.layouts[0]?.source,
      },
      {
        nodeId: createAppNodeId('shared/ui', 'component', 'nav'),
        source: shared.components[0]?.source,
      },
      {
        nodeId: createAppNodeId('account', 'screen', 'home'),
        source: account.screens[0]?.source,
      },
    ])
  })

  it.each(['layout', 'component'] as const)(
    'refuses duplicate %s definitions at the second declaration location',
    (kind) => {
      const definitions =
        kind === 'layout'
          ? { layouts: [layout('duplicate', 2), layout('duplicate', 7)] }
          : { components: [component('duplicate', 2), component('duplicate', 7)] }
      const result = linkApp(manifest([{ id: 'broken', namespace: 'broken' }]), [
        moduleInput('broken', definitions),
      ])

      expect(result).toMatchObject({
        ok: false,
        document: null,
        diagnostics: [
          {
            code: 'duplicate-definition',
            source: { sourceId: 'module.wf', location: { start: { line: 7 } } },
          },
        ],
      })
    },
  )

  it.each(['layout', 'component'] as const)(
    'refuses a missing %s reference at the reference location',
    (kind) => {
      const result = linkApp(manifest([{ id: 'broken', namespace: 'broken' }]), [
        moduleInput('broken', { screens: [screen('home', 2, [reference(kind, 'absent', 9)])] }),
      ])

      expect(result).toMatchObject({
        ok: false,
        document: null,
        diagnostics: [
          {
            code: 'missing-reference',
            message: `Missing ${kind} reference "broken:absent"`,
            source: { sourceId: 'references.wf', location: { start: { line: 9 } } },
          },
        ],
      })
    },
  )

  it('refuses mixed layout/component cycles with deterministic diagnostics', () => {
    const cyclic = moduleInput('cyclic', {
      layouts: [layout('shell', 2, [reference('component', 'nav', 8)])],
      components: [component('nav', 4, [reference('layout', 'shell', 6)])],
    })
    const appManifest = manifest([{ id: 'cyclic', namespace: 'app' }])

    const first = linkApp(appManifest, [cyclic])
    const second = linkApp(appManifest, [cyclic])

    expect(first).toEqual(second)
    expect(first).toMatchObject({
      ok: false,
      document: null,
      diagnostics: [
        {
          code: 'cyclic-reference',
          message: 'Cyclic layout/component reference among app:component:nav, app:layout:shell',
          source: { sourceId: 'references.wf', location: { start: { line: 6 } } },
        },
      ],
    })
  })

  it('sorts independent diagnostics by source location instead of traversal order', () => {
    const result = linkApp(manifest([{ id: 'broken', namespace: 'app' }]), [
      moduleInput('broken', {
        screens: [
          screen('home', 2, [reference('layout', 'late', 12), reference('component', 'early', 3)]),
        ],
      }),
    ])

    expect(result.diagnostics.map((diagnostic) => diagnostic.message)).toEqual([
      'Missing component reference "app:early"',
      'Missing layout reference "app:late"',
    ])
  })
})
