// A zero-dependency frontmatter YAML parser.
//
// SSOT frontmatter uses only a restricted subset of YAML, not the whole language:
//   - scalar:              key: value
//   - quoted scalar:       key: "value"  /  key: 'value'
//   - flow sequence:       key: [a, b, c]   (id lists)
//   - block sequence (scalar): key:\n  - a\n  - b
//   - block sequence (mapping): key:\n  - to: x\n    type: y\n    note: z   (relatesTo)
//   - empty value:         key:            → null
//   - boolean/number:      true|false|123  (anything else is a string)
//
// We avoid a general YAML library because this package is zero-dependency (bottom of the graph)
// and must run in both Node and the browser. Handling the subset above exactly is enough; inputs
// outside the subset fall back conservatively to a string scalar.

export type YamlValue =
  | string
  | number
  | boolean
  | null
  | YamlValue[]
  | { [key: string]: YamlValue }

interface Line {
  indent: number
  text: string // content with indent removed
  raw: string
}

function tokenize(src: string): Line[] {
  const out: Line[] = []
  for (const raw of src.split('\n')) {
    // Drop comment/blank lines. '#' starts a comment only at line start or after whitespace.
    const stripped = stripInlineComment(raw)
    if (stripped.trim() === '') continue
    const indent = stripped.length - stripped.trimStart().length
    out.push({ indent, text: stripped.trim(), raw })
  }
  return out
}

/** Strip everything after a '#' that sits outside quotes. */
function stripInlineComment(line: string): string {
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === "'" && !inDouble) inSingle = !inSingle
    else if (ch === '"' && !inSingle) inDouble = !inDouble
    else if (ch === '#' && !inSingle && !inDouble) {
      // A comment only when at line start or directly after whitespace.
      const prev = line[i - 1]
      if (i === 0 || prev === ' ' || prev === '\t') {
        return line.slice(0, i)
      }
    }
  }
  return line
}

function parseScalar(token: string): YamlValue {
  const t = token.trim()
  if (t === '' || t === '~' || t === 'null') return null
  if (t === 'true') return true
  if (t === 'false') return false
  if (
    (t.startsWith('"') && t.endsWith('"') && t.length >= 2) ||
    (t.startsWith("'") && t.endsWith("'") && t.length >= 2)
  ) {
    return t.slice(1, -1)
  }
  // Flow sequence [a, b, c]
  if (t.startsWith('[') && t.endsWith(']')) {
    const inner = t.slice(1, -1).trim()
    if (inner === '') return []
    return splitFlow(inner).map((p) => parseScalar(p))
  }
  // Flow mapping { to: x, type: y, note: z } — inline relatesTo notation.
  if (t.startsWith('{') && t.endsWith('}')) {
    const inner = t.slice(1, -1).trim()
    if (inner === '') return {}
    const obj: Record<string, YamlValue> = {}
    for (const pair of splitFlow(inner)) {
      const kv = splitKeyValue(pair)
      if (kv) obj[kv.key] = parseScalar(kv.rest)
    }
    return obj
  }
  // Number (int/float). Identifier-like values with a leading zero stay strings.
  if (/^-?\d+$/.test(t) && !/^0\d/.test(t)) return Number(t)
  if (/^-?\d+\.\d+$/.test(t)) return Number(t)
  return t
}

/** Split a flow sequence body on commas, respecting brace/bracket depth and quotes. */
function splitFlow(inner: string): string[] {
  const parts: string[] = []
  let depth = 0
  let inSingle = false
  let inDouble = false
  let cur = ''
  for (const ch of inner) {
    if (ch === "'" && !inDouble) inSingle = !inSingle
    else if (ch === '"' && !inSingle) inDouble = !inDouble
    if (!inSingle && !inDouble) {
      if (ch === '[' || ch === '{') depth++
      else if (ch === ']' || ch === '}') depth--
      else if (ch === ',' && depth === 0) {
        parts.push(cur.trim())
        cur = ''
        continue
      }
    }
    cur += ch
  }
  if (cur.trim() !== '') parts.push(cur.trim())
  return parts
}

/** Split `key: rest`. Handles only simple (unquoted, whitespace-free) keys. */
function splitKeyValue(text: string): { key: string; rest: string } | null {
  // The separator is the first ': ' outside quotes, or a ':' at end of line.
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === "'" && !inDouble) inSingle = !inSingle
    else if (ch === '"' && !inSingle) inDouble = !inDouble
    else if (ch === ':' && !inSingle && !inDouble) {
      const next = text[i + 1]
      if (next === undefined || next === ' ' || next === '\t') {
        return { key: text.slice(0, i).trim(), rest: text.slice(i + 1).trim() }
      }
    }
  }
  return null
}

