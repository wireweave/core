/**
 * E1 — `navigate` target resolution: identifier namespace first, display-text
 * namespace second.
 *
 * A page has two names of different kinds. `id` is a stable slug the author
 * opted into; `title` is display copy that is optional, non-unique, and edited
 * freely. Resolving `id` first is what keeps an edge pointing at a screen when
 * that screen's heading is reworded. The title fallback stays because every
 * document written before `id` existed depends on it.
 *
 * Each case below is asserted separately — an id-resolved edge, a
 * title-fallback-resolved edge, and one that matches neither and is reported as
 * dangling — so a regression in any single branch fails on its own.
 */

import { describe, it, expect } from 'vitest'
import { parse, extractScreenTransitions } from '../src'
import type { TransitionEdge } from '../src'

/** The single edge fired by the button carrying `label`. */
function edgeFrom(edges: readonly TransitionEdge[], label: string): TransitionEdge {
  const found = edges.filter((e) => e.trigger.label === label)
  expect(found).toHaveLength(1)
  return found[0]
}

describe('navigate resolution — id first, title fallback', () => {
  it('resolves a target that matches a page id', () => {
    const doc = parse(`
page "결제 내역" id=billing {
  text "청구서"
}

page "홈" id=home {
  button "결제로" navigate="billing"
}
`)
    const graph = extractScreenTransitions(doc)
    const edge = edgeFrom(graph.edges, '결제로')

    expect(edge.kind).toBe('navigate')
    expect(edge.target).toBe('billing')
    expect(edge.resolved).toBe(true)
    expect(edge.to).toEqual({ pageIndex: 0, id: 'billing', title: '결제 내역' })
    expect(graph.dangling).toHaveLength(0)
  })

  it('falls back to an exact title match when no page declares that id', () => {
    const doc = parse(`
page "결제 내역" {
  text "청구서"
}

page "홈" {
  button "결제로" navigate="결제 내역"
}
`)
    const graph = extractScreenTransitions(doc)
    const edge = edgeFrom(graph.edges, '결제로')

    expect(edge.resolved).toBe(true)
    expect(edge.to).toEqual({ pageIndex: 0, title: '결제 내역' })
    expect(graph.dangling).toHaveLength(0)
  })

  it('reports a target matching neither namespace as dangling', () => {
    // A plain name, not a URL: it was meant to be a screen and found none.
    const doc = parse(`
page "결제 내역" id=billing {
  text "청구서"
}

page "홈" id=home {
  button "결제로" navigate="결제"
}
`)
    const graph = extractScreenTransitions(doc)
    const edge = edgeFrom(graph.edges, '결제로')

    expect(edge.resolved).toBe(false)
    expect(edge.to).toBeNull()
    expect(edge.external).toBeUndefined()
    expect(graph.dangling).toHaveLength(1)
    expect(graph.dangling[0]).toBe(edge)
  })

  it('renaming a title does not dangle an id-addressed edge, but does dangle a title-addressed one', () => {
    const source = (heading: string) => `
page "${heading}" id=billing {
  text "청구서"
}

page "홈" id=home {
  button "id 로" navigate="billing"
  button "title 로" navigate="결제 내역"
}
`
    const before = extractScreenTransitions(parse(source('결제 내역')))
    expect(edgeFrom(before.edges, 'id 로').resolved).toBe(true)
    expect(edgeFrom(before.edges, 'title 로').resolved).toBe(true)

    const after = extractScreenTransitions(parse(source('청구 내역')))
    expect(edgeFrom(after.edges, 'id 로').resolved).toBe(true)
    expect(edgeFrom(after.edges, 'title 로').resolved).toBe(false)
    expect(after.dangling.map((e) => e.trigger.label)).toEqual(['title 로'])
  })

  it('lets the id namespace win when one page id equals another page title', () => {
    // Page 0 is *titled* "billing"; page 1 *is* `id=billing`. The identifier
    // wins, so page 0 is not reachable by that string — deliberately, and with
    // no positional tie-break to reason about.
    const doc = parse(`
page "billing" {
  text "우연히 같은 이름"
}

page "청구" id=billing {
  text "진짜 청구 화면"
}

page "홈" {
  button "결제로" navigate="billing"
}
`)
    const graph = extractScreenTransitions(doc)
    const edge = edgeFrom(graph.edges, '결제로')

    expect(edge.resolved).toBe(true)
    expect(edge.to).toEqual({ pageIndex: 1, id: 'billing', title: '청구' })
  })

  it('resolves duplicates within a namespace to the first page in document order', () => {
    const doc = parse(`
page "첫 번째" id=dup {
  text "A"
}

page "두 번째" id=dup {
  text "B"
}

page "홈" {
  button "가기" navigate="dup"
}
`)
    const graph = extractScreenTransitions(doc)
    expect(edgeFrom(graph.edges, '가기').to).toEqual({
      pageIndex: 0,
      id: 'dup',
      title: '첫 번째',
    })
  })

  it('exposes both names on every screen and on the source endpoint', () => {
    const doc = parse(`
page "홈" id=home {
  button "결제로" navigate="billing"
}

page "결제 내역" id=billing {
  text "청구서"
}

page "이름 없는 슬러그" {
  text "id 없음"
}
`)
    const graph = extractScreenTransitions(doc)

    expect(graph.screens.map(({ index, id, title }) => ({ index, id, title }))).toEqual([
      { index: 0, id: 'home', title: '홈' },
      { index: 1, id: 'billing', title: '결제 내역' },
      { index: 2, id: undefined, title: '이름 없는 슬러그' },
    ])
    expect('id' in graph.screens[2]).toBe(false)
    expect(edgeFrom(graph.edges, '결제로').from).toEqual({
      pageIndex: 0,
      id: 'home',
      title: '홈',
    })
  })

  it('leaves opens / toggles / action resolution untouched by the id namespace', () => {
    const doc = parse(`
page "홈" id=home {
  modal "메뉴" id="user-menu" { text "프로필" }
  button "메뉴 열기" opens="user-menu"
  button "홈으로 여는 척" opens="home"
  button "로그아웃" action="logout"
}
`)
    const graph = extractScreenTransitions(doc)

    expect(edgeFrom(graph.edges, '메뉴 열기').resolved).toBe(true)
    // A page id is not an overlay id — `opens` never crosses a page boundary.
    const cross = edgeFrom(graph.edges, '홈으로 여는 척')
    expect(cross.resolved).toBe(false)
    expect(cross.to).toBeNull()
    expect(edgeFrom(graph.edges, '로그아웃').resolved).toBe(false)
    expect(graph.dangling).toHaveLength(0)
  })
})

