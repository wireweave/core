/**
 * A DOM small enough to run the site runtime against, and no larger.
 *
 * `renderSite` ships an inline script, and until now the only thing that ever
 * executed it was a browser a human opened by hand. That leaves the one part of
 * the output with behaviour as the one part with no regression guard: a
 * screenshot proves a screen rendered, not that a click took the path it was
 * supposed to take.
 *
 * The suite runs on `environment: 'node'`, so this is that DOM — a tree, four
 * attribute methods, `classList`, `closest` and a selector matcher covering
 * exactly the selectors the runtime uses: `.class`, `[attr]`, `[attr="value"]`,
 * an optional tag qualifier on any of those (`a[href]`), and comma-separated
 * unions. Anything else throws rather than quietly matching nothing, because a
 * selector this harness silently failed to understand would turn a real
 * regression into a passing test.
 *
 * It is not the whole story: `renderer-site-runtime-behaviour.test.ts` runs the
 * shipped document in jsdom and dispatches real events, which is what catches a
 * click reaching the browser. This harness answers the question jsdom cannot —
 * see instrumentation below.
 *
 * Its second job is instrumentation. {@link Element.reads} records every
 * `getAttribute` name in order, which is how a test can assert that a lookup was
 * *not attempted* rather than merely that its result was discarded — two
 * different code paths that a value assertion alone cannot tell apart.
 */

import { runInNewContext } from 'node:vm'

/** HTML elements that never have a closing tag. */
const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
])

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/**
 * One compound selector: an optional tag name, and a class or an attribute.
 *
 * `tag` is the qualifier, not a selector on its own — the runtime never asks
 * for a bare tag, and accepting one would make `matches('a')` legal here while
 * meaning something no caller wanted.
 */
interface SimpleSelector {
  tag?: string
  className?: string
  attr?: string
  value?: string
}

/**
 * Parse a selector list into simple selectors.
 *
 * @throws when a selector form the runtime does not use appears — see the
 * module note on why unknown forms must not degrade to "matches nothing".
 */
function parseSelector(selector: string): SimpleSelector[] {
  return selector.split(',').map((part) => {
    const trimmed = part.trim()
    // A tag qualifier binds to whatever follows it: `a[href]` is the anchor
    // guard's selector, and matching it as a bare `[href]` would also claim
    // `<link href>` in the head.
    const [, tagPart = undefined, rest = trimmed] = /^([a-z][a-z0-9]*)(.+)$/i.exec(trimmed) ?? []
    const tag = tagPart?.toLowerCase()
    const asClass = /^\.([\w-]+)$/.exec(rest)
    if (asClass) return { tag, className: asClass[1] }
    const asAttr = /^\[([\w-]+)(?:="((?:[^"\\]|\\.)*)")?\]$/.exec(rest)
    if (asAttr) {
      return asAttr[2] === undefined
        ? { tag, attr: asAttr[1] }
        : { tag, attr: asAttr[1], value: asAttr[2].replace(/\\(.)/g, '$1') }
    }
    throw new Error(`unsupported selector: ${trimmed}`)
  })
}

/** A parsed element. Text is not modelled: nothing in the runtime reads it. */
export class Element {
  readonly children: Element[] = []
  parentNode: Element | null = null
  /** Every `getAttribute` name this element was asked for, in call order. */
  readonly reads: string[] = []

  private readonly classes: Set<string>

  readonly classList = {
    add: (name: string): void => {
      this.classes.add(name)
    },
    remove: (name: string): void => {
      this.classes.delete(name)
    },
    contains: (name: string): boolean => this.classes.has(name),
    toggle: (name: string): void => {
      if (!this.classes.delete(name)) this.classes.add(name)
    },
  }

  constructor(
    readonly tag: string,
    private readonly attrs = new Map<string, string>(),
  ) {
    this.classes = new Set((attrs.get('class') ?? '').split(/\s+/).filter(Boolean))
  }

  getAttribute(name: string): string | null {
    this.reads.push(name)
    return this.attrs.has(name) ? (this.attrs.get(name) as string) : null
  }

  hasAttribute(name: string): boolean {
    return this.attrs.has(name)
  }

  setAttribute(name: string, value: string): void {
    this.attrs.set(name, value)
  }

  removeAttribute(name: string): void {
    this.attrs.delete(name)
  }

  /** Class names currently on the element, sorted for stable assertions. */
  get className(): string[] {
    return [...this.classes].sort()
  }

  matches(selector: string): boolean {
    return parseSelector(selector).some((part) => {
      if (part.tag !== undefined && this.tag.toLowerCase() !== part.tag) return false
      if (part.className !== undefined) return this.classes.has(part.className)
      const attr = part.attr as string
      if (!this.attrs.has(attr)) return false
      return part.value === undefined || this.attrs.get(attr) === part.value
    })
  }

