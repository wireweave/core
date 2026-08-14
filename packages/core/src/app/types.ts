import type {
  ComponentDefinitionNode,
  LayoutDefinitionNode,
  PageNode,
  SourceLocation,
} from '../ast'

/** A source file and exact span within it. */
export interface AppSourceSpan {
  sourceId: string
  location: SourceLocation
}

/** The two reusable definition kinds addressable by an app reference. */
export type AppDefinitionKind = 'layout' | 'component'

/** Every stable, top-level node kind in a linked application. */
export type AppNodeKind = AppDefinitionKind | 'screen'

/** A manifest entry assigning one module its stable application namespace. */
export interface AppManifestModule {
  id: string
  namespace: string
  location: SourceLocation
}

/**
 * Core-owned manifest describing the modules that make up one application.
 * @public
 */
export interface AppManifest {
  id: string
  sourceId: string
  modules: readonly AppManifestModule[]
}

/** A reference to a layout or component, local to the owner namespace by default. */
export interface AppReferenceInput {
  kind: AppDefinitionKind
  id: string
  namespace?: string
  source: AppSourceSpan
}

interface AppNodeInput<TNode> {
  /** Stable identifier within the module namespace and node kind. */
  id: string
  node: TNode
  source: AppSourceSpan
}

/** A layout declaration and the reusable definitions it depends on. */
export interface AppLayoutInput extends AppNodeInput<LayoutDefinitionNode> {
  references?: readonly AppReferenceInput[]
}

/** A component declaration and the reusable definitions it depends on. */
export interface AppComponentInput extends AppNodeInput<ComponentDefinitionNode> {
  references?: readonly AppReferenceInput[]
}

/** A screen declaration and the layouts/components it consumes. */
export interface AppScreenInput extends AppNodeInput<PageNode> {
  references?: readonly AppReferenceInput[]
}

/**
 * One parsed Wireweave module supplied to the Core linker.
 * @public
 */
export interface AppModuleInput {
  id: string
  source: AppSourceSpan
  layouts: readonly AppLayoutInput[]
  components: readonly AppComponentInput[]
  screens: readonly AppScreenInput[]
}

/** Opaque stable identity assigned by the linker. */
export type AppNodeId = string & { readonly __appNodeId: unique symbol }

/** Stable identity of one expanded component invocation. */
export type AppComponentInstanceId = string & {
  readonly __appComponentInstanceId: unique symbol
}

/** A reference whose target has been resolved to stable app identity. */
export interface ResolvedAppReference {
  kind: AppDefinitionKind
  id: string
  namespace: string
  targetId: AppNodeId
  source: AppSourceSpan
}

interface ResolvedAppNode<TKind extends AppNodeKind, TNode> {
  nodeId: AppNodeId
  kind: TKind
  id: string
  moduleId: string
  namespace: string
  node: TNode
  source: AppSourceSpan
  references: readonly ResolvedAppReference[]
}

export type ResolvedAppLayout = ResolvedAppNode<'layout', LayoutDefinitionNode>
export type ResolvedAppComponent = ResolvedAppNode<'component', ComponentDefinitionNode>
export type ResolvedAppScreen = ResolvedAppNode<'screen', PageNode>

/** Stable node-to-source mapping emitted in manifest order. */
export interface AppSourceMapEntry {
  nodeId: AppNodeId
  source: AppSourceSpan
}

/** One resolved module in a linked application document. */
export interface ResolvedAppModule {
  id: string
  namespace: string
  layouts: readonly ResolvedAppLayout[]
  components: readonly ResolvedAppComponent[]
  screens: readonly ResolvedAppScreen[]
}

/**
 * Core's dependency-closed representation of a multi-module application.
 * @public
 */
export interface AppDocument {
  type: 'AppDocument'
  id: string
  modules: readonly ResolvedAppModule[]
  layouts: readonly ResolvedAppLayout[]
  components: readonly ResolvedAppComponent[]
  screens: readonly ResolvedAppScreen[]
  sourceMap: readonly AppSourceMapEntry[]
}

/** Stable machine-readable linker diagnostic kinds. */
export type AppLinkDiagnosticCode =
  | 'missing-module'
  | 'duplicate-module'
  | 'duplicate-namespace'
  | 'duplicate-definition'
  | 'duplicate-screen'
  | 'missing-reference'
  | 'cyclic-reference'
  | 'invalid-component-definition'
  | 'invalid-component-invocation'

/**
 * A deterministic linker failure with the exact source span that caused it.
 * @public
 */
export interface AppLinkDiagnostic {
  code: AppLinkDiagnosticCode
  message: string
  source: AppSourceSpan
}

export type AppLinkResult =
  | { ok: true; document: AppDocument; diagnostics: readonly [] }
  | { ok: false; document: null; diagnostics: readonly AppLinkDiagnostic[] }
