// Build `_catalog.json` from an SSOT directory — the fs port of ssot-studio's build-graph.mjs.
//
// Parsing is delegated to @wireweave/ssot-core (`splitFrontmatter` + `parseMarkdownBody`); this
// module only walks files and assembles the *raw* catalog shape that ssot-core's `normalize`
// consumes. It intentionally does NOT do graph-level work (edge-rel splitting, dangling detection,
// facet mapping) — that is `normalize`'s job, so there is exactly one home for it.

import {
  EDGE_RELS,
  parseMarkdownBody,
  splitFrontmatter,
  type RawCatalog,
  type RawCatalogEdge,
  type RawCatalogNode,
  type RawCatalogPath,
} from '@wireweave/ssot-core'
import { listNodeFiles, readNodeFile, relNodePath } from './fs-store.js'
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'

/** id-reference (scalar list) fields — every edge relation except the object-list `relatesTo`. */
const ID_LIST_FIELDS = EDGE_RELS.filter((r) => r !== 'relatesTo')
/** object-list fields whose items are `{ to, type, note? }`. */
const OBJ_LIST_FIELDS = ['relatesTo'] as const
/** provenance path-list fields (code links). */
const PATH_LIST_FIELDS = ['implementedIn'] as const

/**
 * A catalog node. Superset of ssot-core's `RawCatalogNode`: it keeps the extra `sections` /
 * `introducedIn` / `targetVersion` fields the original `_catalog.json` carried, so the written
 * file format is byte-compatible with build-graph.mjs while still normalizing cleanly.
 */
export interface CatalogNode extends RawCatalogNode {
  confidence: string
  owner: string
  lifecycle: string
  lastVerified: string
  tags: string[]
  introducedIn: string
  targetVersion: string
  openCount: number
  sections: string[]
  facets: Record<string, unknown>
}

export interface CatalogParseError {
  file: string
  reason: string
}

/** The `_catalog.json` shape — a `RawCatalog` with the node superset above. */
export interface Catalog extends RawCatalog {
  nodes: CatalogNode[]
  edges: RawCatalogEdge[]
  paths: RawCatalogPath[]
  parseErrors: CatalogParseError[]
}

function asStr(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

/**
 * Parse every node file under `ssotDir` into a raw catalog (nodes, edges, code-link paths,
 * frontmatter parse errors). Frontmatter/body parsing come from ssot-core; edge/path emission
 * is a straight projection of the schema's id-reference fields.
 */
export function buildCatalog(ssotDir: string): Catalog {
  const nodes: CatalogNode[] = []
  const edges: RawCatalogEdge[] = []
  const paths: RawCatalogPath[] = []
  const parseErrors: CatalogParseError[] = []

  for (const file of listNodeFiles(ssotDir)) {
    const rel = relNodePath(ssotDir, file)
    const content = readNodeFile(file)
    const { frontmatter: fm, body, hasFrontmatter } = splitFrontmatter(content)
    if (!hasFrontmatter) {
      parseErrors.push({ file: rel, reason: 'frontmatter 없음/형식 오류' })
      continue
    }

    const { sections: parsedSections, openItems } = parseMarkdownBody(body)
    const openCount = openItems.filter((o) => !o.checked && o.text.startsWith('OPEN:')).length
    const sections = parsedSections.filter((s) => s.level === 2).map((s) => s.heading)
    const id = asStr(fm.id)

    nodes.push({
      id,
      kind: asStr(fm.kind),
      title: asStr(fm.title),
      file: rel,
      confidence: asStr(fm.confidence),
      owner: asStr(fm.owner),
      lifecycle: asStr(fm.lifecycle),
      lastVerified: asStr(fm.lastVerified),
      tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
      introducedIn: asStr(fm.introducedIn),
      targetVersion: asStr(fm.targetVersion),
      openCount,
      sections,
      facets: fm,
    })

    for (const f of ID_LIST_FIELDS) {
      const v = fm[f]
      if (Array.isArray(v)) {
        for (const to of v) if (to) edges.push({ from: id, to: String(to), rel: f })
      }
    }
    for (const f of OBJ_LIST_FIELDS) {
      const v = fm[f]
      if (Array.isArray(v)) {
        for (const o of v) {
          if (o && typeof o === 'object' && 'to' in o && (o as { to?: unknown }).to) {
            const typeVal = (o as { type?: unknown }).type
            const rel = `${f}:${typeof typeVal === 'string' && typeVal ? typeVal : '?'}`
            edges.push({ from: id, to: String((o as { to: unknown }).to), rel })
          }
        }
      }
    }
    for (const f of PATH_LIST_FIELDS) {
      const v = fm[f]
      if (Array.isArray(v)) {
        for (const p of v) if (p) paths.push({ from: id, field: f, raw: String(p) })
      }
    }
  }

  return {
    generatedFrom: ssotDir,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges,
    paths,
    parseErrors,
  }
}

/** Write `_catalog.json` under `ssotDir` in the original 2-space-indent + trailing-newline format. */
export function writeCatalog(ssotDir: string, catalog: Catalog): string {
  const outPath = join(ssotDir, '_catalog.json')
  writeFileSync(outPath, JSON.stringify(catalog, null, 2) + '\n')
  return outPath
}