  closest(selector: string): Element | null {
    // The synthetic root is not a candidate: it stands for the document, and a
    // selector matching it would hand the runtime an element no markup wrote.
    if (this.tag !== '#root' && this.matches(selector)) return this
    return this.parentNode?.closest(selector) ?? null
  }

  querySelectorAll(selector: string): Element[] {
    const found: Element[] = []
    const visit = (node: Element): void => {
      for (const child of node.children) {
        if (child.matches(selector)) found.push(child)
        visit(child)
      }
    }
    visit(this)
    return found
  }

  querySelector(selector: string): Element | null {
    return this.querySelectorAll(selector)[0] ?? null
  }

  /** Every element in the subtree, self included. */
  descendants(): Element[] {
    const all: Element[] = [this]
    for (const child of this.children) all.push(...child.descendants())
    return all
  }
}

function parseAttributes(raw: string): Map<string, string> {
  const attrs = new Map<string, string>()
  const pattern = /([:@\w-]+)(?:="([^"]*)")?/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(raw)) !== null) {
    attrs.set(match[1], match[2] === undefined ? match[1] : decodeEntities(match[2]))
  }
  return attrs
}

/**
 * Parse rendered markup into a tree.
 *
 * Deliberately narrow: it reads the output of *this* renderer, which emits
 * quoted attribute values and balanced tags. A stray close tag pops to the
 * nearest matching ancestor and is otherwise ignored, which is what a browser
 * does and keeps a malformed fragment from truncating the whole tree.
 */
export function parseHtml(markup: string): Element {
  const root = new Element('#root')
  const stack: Element[] = [root]
  const tagPattern = /<(\/?)([a-zA-Z][\w-]*)((?:[^>"]|"[^"]*")*)>/g
  let match: RegExpExecArray | null

  while ((match = tagPattern.exec(markup)) !== null) {
    const [, closing, tag, raw] = match
    if (closing) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i
          break
        }
      }
      continue
    }

    const element = new Element(tag, parseAttributes(raw))
    const parent = stack[stack.length - 1]
    parent.children.push(element)
    element.parentNode = parent
    if (!VOID_TAGS.has(tag) && !raw.trimEnd().endsWith('/')) stack.push(element)
  }

  return root
}

/** A synthetic event, with the one method the runtime calls on it. */
export interface FakeEvent {
  target: Element
  key?: string
  preventDefault(): void
}

/** The document, window and location a run of the runtime sees. */
export interface RuntimeHost {
  root: Element
  /** Dispatch to every handler registered for `type`; returns the event. */
  dispatch(
    type: string,
    event: Omit<FakeEvent, 'preventDefault'>,
  ): FakeEvent & { prevented: boolean }
  location: { hash: string }
}

/**
 * Execute an emitted runtime against parsed markup.
 *
 * The script runs in a fresh `vm` context whose globals are exactly `document`,
 * `window` and `location` plus the standard built-ins. That is the point: the
 * runtime is shipped into a browser page and may only reach for browser
 * globals, so a context holding nothing else turns any other reach — `process`,
 * `require`, a leaked test binding — into a `ReferenceError` here rather than a
 * failure in someone's browser.
 *
 * `document` and `window` share one handler table. The runtime registers
 * disjoint event types on them (`click`/`keydown` against the document,
 * `hashchange` against the window), so one table cannot merge two listeners that
 * a browser would keep apart, and {@link RuntimeHost.dispatch} takes a type
 * rather than a target for the same reason.
 */
export function runRuntime(script: string, markup: string): RuntimeHost {
  const root = parseHtml(markup)
  const handlers = new Map<string, Array<(event: unknown) => void>>()

  const addEventListener = (type: string, handler: (event: unknown) => void): void => {
    const list = handlers.get(type) ?? []
    list.push(handler)
    handlers.set(type, list)
  }

  const documentStub = {
    querySelector: (selector: string) => root.querySelector(selector),
    querySelectorAll: (selector: string) => root.querySelectorAll(selector),
    addEventListener,
  }
  const location = { hash: '' }

  runInNewContext(script, { document: documentStub, window: { addEventListener }, location })

  return {
    root,
    location,
    dispatch(type, event) {
      const dispatched: FakeEvent & { prevented: boolean } = {
        ...event,
        prevented: false,
        preventDefault() {
          dispatched.prevented = true
        },
      }
      for (const handler of handlers.get(type) ?? []) handler(dispatched)
      return dispatched
    },
  }
}
