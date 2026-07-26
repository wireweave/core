// Node body (.md) parser + frontmatter (authority) → catalog facets (hint) merge.
//
// Layering: the body .md frontmatter is the SSOT (authority); the catalog is a cache/index.
// Catalog facets.relatesTo lose their object form to strings, so the body frontmatter is the only
// authoritative relation source. After loadBody we overwrite the node facets with the object form.

import {
  normalizeRelatesToValue,
  asStringArray,
  asString,
  asConfidence,
  asLifecycle,
  asLastVerified,
} from './facet-coerce.js'
import { splitFrontmatter } from './yaml.js'
import type {
  CodeBlock,
  MarkdownSection,
  OpenItem,
  ParseError,
  SsotNode,
  SsotNodeBody,
} from './types.js'

// ── body markdown parsing ────────────────────────────────────────

const HEADING_RE = /^(#{1,6})\s+(.*)$/
const FENCE_RE = /^```(.*)$/
// '- [ ] OPEN: ...' / '- [x] ...' checkbox
const CHECK_RE = /^\s*-\s*\[([ xX])\]\s*(.*)$/

interface ParsedMarkdown {
  sections: MarkdownSection[]
  openItems: OpenItem[]
}

/**
 * Split body markdown into heading-scoped sections, extracting code blocks and OPEN checkboxes.
 * A '#' inside a code block is not mistaken for a heading.
 */
export function parseMarkdownBody(markdown: string): ParsedMarkdown {
  const lines = markdown.split('\n')
  const sections: MarkdownSection[] = []
  const openItems: OpenItem[] = []

  // The preamble before the first heading is also a section (level 0).
  let current: MarkdownSection = { heading: '', level: 0, content: '', codeBlocks: [] }
  const contentLines: string[] = []
  let inFence = false
  let fenceLang: string | undefined
  let fenceText: string[] = []

  const flushContent = (): void => {
    current.content = contentLines.join('\n').trim()
    if (current.heading !== '' || current.content !== '' || current.codeBlocks.length > 0) {
      sections.push(current)
    }
    contentLines.length = 0
  }

  for (const line of lines) {
    const fence = line.match(FENCE_RE)
    if (fence) {
      if (!inFence) {
        inFence = true
        const lang = (fence[1] ?? '').trim()
        fenceLang = lang === '' ? undefined : lang
        fenceText = []
      } else {
        inFence = false
        const block: CodeBlock = { text: fenceText.join('\n') }
        if (fenceLang) block.lang = fenceLang
        current.codeBlocks.push(block)
        contentLines.push(line) // keep the fence line in content (verbatim reproduction)
      }
      if (inFence) contentLines.push(line)
      continue
    }
    if (inFence) {
      fenceText.push(line)
      contentLines.push(line)
      continue
    }

    const check = line.match(CHECK_RE)
    if (check) {
      const mark = (check[1] ?? '').toLowerCase()
      openItems.push({ checked: mark === 'x', text: (check[2] ?? '').trim() })
    }

    const heading = line.match(HEADING_RE)
    if (heading) {
      flushContent()
      current = {
        heading: (heading[2] ?? '').trim(),
        level: (heading[1] ?? '').length,
        content: '',
        codeBlocks: [],
      }
      continue
    }
    contentLines.push(line)
  }
  flushContent()

  return { sections, openItems }
}

/** Full markdown document → SsotNodeBody. */
export function parseNodeBody(doc: string): SsotNodeBody {
  const { frontmatter, body } = splitFrontmatter(doc)
  const { sections, openItems } = parseMarkdownBody(body)
  return { frontmatter, markdown: body, sections, openItems }
}

// ── frontmatter (authority) → node facet merge ───────────────────

/**
 * Overwrite node facets with the body frontmatter (authority confirmation).
 * Only keys present in the frontmatter are overwritten — absent keys keep the catalog hint.
 * relatesTo always wins from the frontmatter object list (its canonical form).
 * Returns a merged copy (the input node is not mutated).
 */
export function mergeBodyIntoNode(
  node: SsotNode,
  body: SsotNodeBody,
  errors: ParseError[] = [],
): SsotNode {
  const fm = body.frontmatter
  const merged: SsotNode = {
    ...node,
    facets: {
      purpose: { ...node.facets.purpose },
      semantics: { ...node.facets.semantics },
      realization: { ...node.facets.realization },
      meta: { ...node.facets.meta },
    },
    body,
  }

  if ('purpose' in fm) {
    const v = asString(fm.purpose) ?? merged.facets.purpose.purpose
    if (v !== undefined) merged.facets.purpose.purpose = v
  }
  if ('value' in fm) {
    const v = asString(fm.value) ?? merged.facets.purpose.value
    if (v !== undefined) merged.facets.purpose.value = v
  }
  if ('servesPersona' in fm) merged.facets.purpose.servesPersona = asStringArray(fm.servesPersona)

  if ('definition' in fm) {
    const v = asString(fm.definition) ?? merged.facets.semantics.definition
    if (v !== undefined) merged.facets.semantics.definition = v
  }
  if ('relatesTo' in fm) {
    merged.facets.semantics.relatesTo = normalizeRelatesToValue(fm.relatesTo, node.id, errors)
  }
  if ('governedBy' in fm) merged.facets.semantics.governedBy = asStringArray(fm.governedBy)
  if ('governs' in fm) merged.facets.semantics.governs = asStringArray(fm.governs)

  if ('realizedBy' in fm) merged.facets.realization.realizedBy = asStringArray(fm.realizedBy)
  if ('dependsOn' in fm) merged.facets.realization.dependsOn = asStringArray(fm.dependsOn)
  if ('consumesApi' in fm) merged.facets.realization.consumesApi = asStringArray(fm.consumesApi)
  if ('providesApi' in fm) merged.facets.realization.providesApi = asStringArray(fm.providesApi)
  if ('impacts' in fm) merged.facets.realization.impacts = asStringArray(fm.impacts)
  if ('integratesWith' in fm) {
    merged.facets.realization.integratesWith = asStringArray(fm.integratesWith)
  }
  if ('implementedIn' in fm) {
    merged.facets.realization.implementedIn = asStringArray(fm.implementedIn).map((raw) => ({
      from: node.id,
      raw,
      field: 'implementedIn' as const,
    }))
  }

  if ('owner' in fm) merged.facets.meta.owner = asString(fm.owner) ?? merged.facets.meta.owner
  if ('decidedBy' in fm) merged.facets.meta.decidedBy = asStringArray(fm.decidedBy)
  if ('lifecycle' in fm) merged.facets.meta.lifecycle = asLifecycle(fm.lifecycle)
  if ('confidence' in fm) merged.facets.meta.confidence = asConfidence(fm.confidence)
  if ('lastVerified' in fm) merged.facets.meta.lastVerified = asLastVerified(fm.lastVerified)

  if ('tags' in fm) merged.tags = asStringArray(fm.tags)

  if ('authority' in fm) merged.authority = fm.authority === 'mirrored' ? 'mirrored' : 'authored'
  if ('source' in fm) {
    const src = asString(fm.source)
    if (src) merged.source = src
  }

  // openCount is recomputed from the body OPEN items (authority).
  merged.openCount = body.openItems.filter((o) => !o.checked).length

  return merged
}
