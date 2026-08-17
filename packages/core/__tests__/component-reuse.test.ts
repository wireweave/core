import { describe, expect, it } from 'vitest'
import {
  linkApp,
  parse,
  printWireframe,
  render,
  validate,
  type AppManifest,
  type AppModuleInput,
  type AppSourceSpan,
  type ComponentDefinitionNode,
  type ComponentUseNode,
  type PageNode,
} from '../src'
import { firstDifference, stripLoc } from './helpers/ast'

const SOURCE = `component profile(name: string, progress: number, disabled: boolean) {
  card {
    title "$name"
    progress value="$progress"
    button "Open" disabled="$disabled"
    slot body
    slot actions
  }
}

page "Ada" {
  use profile(name="Ada", progress=25, disabled=false) {
    fill body {
      text "Ada body"
    }
    fill actions {
      button "Edit Ada"
    }
  }
}

page "Grace" {
  use profile(name="Grace", progress=80, disabled=true) {
    fill body {
      text "Grace body"
    }
    fill actions {
      button "Edit Grace"
    }
  }
}
`

function sourceSpan(sourceId: string, node: { loc?: AppSourceSpan['location'] }): AppSourceSpan {
  if (node.loc === undefined) throw new Error(`Expected ${sourceId} node to have a source location`)
  return { sourceId, location: node.loc }
}

function appInputs(source = SOURCE): { manifest: AppManifest; modules: AppModuleInput[] } {
  const document = parse(source)
  const component = document.children.find(
    (node): node is ComponentDefinitionNode => node.type === 'Component',
  )
  const screens = document.children.filter((node): node is PageNode => node.type === 'Page')
  if (component === undefined) throw new Error('Expected a component definition')

  const sourceId = 'components.wf'
  const manifest: AppManifest = {
    id: 'profiles',
    sourceId: 'wireweave.app.json',
    modules: [
      {
        id: 'main',
        namespace: 'app',
        location: sourceSpan(sourceId, component).location,
      },
    ],
  }
  const modules: AppModuleInput[] = [
    {
      id: 'main',
      source: sourceSpan(sourceId, component),
      layouts: [],
      components: [
        {
          id: component.name,
          node: component,
          source: sourceSpan(sourceId, component),
        },
      ],
      screens: screens.map((screen, index) => ({
        id: `screen-${index}`,
        node: screen,
        source: sourceSpan(sourceId, screen),
      })),
    },
  ]
  return { manifest, modules }
}

describe('explicit reusable components', () => {
  it('parses and prints typed definitions, explicit uses, named slots, and fills losslessly', () => {
    const first = parse(SOURCE)
    const printed = printWireframe(first)
    const second = parse(printed)

    expect(firstDifference(stripLoc(second), stripLoc(first))).toBeNull()
    expect(printWireframe(second)).toBe(printed)

    const pages = first.children.filter((node): node is PageNode => node.type === 'Page')
    expect(pages.map((page) => page.uses)).toEqual([undefined, undefined])
    expect(pages.map((page) => page.children[0]?.type)).toEqual(['ComponentUse', 'ComponentUse'])
  })

  it('validates typed inputs and named slot contracts', () => {
    expect(validate(parse(SOURCE))).toEqual({ valid: true, errors: [] })

    const invalid = validate(
      parse(`component badge(count: number) { slot content }
page { use badge(count="many") { fill missing { text "x" } } }`),
    )
    expect(invalid.valid).toBe(false)
    expect(invalid.errors.map((error) => error.message)).toEqual(
      expect.arrayContaining([
        'Input "count" for component "badge" must be number, received string',
        'Unknown slot "missing" for component "badge"',
        'Missing fill for slot "content" in component "badge"',
      ]),
    )
  })

  it('links and renders two deterministic, distinct instances with their own values and fills', () => {
    const { manifest, modules } = appInputs()
    const first = linkApp(manifest, modules)
    const second = linkApp(manifest, modules)
    expect(first.ok).toBe(true)
    expect(second).toEqual(first)
    if (!first.ok) return

    const uses = first.document.screens.map((screen) => screen.node.children[0] as ComponentUseNode)
    expect(uses[0]?.targetId).toBe(uses[1]?.targetId)
    expect(uses[0]?.instanceId).toBeDefined()
    expect(uses[1]?.instanceId).toBeDefined()
    expect(uses[0]?.instanceId).not.toBe(uses[1]?.instanceId)

    const html = first.document.screens.map(
      (screen) =>
        render({ type: 'Document', children: [screen.node] }, { includeStyles: false }).html,
    )
    expect(html[0]).toContain('data-wf-component="profile"')
    expect(html[0]).toContain(`data-wf-instance="${uses[0]?.instanceId}"`)
    expect(html[0]).toContain('Ada body')
    expect(html[0]).toContain('Edit Ada')
    expect(html[0]).toContain('width: 25%')
    expect(html[0]).not.toContain('disabled')

    expect(html[1]).toContain(`data-wf-instance="${uses[1]?.instanceId}"`)
    expect(html[1]).toContain('Grace body')
    expect(html[1]).toContain('Edit Grace')
    expect(html[1]).toContain('width: 80%')
    expect(html[1]).toContain('disabled')
  })

  it('keeps programmatic legacy component nodes without parameters linkable', () => {
    const { manifest, modules } = appInputs('component plain { text "Plain" }\npage { }')
    delete modules[0]?.components[0]?.node.parameters
    expect(linkApp(manifest, modules).ok).toBe(true)
  })
})