/**
 * A `navigate` target is either the name of a page or a URL — the DSL documents
 * both. An unmatched name is an authoring mistake; an unmatched URL is not,
 * because there was never a page for it to match. Reporting the second as a
 * broken transition would mark every correct outbound link as breakage.
 */
describe('navigate resolution — URL targets leave the document', () => {
  const WITH_LINKS = `
page "약관" id=terms {
  link "개인정보 처리방침" navigate="https://example.com/privacy"
  link "이전 버전" navigate="/terms/versions"
  link "가입" navigate="signup"
}

page "가입" id=signup { text "가입" }
`

  it('classifies a URL target as external, never dangling', () => {
    const graph = extractScreenTransitions(parse(WITH_LINKS))

    expect(graph.external.map((e) => e.target)).toEqual([
      'https://example.com/privacy',
      '/terms/versions',
    ])
    for (const edge of graph.external) {
      expect(edge.kind).toBe('navigate')
      expect(edge.external).toBe(true)
      // A complete destination, but not one of this document's pages.
      expect(edge.resolved).toBe(true)
      expect(edge.to).toBeNull()
    }
    expect(graph.dangling).toHaveLength(0)
  })

  it('still resolves page targets alongside them', () => {
    const graph = extractScreenTransitions(parse(WITH_LINKS))
    const edge = edgeFrom(graph.edges, '가입')

    expect(edge.external).toBeUndefined()
    expect(edge.to).toEqual({ pageIndex: 1, id: 'signup', title: '가입' })
    expect(graph.external).not.toContain(edge)
  })

  it('tells an external link apart from an opaque action', () => {
    const graph = extractScreenTransitions(
      parse(`
page "홈" {
  button "약관" navigate="https://example.com/terms"
  button "로그아웃" action="logout"
}
`),
    )
    const link = edgeFrom(graph.edges, '약관')
    const action = edgeFrom(graph.edges, '로그아웃')

    // Both go nowhere in the page graph; only one is a real destination.
    expect(link.to).toBeNull()
    expect(action.to).toBeNull()
    expect(link.resolved).toBe(true)
    expect(action.resolved).toBe(false)
    expect(action.external).toBeUndefined()
    expect(graph.external).toEqual([link])
  })

  it('prefers a page named like a URL over the shape rule', () => {
    // Document names are consulted before shape, so an odd page name still wins.
    const graph = extractScreenTransitions(
      parse(`
page "안내" id="/docs" { text "문서" }
page "홈" { button "문서로" navigate="/docs" }
`),
    )
    const edge = edgeFrom(graph.edges, '문서로')

    expect(edge.external).toBeUndefined()
    expect(edge.to).toEqual({ pageIndex: 0, id: '/docs', title: '안내' })
    expect(graph.external).toHaveLength(0)
  })

  it('reads a target with whitespace as a page name, not a scheme', () => {
    // "Note: draft" has a colon but is prose — a URL cannot carry a raw space.
    const graph = extractScreenTransitions(
      parse(`
page "홈" { button "가기" navigate="Note: draft" }
`),
    )
    const edge = edgeFrom(graph.edges, '가기')

    expect(edge.external).toBeUndefined()
    expect(graph.dangling).toEqual([edge])
  })
})
