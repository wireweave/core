/**
 * `renderSite` — a whole wireframe document as one navigable HTML file.
 *
 * The other renderers answer "what does this screen look like". This one
 * answers "what does this product look like": every page of a document, the
 * shells they share, and the moves between them, in a single file with no
 * server, no build step and no dependencies. Open it and click.
 *
 * ## What makes it one document rather than N concatenated
 *
 * Three things exist once, however many screens there are:
 *
 * - **the stylesheet** — component styles are generated per document, not per
 *   page, so N screens cost one copy instead of N;
 * - **the runtime** — one inline script drives every screen;
 * - **each layout** — a `layout` referenced by `uses=` is emitted once, and
 *   every page using it is hosted inside that one copy at the `slot` position.
 *
 * The third is the one that has to be structural. Emitting a copy of the shell
 * per screen and hiding all but one with CSS produces the same picture while
 * keeping every byte the shared shell exists to remove; the shell is therefore
 * shared in the DOM, and only screens are switched.
 *
 * ## Ids under composition
 *
 * An authored `id` is unique inside the page that declares it. Once several
 * pages share a document that guarantee is gone, so every screen and every
 * shell renders under an id scope of its own and the runtime composes the scope
 * with the authored name when it looks an overlay up. Two screens can both
 * declare `confirm` and each opens its own.
 *
 * ## What is left alone
 *
 * A page with no `uses=` renders exactly as `renderPage` renders it, frame and
 * all, as its own screen. That is the whole corpus today, so composition is
 * something a document opts into and nothing changes shape without being asked.
 *
 * `render` / `renderToHtml` / `renderCanvas` / `renderToSvg` are untouched:
 * `renderSite` is a fifth entry point beside them, not a mode of them.
 */

import type { PageNode, WireframeDocument } from '../../ast/types'
import { expandRepeats } from '../../ast/expand-repeats'
import { collectInteractions } from '../../interaction/model'
import { HtmlRenderer } from '../html'
import { generateStyles } from '../styles'
import { resolvePageDimensions } from '../page-renderer'
import { defaultTheme, darkTheme } from '../types'
import type { RenderOptions } from '../types'
import { buildSiteModel } from './model'
import type { SiteModel, SiteScreen, SiteShell } from './model'
import { generateSiteStyles } from './styles'
import { ID_SCOPE_ATTR, siteRuntime } from './runtime'
import type { SiteRuntimeRegistry } from './runtime'

export type { SiteModel, SiteScreen, SiteShell, ShellMiss } from './model'
export { buildSiteModel } from './model'

/**
 * Options for {@link renderSite}.
 *
 * A subset of {@link RenderOptions}: `includeStyles` is meaningless for a
 * standalone document that has nowhere else to get its styles from, and
 * `sourceAnchors` is omitted because an anchor path names a node's position
 * under one page — a shell belongs to every page that uses it and has no single
 * such position, so the scheme has nothing true to say about it.
 */
export interface SiteOptions extends Pick<
  RenderOptions,
  'theme' | 'classPrefix' | 'background' | 'annotationStyle'
> {
  /** `<title>` of the produced document. Defaults to the entry page's title. */
  title?: string
  /**
   * The screen shown when the URL carries no fragment.
   *
   * Named the way everything else names a screen — an `id` or a `title`, put
   * through {@link SiteModel.names}, so a caller writes the same string here
   * that it would write in a `navigate=` and lands on the same page. Taking an
   * index instead would make the option depend on document order, which is the
   * one thing a caller holding a screen name does not know.
   *
   * Defaults to the first page in document order. A name that addresses no
   * screen leaves that default in place and is marked on the site container as
   * `data-wf-entry-unresolved`, the way an unmet `uses=` is marked on its
   * screen: the request stays visible in the artefact instead of disappearing
   * between the call and the HTML.
   */
  entry?: string
}

const DEFAULT_PREFIX = 'wf'

/**
 * A renderer for one id scope.
 *
 * `renderSite` builds one per screen and one per shell rather than sharing a
 * single renderer, because the scope is the one render option that differs
 * between the parts of the document.
 */
type MakeRenderer = (idScope: string) => HtmlRenderer

/**
 * The id scope of a screen, and of a shell.
 *
 * An authored `id` is unique inside the thing that declares it. Composition
 * puts several such things in one document, so each gets a namespace of its
 * own, keyed by position — the same key the runtime and the model already
 * agree on for screens, and array order for shells.
 *
 * Scoping is unconditional under `renderSite`, not applied only when a
 * collision is detected. Conditional scoping would mean one page's ids change
 * the moment an unrelated page is added to the document, which makes an id
 * emitted here unusable as a stable handle for anything outside it.
 */
