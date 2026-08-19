import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

import {
  collectInteractions,
  buildSiteModel,
  extractScreenTransitions,
  linkAndCompileApp,
  parse,
  printWireframe,
  renderSite,
  validate,
  type AppManifest,
  type AppModuleInput,
  type AppSourceSpan,
  type LayoutDefinitionNode,
  type PageNode,
  type SourceLocation,
} from '../src'

const SOURCE = `layout shell states=[
  { name=allowed, valueType=boolean, initial=false }
] {
  header {
    nav {
      item "Home" navigate=home
      item "Settings" navigate=settings
    }
  }
  modal "Dialog" id=dialog { text "Dialog body" }
  slot
}

page "Home" id=home uses=shell {
  section visibleWhen={ state=allowed, equals=true } { text "Allowed branch" }
  button "Guarded route" enabledWhen={ state=allowed, equals=true } on={
    event=click
    guard={ state=allowed, equals=true }
    effects=[{ kind=navigate, target=settings }]
  }
  button "Set allowed" on={ event=click, effects=[{ kind=set, state=allowed, value=true }] }
  button "Reset allowed" on={ event=click, effects=[{ kind=reset, state=allowed }] }
  button "Toggle allowed" on={ event=click, effects=[{ kind=toggle, state=allowed }] }
  button "Open dialog" on={ event=click, effects=[{ kind=open, target=dialog }] }
  button "Close dialog" on={ event=click, effects=[{ kind=close, target=dialog }] }
  button "Legacy submit" action=submit
}

page "Settings" id=settings uses=shell {
  button "Back home" navigate=home
}`

function fallbackLocation(): SourceLocation {
  return {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 2, offset: 1 },
  }
}

function source(node: { loc?: SourceLocation }): AppSourceSpan {
  return { sourceId: 'interaction.wf', location: node.loc ?? fallbackLocation() }
}

function compile(sourceText: string = SOURCE): {
  html: string
  sourceDocument: ReturnType<typeof parse>
} {
  const sourceDocument = parse(sourceText)
  const layout = sourceDocument.children.find(
    (node): node is LayoutDefinitionNode => node.type === 'Layout',
  )
  const screens = sourceDocument.children.filter((node): node is PageNode => node.type === 'Page')
  if (layout === undefined || screens.length === 0) throw new Error('invalid interaction fixture')

  const manifest: AppManifest = {
    id: 'interaction-app',
    sourceId: 'wireweave.app.json',
    modules: [{ id: 'app', namespace: 'app', location: fallbackLocation() }],
  }
  const modules: AppModuleInput[] = [
    {
      id: 'app',
      source: source(layout),
      layouts: [{ id: layout.name, node: layout, source: source(layout) }],
      components: [],
      screens: screens.map((screen) => ({
        id: screen.id ?? screen.title ?? 'screen',
        node: screen,
        source: source(screen),
        references: [{ kind: 'layout', id: layout.name, source: source(screen) }],
      })),
    },
  ]

  const result = linkAndCompileApp(manifest, modules)
  if (!result.ok)
    throw new Error(result.diagnostics.map((diagnostic) => diagnostic.message).join('\n'))
  return { html: result.html, sourceDocument }
}

function mount(html: string): JSDOM {
  return new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://prototype.example/demo.html',
  })
}

function elementWithText(dom: JSDOM, selector: string, text: string): Element {
  const element = [...dom.window.document.querySelectorAll(selector)].find(
    (candidate) => candidate.textContent?.trim() === text,
  )
  if (element === undefined) throw new Error(`no ${selector} contains ${JSON.stringify(text)}`)
  return element
}

function click(dom: JSDOM, element: Element): MouseEvent {
  const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })
  element.dispatchEvent(event)
  return event
}

function runtimeRegistry(html: string): {
  handlers: ReturnType<typeof collectInteractions>['interactions'][number]['handler'][]
  screenHandlers: Record<string, number[]>
  shellHandlers: Record<string, number[]>
  diagnostics: ReturnType<typeof collectInteractions>['diagnostics']
} {
  const match = /^ {2}var R = (.*);$/m.exec(html)
  if (match?.[1] === undefined) throw new Error('runtime registry missing')
  return JSON.parse(match[1]) as {
    handlers: ReturnType<typeof collectInteractions>['interactions'][number]['handler'][]
    screenHandlers: Record<string, number[]>
    shellHandlers: Record<string, number[]>
    diagnostics: ReturnType<typeof collectInteractions>['diagnostics']
  }
}

function withoutLocations(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutLocations)
  if (typeof value !== 'object' || value === null) return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'loc')
      .map(([key, child]) => [key, withoutLocations(child)]),
  )
}

