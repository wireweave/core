import { describe, expect, it } from 'vitest'
import {
  collectParameterReferences,
  linkApp,
  parse,
  validate,
  type AppManifest,
  type AppModuleInput,
  type AppSourceSpan,
  type ComponentDefinitionNode,
  type ComponentUseNode,
  type InteractionHandler,
  type PageNode,
} from '../src'

/**
 * A component parameter may be referenced anywhere a string value sits, and
 * link-time substitution replaces all of them. Validation used to look only at
 * a node's own top-level string props, so a reference nested inside an
 * interaction effect was substituted but never checked: an undeclared name
 * survived as the literal string `"$too"` with no diagnostic at all.
 */

function sourceSpan(sourceId: string, node: { loc?: AppSourceSpan['location'] }): AppSourceSpan {
  if (node.loc === undefined) throw new Error(`Expected ${sourceId} node to have a source location`)
  return { sourceId, location: node.loc }
}

function appInputs(source: string): { manifest: AppManifest; modules: AppModuleInput[] } {
  const document = parse(source)
  const components = document.children.filter(
    (node): node is ComponentDefinitionNode => node.type === 'Component',
  )
  const screens = document.children.filter((node): node is PageNode => node.type === 'Page')
  const anchor = components[0]
  if (anchor === undefined) throw new Error('Expected a component definition')

  const sourceId = 'components.wf'
  return {
    manifest: {
      id: 'app',
      sourceId: 'wireweave.app.json',
      modules: [{ id: 'main', namespace: 'app', location: sourceSpan(sourceId, anchor).location }],
    },
    modules: [
      {
        id: 'main',
        source: sourceSpan(sourceId, anchor),
        layouts: [],
        components: components.map((component) => ({
          id: component.name,
          node: component,
          source: sourceSpan(sourceId, component),
        })),
        screens: screens.map((screen, index) => ({
          id: `screen-${index}`,
          node: screen,
          source: sourceSpan(sourceId, screen),
        })),
      },
    ],
  }
}

/** A reference nested inside an interaction effect — the case that escaped. */
const NESTED_TYPO = `component c(to: string) {
  button "x" on={event=click, effects=[{kind=navigate, target="$too"}]}
}

page "P" {
  use c(to="/home")
}
`

const NESTED_VALID = `component c(to: string) {
  button "x" on={event=click, effects=[{kind=navigate, target="$to"}]}
}

page "P" {
  use c(to="/home")
}
`

describe('component parameter references are checked wherever they are substituted', () => {
  it('collects references from nested objects and arrays, not just top-level props', () => {
    const definition = parse(NESTED_TYPO).children.find(
      (node): node is ComponentDefinitionNode => node.type === 'Component',
    )
    if (definition === undefined) throw new Error('Expected a component definition')

    const references = collectParameterReferences(definition.children)

    // Control: the traversal must actually reach the nested value. An empty
    // result would make every assertion below vacuously true — this repository
    // has already seen a check pass on empty data once.
    expect(references.length).toBeGreaterThan(0)
    expect(references).toEqual([expect.objectContaining({ name: 'too', key: 'target' })])
  })

  it('reports an undeclared reference nested inside an effect', () => {
    const result = validate(parse(NESTED_TYPO))

    expect(result.valid).toBe(false)
    expect(result.errors.map((error) => error.message)).toEqual([
      'Unknown component parameter reference "$too" in component "c"',
    ])
    expect(result.errors[0]?.attribute).toBe('target')
  })

  it('accepts a declared reference in the same nested position and substitutes it', () => {
    expect(validate(parse(NESTED_VALID))).toEqual({ valid: true, errors: [] })

    const { manifest, modules } = appInputs(NESTED_VALID)
    const linked = linkApp(manifest, modules)
    expect(linked.diagnostics).toEqual([])
    expect(linked.ok).toBe(true)
    if (!linked.ok) return

    const use = linked.document.screens[0]?.node.children[0] as ComponentUseNode
    const button = use.children?.[0]
    const handler = (button as { on?: InteractionHandler }).on
    const effect = handler?.effects[0]

    // Control: substitution must have produced a real effect to inspect.
    expect(effect).toBeDefined()
    expect(effect).toEqual({ kind: 'navigate', target: '/home' })
  })

  it('reports an undeclared reference from the linker as well as the validator', () => {
    const { manifest, modules } = appInputs(NESTED_TYPO)
    const linked = linkApp(manifest, modules)

    expect(linked.ok).toBe(false)
    expect(linked.diagnostics.map((diagnostic) => diagnostic.message)).toEqual([
      'Unknown parameter reference "$too" in component "app:c"',
    ])
  })

  it('checks references held in an array of strings', () => {
    const source = `component c(first: string) {
  select options=["$first", "$second"]
}

page "P" {
  use c(first="A")
}
`
    const references = collectParameterReferences(
      (
        parse(source).children.find(
          (node): node is ComponentDefinitionNode => node.type === 'Component',
        ) as ComponentDefinitionNode
      ).children,
    )
    expect(references.map((item) => item.name)).toEqual(['first', 'second'])

    const result = validate(parse(source))
    expect(result.valid).toBe(false)
    expect(result.errors.map((error) => error.message)).toEqual([
      'Unknown component parameter reference "$second" in component "c"',
    ])
  })

  it('never treats a source location as a parameter reference', () => {
    const definition = parse(NESTED_VALID).children.find(
      (node): node is ComponentDefinitionNode => node.type === 'Component',
    )
    if (definition === undefined) throw new Error('Expected a component definition')

    // Control: `loc` must really be present, or the exclusion proves nothing.
    expect(definition.children[0]?.loc).toBeDefined()

    const injected = JSON.parse(JSON.stringify(definition.children)) as ComponentDefinitionNode[]
    // A location is structural, not authored content. Even a `$`-shaped string
    // reaching one must not be reported.
    ;(injected[0] as unknown as { loc: Record<string, unknown> }).loc.source = '$notAParameter'

    expect(collectParameterReferences(injected).map((item) => item.name)).toEqual(['to'])
  })

  it('leaves a partial-match string alone — only a whole-string value is a reference', () => {
    const source = `component c(to: string) {
  text "go to $to now"
}

page "P" {
  use c(to="/home")
}
`
    const definition = parse(source).children.find(
      (node): node is ComponentDefinitionNode => node.type === 'Component',
    )
    if (definition === undefined) throw new Error('Expected a component definition')

    expect(collectParameterReferences(definition.children)).toEqual([])
    expect(validate(parse(source))).toEqual({ valid: true, errors: [] })
  })
})