const screenScope = (index: number): string => `s${index}-`
const shellScope = (index: number): string => `l${index}-`

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** `key="value"` for every defined entry, in the order given. */
function attrs(pairs: Array<[string, string | undefined]>): string {
  return pairs
    .filter((pair): pair is [string, string] => pair[1] !== undefined)
    .map(([name, value]) => ` ${name}="${escapeAttr(value)}"`)
    .join('')
}

/**
 * The screen host for a page composed into a shell.
 *
 * Only the page's content goes in: the frame is the shell's, and a page that
 * opted into a layout asked for exactly that. A viewport it resolves at a
 * different size than the shell is a conflict between two authored intentions,
 * so it is marked rather than resolved — a renderer picking a winner there
 * would be picking which of two authors to ignore.
 */
function renderHostedScreen(
  screen: SiteScreen,
  shell: SiteShell,
  make: MakeRenderer,
  prefix: string,
): string {
  const { width, height } = resolvePageDimensions(screen.page)
  const conflict =
    width !== shell.width || height !== shell.height ? `${width}x${height}` : undefined

  const scope = screenScope(screen.index)
  const marks = attrs([
    ['data-screen', String(screen.index)],
    ['data-screen-name', screen.name],
    [ID_SCOPE_ATTR, scope],
    ['data-wf-viewport-conflict', conflict],
  ])

  const content = make(scope).renderFragment(screen.page.children)
  return `<div class="${prefix}-screen"${marks}>\n${content}\n</div>`
}

/**
 * The screen host for a page that is not composed into a shell.
 *
 * The page keeps its own frame, so this is `renderPage`'s output wrapped in the
 * host the runtime switches. An unmet `uses=` is recorded on the host: the page
 * still renders in full, and the request that could not be honoured stays
 * visible in the artefact instead of disappearing between AST and HTML.
 */
function renderStandaloneScreen(screen: SiteScreen, make: MakeRenderer, prefix: string): string {
  const scope = screenScope(screen.index)
  const marks = attrs([
    ['data-screen', String(screen.index)],
    ['data-screen-name', screen.name],
    [ID_SCOPE_ATTR, scope],
    ['data-wf-uses-unresolved', screen.miss?.uses],
    ['data-wf-uses-reason', screen.miss?.reason],
  ])

  const page = make(scope).render({ type: 'Document', children: [screen.page] }).html
  return `<div class="${prefix}-screen"${marks}>\n${page}\n</div>`
}

/**
 * One layout, emitted once, with every screen that uses it inside its slot.
 *
 * The shell carries the page frame — the viewport box and the `.<prefix>-page`
 * class the component CSS reset hangs off — because for the pages in this group
 * the layout *is* the page's outer shape.
 */
function renderShell(shell: SiteShell, index: number, make: MakeRenderer, prefix: string): string {
  const hosted = shell.screens
    .map((screen) => renderHostedScreen(screen, shell, make, prefix))
    .join('\n')

  const scope = shellScope(index)
  const style = `position: relative; width: ${shell.width}px; height: ${shell.height}px; overflow: hidden`
  const marks = attrs([
    ['data-layout', shell.name],
    [ID_SCOPE_ATTR, scope],
    ['data-viewport-width', String(shell.width)],
    ['data-viewport-height', String(shell.height)],
  ])

  const body = make(scope).renderFragment(shell.layout.children, hosted)
  return `<div class="${prefix}-page ${prefix}-shell" style="${style}"${marks}>\n${body}\n</div>`
}

/**
 * The entry screen index, and the requested name when it addressed no screen.
 *
 * `buildSiteModel` answers "what does this document say" and stays a pure
 * function of the document; which screen a *caller* wants opened is not in the
 * document, so it is resolved here rather than pushed into the model.
 */
function resolveEntry(
  model: SiteModel,
  options: SiteOptions,
): { index: number; unresolved?: string } {
  const fallback = Math.max(model.entry, 0)
  const requested = options.entry?.trim()
  if (requested === undefined || requested.length === 0) return { index: fallback }

  const index = model.names.get(requested)
  if (index === undefined) return { index: fallback, unresolved: requested }
  return { index }
}

