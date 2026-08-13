import type { WireframeDocument } from '../../ast/types'
import { HtmlRenderer } from '../html'
import { generateStyles } from '../styles'
import { resolvePageDimensions } from '../page-renderer'
import { defaultTheme, darkTheme } from '../types'
import type { RenderOptions } from '../types'
import { buildSiteModel } from './model'
import type { SiteModel, SiteScreen, SiteShell } from './model'
import { generateSiteStyles } from './styles'
import { ID_SCOPE_ATTR, siteRuntime } from './runtime'

export type { SiteModel, SiteScreen, SiteShell, ShellMiss } from './model'
export { buildSiteModel } from './model'

export interface SiteOptions extends Pick<RenderOptions, 'theme' | 'classPrefix' | 'background'> {
  title?: string
  entry?: string
}

const DEFAULT_PREFIX = 'wf'

type MakeRenderer = (idScope: string) => HtmlRenderer

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

function attrs(pairs: Array<[string, string | undefined]>): string {
  return pairs
    .filter((pair): pair is [string, string] => pair[1] !== undefined)
    .map(([name, value]) => ` ${name}="${escapeAttr(value)}"`)
    .join('')
}

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

function resolveEntry(
  model: SiteModel,
  options: SiteOptions,
): { index: number; unresolved?: string } {
  const fallback = Math.max(model.entry, 0)
  const requested = options.entry?.trim()
  if (!requested) return { index: fallback }
  const index = model.names.get(requested)
  return index === undefined ? { index: fallback, unresolved: requested } : { index }
}

function resolveTitle(model: SiteModel, options: SiteOptions, entry: number): string {
  if (options.title !== undefined) return options.title
  const title = model.screens[entry]?.page.title?.trim()
  return title || 'Wireframe'
}

/** Render pages and their optional named layouts as one self-contained site. */
export function renderSite(document: WireframeDocument, options: SiteOptions = {}): string {
  const prefix = options.classPrefix ?? DEFAULT_PREFIX
  const model = buildSiteModel(document)
  const make: MakeRenderer = (idScope) =>
    new HtmlRenderer({
      theme: options.theme,
      classPrefix: prefix,
      background: options.background,
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

  const entry = resolveEntry(model, options)
  const theme = options.theme === 'dark' ? darkTheme : defaultTheme
  const css = generateStyles(theme, prefix) + generateSiteStyles(prefix)
  const runtime = siteRuntime(
    {
      names: Object.fromEntries(model.names),
      fragments: model.screens.map((screen) => screen.name ?? String(screen.index)),
      entry: entry.index,
    },
    prefix,
  )
  const body = [shells, standalone].filter((part) => part.length > 0).join('\n')
  const siteAttrs = attrs([
    ['data-screen-count', String(model.screens.length)],
    ['data-shell-count', String(model.shells.length)],
    ['data-wf-entry-unresolved', entry.unresolved],
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
