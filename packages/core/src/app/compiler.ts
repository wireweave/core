import type { LayoutDefinitionNode, PageNode, WireframeDocument } from '../ast'
import { renderSite } from '../renderer/site'
import type { SiteOptions } from '../renderer/site'
import { linkApp } from './linker'
import type {
  AppDocument,
  AppLinkDiagnostic,
  AppManifest,
  AppModuleInput,
  ResolvedAppLayout,
  ResolvedAppScreen,
} from './types'

/**
 * Options for {@link compileApp}.
 *
 * Application artifacts always use neutral annotation styling. The option is
 * intentionally omitted here so every compiler caller gets the same wireframe
 * presentation while legacy render entry points keep their historical default.
 *
 * @public
 */
export type CompileAppOptions = Omit<SiteOptions, 'annotationStyle'>

/** Result of linking modules and compiling the resulting application. @public */
export type AppCompileResult =
  | {
      ok: true
      document: AppDocument
      html: string
      diagnostics: readonly []
    }
  | {
      ok: false
      document: null
      html: null
      diagnostics: readonly AppLinkDiagnostic[]
    }

function layoutName(layout: ResolvedAppLayout): string {
  return layout.nodeId
}

function projectLayout(layout: ResolvedAppLayout): LayoutDefinitionNode {
  return { ...layout.node, name: layoutName(layout) }
}

function projectScreen(screen: ResolvedAppScreen): PageNode {
  const uses = screen.node.uses?.trim()
  if (uses === undefined || uses.length === 0) return { ...screen.node }

  const target = screen.references.find(
    (reference) => reference.kind === 'layout' && reference.id === uses,
  )
  return {
    ...screen.node,
    uses: target === undefined ? screen.node.uses : target.targetId,
  }
}

/**
 * Compile one linked application into a deterministic, self-contained HTML document.
 *
 * The linker has already expanded component invocations and resolved shared
 * layouts. This function only projects those resolved nodes into the generic
 * site compositor, using stable app identities for layout names so modules
 * cannot collide.
 *
 * @public
 * @example
 * `const html = compileApp(linked.document)`
 */
export function compileApp(document: AppDocument, options: CompileAppOptions = {}): string {
  const projected: WireframeDocument = {
    type: 'Document',
    children: [...document.layouts.map(projectLayout), ...document.screens.map(projectScreen)],
  }
  return renderSite(projected, { ...options, annotationStyle: 'neutral' })
}

/**
 * Link application modules and compile them when linking succeeds.
 *
 * Linker diagnostics remain explicit and no partial HTML is emitted on failure.
 *
 * @public
 * @example
 * `const result = linkAndCompileApp(manifest, modules)`
 */
export function linkAndCompileApp(
  manifest: AppManifest,
  modules: readonly AppModuleInput[],
  options: CompileAppOptions = {},
): AppCompileResult {
  const linked = linkApp(manifest, modules)
  if (!linked.ok) return { ...linked, html: null }
  return { ...linked, html: compileApp(linked.document, options) }
}