describe('CORE-INTERACTION-RUNTIME', () => {
  it('parses, validates, and canonically round-trips the constrained typed DSL', () => {
    const document = parse(SOURCE)

    expect(validate(document)).toMatchObject({ valid: true, errors: [] })
    expect(withoutLocations(parse(printWireframe(document)))).toEqual(withoutLocations(document))

    const model = collectInteractions(document)
    expect(model.states).toEqual([{ name: 'allowed', valueType: 'boolean', initial: false }])
    expect(model.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      'unknown-legacy-action',
    )
  })

  it('executes click navigation and records the same screen in fragment/history', () => {
    const dom = mount(compile().html)
    const initialHistory = dom.window.history.length

    const event = click(dom, elementWithText(dom, 'a', 'Settings'))

    expect(event.defaultPrevented).toBe(true)
    expect(dom.window.document.querySelector('.wf-site')?.getAttribute('data-current-screen')).toBe(
      '1',
    )
    expect(dom.window.location.hash).toBe('#settings')
    expect(dom.window.history.length).toBe(initialHistory + 1)
  })

  it('applies guarded set/reset/toggle/open/close effects and leaves unknown actions inert', () => {
    const dom = mount(compile().html)
    const { document } = dom.window
    const branch = elementWithText(dom, '.wf-section', 'Allowed branch')
    const guardedRoute = elementWithText(dom, 'button', 'Guarded route')

    expect(branch.hasAttribute('hidden')).toBe(true)
    expect(guardedRoute.hasAttribute('disabled')).toBe(true)

    click(dom, guardedRoute)
    expect(document.querySelector('.wf-site')?.getAttribute('data-current-screen')).toBe('0')
    expect(dom.window.location.hash).toBe('')

    click(dom, elementWithText(dom, 'button', 'Set allowed'))
    expect(branch.hasAttribute('hidden')).toBe(false)
    expect(guardedRoute.hasAttribute('disabled')).toBe(false)

    click(dom, elementWithText(dom, 'button', 'Reset allowed'))
    expect(branch.hasAttribute('hidden')).toBe(true)
    click(dom, elementWithText(dom, 'button', 'Toggle allowed'))
    expect(branch.hasAttribute('hidden')).toBe(false)

    const dialog = document.querySelector('.wf-modal-backdrop')
    if (dialog === null) throw new Error('dialog fixture missing')
    click(dom, elementWithText(dom, 'button', 'Close dialog'))
    expect(dialog.classList.contains('wf-closed')).toBe(true)
    click(dom, elementWithText(dom, 'button', 'Open dialog'))
    expect(dialog.classList.contains('wf-closed')).toBe(false)

    const legacy = click(dom, elementWithText(dom, 'button', 'Legacy submit'))
    expect(legacy.defaultPrevented).toBe(false)
    expect(document.querySelector('.wf-site')?.getAttribute('data-wf-runtime-diagnostic')).toBe(
      'unknown-action:submit',
    )

    click(dom, guardedRoute)
    expect(document.querySelector('.wf-site')?.getAttribute('data-current-screen')).toBe('1')
    expect(dom.window.location.hash).toBe('#settings')
  })

  it('uses the same normalized page+layout route set for graph and runtime', () => {
    const { html, sourceDocument } = compile()
    const graph = extractScreenTransitions(sourceDocument)
    const runtime = runtimeRegistry(html)

    const graphRoutes = graph.edges
      .filter((edge) => edge.kind === 'navigate')
      .map((edge) => ({
        screenIndex: edge.from.pageIndex,
        target: edge.target,
        source: edge.source ?? 'screen',
      }))
    const routesFor = (ids: number[], screenIndex: number, source: 'screen' | 'layout') =>
      ids.flatMap((id) =>
        runtime.handlers[id].effects
          .filter((effect) => effect.kind === 'navigate')
          .map((effect) => ({
            screenIndex,
            target: 'target' in effect ? effect.target : '',
            source,
          })),
      )
    const site = buildSiteModel(sourceDocument)
    const runtimeShellNames = Object.keys(runtime.shellHandlers)
    const runtimeShellFor = new Map(
      site.shells.map((shell, index) => [shell.name, runtimeShellNames[index]]),
    )
    const runtimeRoutes = site.screens.flatMap((screen) => [
      ...routesFor(runtime.screenHandlers[String(screen.index)] ?? [], screen.index, 'screen'),
      ...routesFor(
        screen.shell === undefined
          ? []
          : (runtime.shellHandlers[runtimeShellFor.get(screen.shell) ?? ''] ?? []),
        screen.index,
        'layout',
      ),
    ])

    expect(graphRoutes).toEqual(runtimeRoutes)
    expect(graphRoutes.filter((route) => route.source === 'layout')).toEqual([
      { screenIndex: 0, target: 'home', source: 'layout' },
      { screenIndex: 0, target: 'settings', source: 'layout' },
      { screenIndex: 1, target: 'home', source: 'layout' },
      { screenIndex: 1, target: 'settings', source: 'layout' },
    ])
    expect(runtime.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      'unknown-legacy-action',
    )
  })
})

/**
 * A handler inside a `component` definition needs the linker, by design.
 *
 * `collectInteractions` walks screens and layouts, never component
 * definitions. That is the boundary, not an oversight: a handler in a
 * definition is written against the component's parameters —
 * `target="$to"` — so before an invocation binds its inputs there is no
 * destination to record, only the name of one. Collecting from the definition
 * would register `"$to"` as a route to a screen that does not exist, and a
 * component used twice with different inputs is two routes that one walk of
 * the definition cannot tell apart.
 *
 * `linkApp` is what binds them: `expandComponentUse` substitutes the inputs and
 * returns a tree whose handlers name real screens. So the linked path sees
 * every component interaction and the unlinked one sees none — pinned here so
 * the difference stays a documented contract rather than a surprise.
 */
describe('component interactions require the linked path', () => {
  const SOURCE = `component navCard(to: string) {
  card on={ event=click, effects=[{ kind=navigate, target="$to" }] } { text "go" }
}
page "A" id=a { use navCard(to="b") }
page "B" id=b { text "b" }`

  it('leaves the handler target an unbound parameter before linking', () => {
    const document = parse(SOURCE)
    const component = document.children.find((node) => node.type === 'Component')
    expect(component).toBeDefined()

    // The reason the walk cannot collect it: the target is the parameter's
    // name, not a screen's.
    const card = (component as { children: { on?: unknown }[] }).children[0]
    expect(JSON.stringify(card?.on)).toContain('$to')

    expect(collectInteractions(document).interactions).toEqual([])
  })

  it('marks the invocation unresolved when renderSite runs on an unlinked document', () => {
    const html = renderSite(parse(SOURCE))

    expect(html).toContain('data-wf-component-unresolved')
    expect(html).toContain('data-wf-component="navCard"')
  })
})
