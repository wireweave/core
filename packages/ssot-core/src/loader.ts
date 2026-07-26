// Two-stage lazy load interface.
// The catalog is the index (graph skeleton); node body .md files are the authoritative data.
//
// This package is zero-dependency and runs in both Node and the browser, so IO (file/fetch) is
// delegated to implementations. Core knows "what to read and how to normalize", not "how to read".

import { normalize } from './catalog.js'
import type { RawCatalog } from './catalog.js'
import { mergeBodyIntoNode, parseNodeBody } from './body.js'
import type { ParseError, SsotGraph, SsotNode, SsotNodeBody } from './types.js'

/** Catalog load + normalization. */
export interface SsotCatalogLoader {
  /** Fetch the raw _catalog.json object (fetch/fs is the implementation's job). */
  loadCatalog(): Promise<RawCatalog>
  /** RawCatalog → SsotGraph normalization. */
  normalize(raw: RawCatalog): SsotGraph
}

/** Node body (.md) loader. */
export interface SsotNodeBodyLoader {
  /** Fetch the markdown source for node.file (fetch/fs is the implementation's job). */
  fetchMarkdown(node: SsotNode): Promise<string>
}

/**
 * The default catalog loader — inject a fetchRaw callback and get the standard normalize.
 * (Node: fs.readFile→JSON.parse; browser: fetch→json, passed as fetchRaw.)
 */
export class DefaultCatalogLoader implements SsotCatalogLoader {
  constructor(private readonly fetchRaw: () => Promise<RawCatalog>) {}

  loadCatalog(): Promise<RawCatalog> {
    return this.fetchRaw()
  }

  normalize(raw: RawCatalog): SsotGraph {
    return normalize(raw)
  }
}

export interface LoadBodyResult {
  body: SsotNodeBody
  /** A new node with the frontmatter authority merge applied. */
  node: SsotNode
  errors: ParseError[]
}

/**
 * Load a node body, parse it, and merge the frontmatter (authority) into the node facets.
 * Returns the merged node and body — the caller updates its graph Map.
 */
export async function loadBody(
  loader: SsotNodeBodyLoader,
  node: SsotNode,
): Promise<LoadBodyResult> {
  const markdown = await loader.fetchMarkdown(node)
  const body = parseNodeBody(markdown)
  const errors: ParseError[] = []
  const merged = mergeBodyIntoNode(node, body, errors)
  return { body, node: merged, errors }
}

/**
 * Convenience: load a body and update the graph Map in place.
 * Sets the merged node into graph.nodes and accumulates any parseErrors.
 */
export async function hydrateNodeBody(
  graph: SsotGraph,
  loader: SsotNodeBodyLoader,
  nodeId: string,
): Promise<SsotNode | undefined> {
  const node = graph.nodes.get(nodeId)
  if (!node) return undefined
  const { node: merged, errors } = await loadBody(loader, node)
  graph.nodes.set(nodeId, merged)
  if (errors.length > 0) graph.parseErrors.push(...errors)
  return merged
}