/** Document title: explicit option, else the entry page's title. */
function resolveTitle(model: SiteModel, options: SiteOptions, entry: number): string {
  if (options.title !== undefined) return options.title
  const page: PageNode | undefined = model.screens[entry]?.page
  const title = page?.title?.trim()
  return title !== undefined && title.length > 0 ? title : 'Wireframe'
}

/**
 * The site runtime only needs to know which normalized handlers are reachable
 * from a screen or a shared shell. Keeping the expanded interaction model here
 * would repeat every layout handler for every page that uses that layout,
 * despite the handler and its DOM node both being shared. Intern handlers once
 * and publish compact ownership references instead.
 */
function compactRuntimeInteractions(
  model: SiteModel,
  interactions: ReturnType<typeof collectInteractions>['interactions'],
): Pick<SiteRuntimeRegistry, 'handlers' | 'screenHandlers' | 'shellHandlers'> {
  const handlers: SiteRuntimeRegistry['handlers'] = []
  const handlerIds = new Map<string, number>()
  const screenHandlers: Record<string, number[]> = {}
  const shellHandlers: Record<string, number[]> = {}

  const intern = (signature: string, handler: (typeof interactions)[number]['handler']): number => {
    const existing = handlerIds.get(signature)
    if (existing !== undefined) return existing
    const id = handlers.length
    handlerIds.set(signature, id)
    handlers.push(handler)
    return id
  }

  const add = (owner: Record<string, number[]>, key: string, id: number): void => {
    const ids = owner[key] ?? (owner[key] = [])
    if (!ids.includes(id)) ids.push(id)
  }

  for (const interaction of interactions) {
    const id = intern(interaction.signature, interaction.handler)
    if (interaction.source === 'screen') {
      add(screenHandlers, String(interaction.screenIndex), id)
      continue
    }

    const shell = model.screens[interaction.screenIndex]?.shell
    if (shell !== undefined) add(shellHandlers, shell, id)
  }

  return { handlers, screenHandlers, shellHandlers }
}

/**
 * Render a whole document as one navigable, self-contained HTML file.
 *
 * @param document - Parsed wireframe document
 * @param options - Site render options
 * @returns A complete HTML document, ready to write to disk and open
 */
export function renderSite(document: WireframeDocument, options: SiteOptions = {}): string {
  const prefix = options.classPrefix ?? DEFAULT_PREFIX
  // Site composition renders through `renderFragment`, which bypasses
  // `HtmlRenderer.render` and its expansion — so fold `repeat` here, once, and
  // let the screen model and the interaction model see the same expanded tree.
  document = expandRepeats(document)
  const model = buildSiteModel(document)
  const interactionModel = collectInteractions(document)
  const make: MakeRenderer = (idScope) =>
    new HtmlRenderer({
      theme: options.theme,
      classPrefix: prefix,
      background: options.background,
      annotationStyle: options.annotationStyle,
      includeStyles: false,
      idScope,
    })

  const shells = model.shells
    .map((shell, index) => renderShell(shell, index, make, prefix))
    .join('\n')
  const standalone = model.screens
    .filter((screen) => screen.shell === undefined)
    .map((screen) => renderStandaloneScreen(screen, make, prefix))
    .join('\n')

  const theme = options.theme === 'dark' ? darkTheme : defaultTheme
  const css = generateStyles(theme, prefix, options.annotationStyle) + generateSiteStyles(prefix)

  const entry = resolveEntry(model, options)
  const fragments = model.screens.map((screen) => screen.name ?? String(screen.index))
  const runtimeInteractions = compactRuntimeInteractions(model, interactionModel.interactions)
  const runtime = siteRuntime(
    {
      names: Object.fromEntries(model.names),
      fragments,
      entry: entry.index,
      states: interactionModel.states,
      ...runtimeInteractions,
      diagnostics: interactionModel.diagnostics,
    },
    prefix,
  )

  const body = [shells, standalone].filter((part) => part.length > 0).join('\n')
  const siteAttrs = attrs([
    ['data-screen-count', String(model.screens.length)],
    ['data-shell-count', String(model.shells.length)],
    ['data-wf-entry-unresolved', entry.unresolved],
    ['data-wf-diagnostic-count', String(interactionModel.diagnostics.length)],
  ])

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeText(resolveTitle(model, options, entry.index))}</title>
<style>
html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: #f4f4f5;
}
body {
  padding: 24px;
  box-sizing: border-box;
}
${css}
</style>
</head>
<body>
<div class="${prefix}-site"${siteAttrs}>
${body}
</div>
<script>
${runtime}
</script>
</body>
</html>`
}
