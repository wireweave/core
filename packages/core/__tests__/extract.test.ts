/**
 * Extraction module tests — E3 (screen fields) + E1 (transition graph).
 */

import { describe, it, expect } from 'vitest'
import {
  parse,
  documentPages,
  extractScreenFields,
  extractAllScreenFields,
  extractScreenTransitions,
} from '../src'

const MULTI_PAGE = `
page "Login" {
  input "Email" inputType="email" placeholder="you@example.com" required
  input "Password" inputType="password" required
  button "Sign in" navigate="Dashboard"
  link "Forgot password?" navigate="/reset"
}

page "Dashboard" {
  title "Overview"
  text "Welcome back"
  badge "3"
  modal "User Menu" id="user-menu" { text "Profile" }
  button "Open menu" opens="user-menu"
  button "Toggle sidebar" toggles="sidebar"
  button "Log out" navigate="Login" action="logout"
}
`

describe('extractScreenFields (E3)', () => {
  it('extracts title, inputs, and per-category counts from a form page', () => {
    const doc = parse(MULTI_PAGE)
    const login = extractScreenFields(documentPages(doc)[0])

    expect(login.title).toBe('Login')
    expect(login.inputs).toHaveLength(2)

    const email = login.inputs[0]
    expect(email).toMatchObject({
      nodeType: 'Input',
      label: 'Email',
      inputType: 'email',
      placeholder: 'you@example.com',
      required: true,
    })
    expect(login.inputs[1]).toMatchObject({ label: 'Password', inputType: 'password' })

    expect(login.summary.hasForm).toBe(true)
    expect(login.summary.inputCount).toBe(2)
    expect(login.summary.byCategory.input).toBe(3) // 2 inputs + 1 button (link is text)
    expect(login.summary.total).toBe(login.elements.length)
  })

  it('normalises select options to strings', () => {
    const doc = parse('page "P" { select "Role" ["Admin", "User"] }')
    const fields = extractScreenFields(documentPages(doc)[0])
    expect(fields.inputs[0]).toMatchObject({
      nodeType: 'Select',
      label: 'Role',
      options: ['Admin', 'User'],
    })
  })

  it('collects display/data/text nodes as displayData', () => {
    const doc = parse(MULTI_PAGE)
    const dash = extractScreenFields(documentPages(doc)[1])

    const types = dash.displayData.map((d) => d.nodeType).sort()
    // Title + Text("Welcome back") + Badge + Text("Profile" inside modal)
    expect(types).toEqual(['Badge', 'Text', 'Text', 'Title'])
    expect(dash.displayData.find((d) => d.nodeType === 'Title')?.content).toBe('Overview')
    expect(dash.summary.hasOverlay).toBe(true)
    expect(dash.summary.hasForm).toBe(false)
  })

  it('emits one action per interactive prop, including multi-prop nodes', () => {
    const doc = parse(MULTI_PAGE)
    const dash = extractScreenFields(documentPages(doc)[1])

    const logout = dash.actions.filter((a) => a.label === 'Log out')
    expect(logout).toHaveLength(2)
    expect(logout.map((a) => a.kind)).toEqual(['navigate', 'action'])
    expect(logout.map((a) => a.target)).toEqual(['Login', 'logout'])

    const opens = dash.actions.find((a) => a.kind === 'opens')
    expect(opens).toMatchObject({ nodeType: 'Button', label: 'Open menu', target: 'user-menu' })
    expect(dash.summary.actionCount).toBe(4)
  })

  it('handles an empty page', () => {
    const doc = parse('page "Blank" {}')
    const fields = extractScreenFields(documentPages(doc)[0])
    expect(fields.title).toBe('Blank')
    expect(fields.elements).toHaveLength(0)
    expect(fields.inputs).toHaveLength(0)
    expect(fields.actions).toHaveLength(0)
    expect(fields.summary).toMatchObject({ total: 0, hasForm: false, hasNavigation: false })
  })

  it('extractAllScreenFields returns one entry per page in order', () => {
    const doc = parse(MULTI_PAGE)
    const all = extractAllScreenFields(doc)
    expect(all.map((f) => f.title)).toEqual(['Login', 'Dashboard'])
  })
})

