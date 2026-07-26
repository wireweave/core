// Tag collection / grouping / filtering — pure functions (framework-agnostic, bottom of the graph).
// Tags use the "namespace:value" form (e.g. 'domain:auth'); a missing namespace maps to 'etc'.
//
// Single source of truth: web viewer / MCP / CLI share the same tag classification and filter rules,
// so this lives in core. Callers pass any node that carries tags: string[] (SsotNode etc.). The
// input is constrained to the minimal HasTags shape to preserve core's dependency direction (↓).
//
// The known-namespace display order derives from the generated TAG_NAMESPACES (schema x-tags), so
// there is no hand-maintained namespace list to keep in sync (scenario A1-SCHEMA).

import { TAG_NAMESPACES } from './generated/constants.js'

/** The minimal node shape tag filtering/grouping requires. */
export interface HasTags {
  id: string
  tags: readonly string[]
}

/** Known-namespace display order (others sort alphabetically after; 'etc' is always last). */
const NAMESPACE_ORDER: readonly string[] = TAG_NAMESPACES

/** Namespace → human-readable label. */
export const NAMESPACE_LABELS: Record<string, string> = {
  domain: '도메인',
  area: '영역',
  status: '상태',
  team: '팀',
  version: '버전',
  type: '유형',
  risk: '리스크',
  etc: '기타',
}

export interface ParsedTag {
  /** The original "namespace:value" string — the key used for filter selection. */
  raw: string
  namespace: string
  value: string
}

export interface TagNamespaceGroup {
  namespace: string
  /** Tags in this namespace (sorted by value). */
  tags: { value: string; raw: string; count: number }[]
}

/** Parse "namespace:value". No ':' → namespace='etc'. Split on the first ':' only. */
export function parseTag(raw: string): ParsedTag {
  const idx = raw.indexOf(':')
  if (idx <= 0) return { raw, namespace: 'etc', value: raw }
  return { raw, namespace: raw.slice(0, idx), value: raw.slice(idx + 1) }
}

function namespaceRank(ns: string): number {
  const i = NAMESPACE_ORDER.indexOf(ns)
  return i === -1 ? NAMESPACE_ORDER.length : i
}

/**
 * Collect tags across a node set and group them by namespace.
 * - Namespace order: known order (domain/area/status/…) → others alphabetically → 'etc' always last.
 * - Within a namespace, tags sort by value alphabetically, with a usage count.
 */
export function collectTagGroups(nodes: Iterable<HasTags>): TagNamespaceGroup[] {
  // namespace → (raw → {value, count})
  const byNamespace = new Map<string, Map<string, { value: string; count: number }>>()

  for (const node of nodes) {
    for (const raw of node.tags ?? []) {
      const { namespace, value } = parseTag(raw)
      let tagMap = byNamespace.get(namespace)
      if (!tagMap) {
        tagMap = new Map()
        byNamespace.set(namespace, tagMap)
      }
      const entry = tagMap.get(raw)
      if (entry) entry.count += 1
      else tagMap.set(raw, { value, count: 1 })
    }
  }

  const groups: TagNamespaceGroup[] = []
  for (const [namespace, tagMap] of byNamespace) {
    const tags = [...tagMap.entries()]
      .map(([raw, { value, count }]) => ({ raw, value, count }))
      .sort((a, b) => a.value.localeCompare(b.value))
    groups.push({ namespace, tags })
  }

  groups.sort((a, b) => {
    // 'etc' is always last.
    if (a.namespace === 'etc') return 1
    if (b.namespace === 'etc') return -1
    const ra = namespaceRank(a.namespace)
    const rb = namespaceRank(b.namespace)
    return ra - rb || a.namespace.localeCompare(b.namespace)
  })
  return groups
}

/**
 * Decide whether a node passes the selected tag set.
 * - Multiple selections in the same namespace → OR (pass if it has any).
 * - Across different namespaces → AND (must satisfy each selected namespace).
 * - No selection → everything passes.
 */
export function nodeMatchesTags(node: HasTags, selected: ReadonlySet<string>): boolean {
  if (selected.size === 0) return true

  // Group the selected tags by namespace.
  const selectedByNs = new Map<string, Set<string>>()
  for (const raw of selected) {
    const { namespace } = parseTag(raw)
    let set = selectedByNs.get(namespace)
    if (!set) {
      set = new Set()
      selectedByNs.set(namespace, set)
    }
    set.add(raw)
  }

  const nodeTags = new Set(node.tags ?? [])
  // Across namespaces AND: every selected namespace must have (its inner OR) satisfied.
  for (const [, rawSet] of selectedByNs) {
    let hit = false
    for (const raw of rawSet) {
      if (nodeTags.has(raw)) {
        hit = true
        break
      }
    }
    if (!hit) return false
  }
  return true
}

/** Node ids passing the selected tag filter. Returns null when selected is empty (filter off). */
export function filterNodeIds(
  nodes: Iterable<HasTags>,
  selected: ReadonlySet<string>,
): Set<string> | null {
  if (selected.size === 0) return null
  const ids = new Set<string>()
  for (const node of nodes) {
    if (nodeMatchesTags(node, selected)) ids.add(node.id)
  }
  return ids
}