/**
 * Parse a block mapping. Reads keys at indent baseIndent from lines[start..), stopping at the
 * next shallower line. Returns the index of the last consumed line.
 */
function parseBlockMapping(
  lines: Line[],
  start: number,
  baseIndent: number,
): { value: Record<string, YamlValue>; next: number } {
  const obj: Record<string, YamlValue> = {}
  let i = start
  while (i < lines.length) {
    const line = lines[i]
    if (!line) break
    if (line.indent < baseIndent) break
    if (line.indent > baseIndent) {
      // Deeper indent with no owning key — a formatting error. Skip it.
      i++
      continue
    }
    const kv = splitKeyValue(line.text)
    if (!kv) {
      i++
      continue
    }
    const { key, rest } = kv
    if (rest !== '') {
      obj[key] = parseScalar(rest)
      i++
      continue
    }
    // rest is empty → the following lines are a block sequence or a nested mapping.
    const nextLine = lines[i + 1]
    const childIndent = nextLine ? nextLine.indent : -1
    if (nextLine && childIndent > baseIndent && nextLine.text.startsWith('- ')) {
      const seq = parseBlockSequence(lines, i + 1, childIndent)
      obj[key] = seq.value
      i = seq.next
    } else if (nextLine && childIndent > baseIndent && nextLine.text === '-') {
      const seq = parseBlockSequence(lines, i + 1, childIndent)
      obj[key] = seq.value
      i = seq.next
    } else if (childIndent > baseIndent) {
      const nested = parseBlockMapping(lines, i + 1, childIndent)
      obj[key] = nested.value
      i = nested.next
    } else {
      obj[key] = null
      i++
    }
  }
  return { value: obj, next: i }
}

function parseBlockSequence(
  lines: Line[],
  start: number,
  seqIndent: number,
): { value: YamlValue[]; next: number } {
  const arr: YamlValue[] = []
  let i = start
  while (i < lines.length) {
    const line = lines[i]
    if (!line) break
    if (line.indent < seqIndent || !line.text.startsWith('-')) break
    const afterDash = line.text.slice(1).trim() // content after '-'
    // Flow notation ('- { ... }' / '- [ ... ]') is parsed whole as a scalar (not a mapping).
    const isFlow = afterDash.startsWith('{') || afterDash.startsWith('[')
    const kv = afterDash === '' || isFlow ? null : splitKeyValue(afterDash)
    if (isFlow) {
      arr.push(parseScalar(afterDash))
      i++
    } else if (kv) {
      // A mapping sequence item: '- to: x'. Subsequent keys are indented deeper.
      const item: Record<string, YamlValue> = {}
      item[kv.key] = kv.rest !== '' ? parseScalar(kv.rest) : null
      i++
      while (i < lines.length) {
        const l = lines[i]
        if (!l) break
        if (l.indent <= seqIndent) break
        if (l.text.startsWith('- ') && l.indent === seqIndent) break
        const sub = splitKeyValue(l.text)
        if (!sub) {
          i++
          continue
        }
        if (sub.rest !== '') {
          item[sub.key] = parseScalar(sub.rest)
          i++
        } else {
          const nl = lines[i + 1]
          const childIndent = nl ? nl.indent : -1
          if (childIndent > l.indent) {
            const nested = parseBlockMapping(lines, i + 1, childIndent)
            item[sub.key] = nested.value
            i = nested.next
          } else {
            item[sub.key] = null
            i++
          }
        }
      }
      arr.push(item)
    } else {
      // A scalar sequence item: '- value'
      arr.push(parseScalar(afterDash))
      i++
    }
  }
  return { value: arr, next: i }
}

/** Parse a YAML-subset document into an object. */
export function parseYaml(src: string): Record<string, unknown> {
  const lines = tokenize(src)
  const first = lines[0]
  if (!first) return {}
  const { value } = parseBlockMapping(lines, 0, first.indent)
  return value
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export interface FrontmatterSplit {
  frontmatter: Record<string, unknown>
  body: string
  /** Whether a frontmatter block was present. */
  hasFrontmatter: boolean
}

/** Split a markdown document into a frontmatter object and the body. */
export function splitFrontmatter(doc: string): FrontmatterSplit {
  const m = doc.match(FRONTMATTER_RE)
  if (!m) {
    return { frontmatter: {}, body: doc, hasFrontmatter: false }
  }
  return {
    frontmatter: parseYaml(m[1] ?? ''),
    body: doc.slice(m[0].length),
    hasFrontmatter: true,
  }
}