describe('extractScreenTransitions (E1)', () => {
  it('lists screens in document order', () => {
    const graph = extractScreenTransitions(parse(MULTI_PAGE))
    expect(graph.screens).toEqual([
      expect.objectContaining({ index: 0, title: 'Login' }),
      expect.objectContaining({ index: 1, title: 'Dashboard' }),
    ])
  })

  it('resolves navigate edges to pages by title match', () => {
    const graph = extractScreenTransitions(parse(MULTI_PAGE))

    const signIn = graph.edges.find((e) => e.trigger.label === 'Sign in')
    expect(signIn).toMatchObject({
      kind: 'navigate',
      target: 'Dashboard',
      resolved: true,
      from: { pageIndex: 0, title: 'Login' },
      to: { pageIndex: 1, title: 'Dashboard' },
    })

    const logout = graph.edges.find((e) => e.trigger.label === 'Log out' && e.kind === 'navigate')
    expect(logout).toMatchObject({ resolved: true, to: { pageIndex: 0, title: 'Login' } })
  })

  it('reports URL-style navigate targets as dangling', () => {
    const graph = extractScreenTransitions(parse(MULTI_PAGE))
    expect(graph.dangling).toHaveLength(1)
    expect(graph.dangling[0]).toMatchObject({
      kind: 'navigate',
      target: '/reset',
      resolved: false,
      to: null,
    })
  })

  it('resolves opens against overlay ids and keeps toggles/action off the page graph', () => {
    const graph = extractScreenTransitions(parse(MULTI_PAGE))

    const opens = graph.edges.find((e) => e.kind === 'opens')
    expect(opens).toMatchObject({ target: 'user-menu', resolved: true, to: null })

    const toggles = graph.edges.find((e) => e.kind === 'toggles')
    expect(toggles).toMatchObject({ target: 'sidebar', resolved: false, to: null })

    const action = graph.edges.find((e) => e.kind === 'action')
    expect(action).toMatchObject({ target: 'logout', resolved: false, to: null })

    // Intra-page / opaque edges never count as dangling page transitions.
    expect(graph.dangling.every((e) => e.kind === 'navigate')).toBe(true)
  })

  it('returns an empty graph for a single page with no interactions', () => {
    const graph = extractScreenTransitions(parse('page "Solo" { text "hi" }'))
    expect(graph.screens).toHaveLength(1)
    expect(graph.edges).toHaveLength(0)
    expect(graph.dangling).toHaveLength(0)
  })
})

const NAV_MENUS = `
page "Home" {
  nav [
    { label="To Dashboard" navigate="Dashboard" }
    { label="Broken" navigate="/missing" }
  ]
}

page "Dashboard" {
  nav {
    item "Home" navigate="Home"
    group "Admin" {
      item "Settings" navigate="Settings" action="track"
    }
  }
  dropdown {
    item "Open Panel" opens="panel"
    divider
    item "Sign out" action="logout"
  }
  breadcrumb [
    { label="Root" navigate="Home" }
    { label="Here" }
  ]
  drawer "Panel" id="panel" { text "panel body" }
}

page "Settings" { text "settings" }
`

describe('extractScreenTransitions — item-level triggers (E1b)', () => {
  it('resolves nav array item navigate to a page and marks the URL-style item dangling', () => {
    const graph = extractScreenTransitions(parse(NAV_MENUS))

    const toDash = graph.edges.find((e) => e.trigger.label === 'To Dashboard')
    expect(toDash).toMatchObject({
      kind: 'navigate',
      target: 'Dashboard',
      resolved: true,
      from: { pageIndex: 0, title: 'Home' },
      to: { pageIndex: 1, title: 'Dashboard' },
      trigger: { nodeType: 'Nav', item: { index: 0 } },
    })

    expect(graph.dangling).toHaveLength(1)
    expect(graph.dangling[0]).toMatchObject({
      kind: 'navigate',
      target: '/missing',
      resolved: false,
      to: null,
      trigger: { nodeType: 'Nav', label: 'Broken', item: { index: 1 } },
    })
  })

  it('extracts nav block items including grouped items, carrying multiple interactions', () => {
    const graph = extractScreenTransitions(parse(NAV_MENUS))
    const fromDash = graph.edges.filter((e) => e.from.pageIndex === 1)

    const home = fromDash.find((e) => e.trigger.nodeType === 'Nav' && e.trigger.label === 'Home')
    expect(home).toMatchObject({
      kind: 'navigate',
      resolved: true,
      to: { pageIndex: 0, title: 'Home' },
      trigger: { item: { index: 0 } },
    })

    // Grouped item resolves to a page and also emits its opaque action.
    const settingsNav = fromDash.find(
      (e) => e.trigger.label === 'Settings' && e.kind === 'navigate',
    )
    expect(settingsNav).toMatchObject({
      resolved: true,
      to: { pageIndex: 2, title: 'Settings' },
      trigger: { nodeType: 'Nav', item: { index: 1 } },
    })
    const settingsAction = fromDash.find(
      (e) => e.trigger.label === 'Settings' && e.kind === 'action',
    )
    expect(settingsAction).toMatchObject({ target: 'track', resolved: false, to: null })
  })

  it('resolves dropdown opens against a same-page overlay id and skips dividers', () => {
    const graph = extractScreenTransitions(parse(NAV_MENUS))

    const openPanel = graph.edges.find(
      (e) => e.trigger.nodeType === 'Dropdown' && e.kind === 'opens',
    )
    expect(openPanel).toMatchObject({
      target: 'panel',
      resolved: true,
      to: null,
      trigger: { label: 'Open Panel', item: { index: 0 } },
    })

    // The divider is not an item; the item after it keeps its raw index (2).
    const signOut = graph.edges.find(
      (e) => e.trigger.nodeType === 'Dropdown' && e.kind === 'action',
    )
    expect(signOut).toMatchObject({ target: 'logout', trigger: { item: { index: 2 } } })
  })

  it('resolves breadcrumb item navigate by title', () => {
    const graph = extractScreenTransitions(parse(NAV_MENUS))
    const root = graph.edges.find((e) => e.trigger.nodeType === 'Breadcrumb')
    expect(root).toMatchObject({
      kind: 'navigate',
      target: 'Home',
      resolved: true,
      to: { pageIndex: 0, title: 'Home' },
      trigger: { label: 'Root', item: { index: 0 } },
    })
  })
})

describe('extractScreenFields — item-level actions', () => {
  it('surfaces nav/dropdown/breadcrumb item interactions as actions with item context', () => {
    const doc = parse(NAV_MENUS)
    const dashboard = extractScreenFields(documentPages(doc)[1])

    const itemActions = dashboard.actions.filter((a) => a.item !== undefined)
    expect(itemActions).toEqual([
      expect.objectContaining({ nodeType: 'Nav', kind: 'navigate', target: 'Home', label: 'Home' }),
      expect.objectContaining({ nodeType: 'Nav', kind: 'navigate', target: 'Settings' }),
      expect.objectContaining({ nodeType: 'Nav', kind: 'action', target: 'track' }),
      expect.objectContaining({ nodeType: 'Dropdown', kind: 'opens', target: 'panel' }),
      expect.objectContaining({ nodeType: 'Dropdown', kind: 'action', target: 'logout' }),
      expect.objectContaining({ nodeType: 'Breadcrumb', kind: 'navigate', target: 'Home' }),
    ])
    expect(dashboard.summary.actionCount).toBe(dashboard.actions.length)
    // Menu items do not inflate the element/category totals — only real nodes.
    expect(dashboard.summary.total).toBe(dashboard.elements.length)
    expect(dashboard.elements.map((el) => el.nodeType)).toEqual([
      'Nav',
      'Dropdown',
      'Breadcrumb',
      'Drawer',
      'Text',
    ])
  })
})
