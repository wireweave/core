/**
 * Strip comments from TypeScript source, for gates that must read what a module
 * *does* rather than what it explains.
 *
 * A character scan rather than a regex, because the constructs that have to be
 * told apart can each contain the other's opening sequence: a comment can spell
 * a quote, a string can spell `//`, and a regular expression can spell both.
 *
 * **Strings and regular expressions are kept.** Only comments are removed. A
 * name written as `'data-navigate'`, as `` `…${x}` ``, or as `/data-navigate/`
 * is a name the module emits, and a gate that dropped string bodies would miss
 * the most natural way to write the thing it is looking for. Quote and regex
 * state exist to keep the scan *positioned*, not to censor.
 *
 * That is what makes the error direction one-sided: since nothing but comments
 * is dropped, a state the scan gets wrong can only leave a comment standing —
 * a false positive, loud and inspectable. A false negative would need a run of
 * real code to be mistaken for a comment, which no single mis-called quote can
 * produce. {@link CodeScan.open} closes the remaining gap by reporting a scan
 * that ended mid-construct, so a caller never grades a file the scan lost its
 * place in.
 */

/** A construct the scan was still inside when the text ran out. */
export interface OpenState {
  /** The construct left unterminated. */
  kind: 'string' | 'block comment' | 'regex literal'
  /** 1-based line where that construct opened. */
  line: number
}

/** Result of {@link scanCode}. */
export interface CodeScan {
  /** The source with comment bodies removed and everything else intact. */
  code: string
  /** Non-null when the scan ended mid-construct — see {@link OpenState}. */
  open: OpenState | null
}

/**
 * Characters that cannot end an expression, so a `/` after one begins a regular
 * expression rather than a division.
 *
 * `}` is here on purpose. It ends a block far more often than it ends an object
 * literal in this position, and the two readings differ only in noise: reading
 * a division as a regex leaves a short run of code unstripped, which at worst
 * spares a comment that a gate then reports.
 */
const REGEX_PRECEDING_PUNCTUATION = new Set('([{,;:=!&|?+-*%<>~^')

/** Keywords after which a `/` likewise begins a regular expression. */
const REGEX_PRECEDING_KEYWORDS = new Set([
  'return',
  'typeof',
  'instanceof',
  'in',
  'of',
  'new',
  'delete',
  'void',
  'case',
  'do',
  'else',
  'yield',
  'await',
  'throw',
])

/**
 * Whether the `/` that follows this code begins a regular expression.
 *
 * @param code - the code emitted so far, whose tail is the preceding token
 */
function startsRegex(code: string): boolean {
  const trimmed = code.replace(/\s+$/, '')
  if (trimmed === '') return true

  const last = trimmed[trimmed.length - 1]
  if (REGEX_PRECEDING_PUNCTUATION.has(last)) return true

  const word = /[A-Za-z_$][A-Za-z0-9_$]*$/.exec(trimmed)
  return word !== null && REGEX_PRECEDING_KEYWORDS.has(word[0])
}

/**
 * Remove comments from source text.
 *
 * @param text - file contents
 * @returns the code, and any construct the scan ended inside
 */
export function scanCode(text: string): CodeScan {
  let out = ''
  let line = 1
  let openedAt = 0

  let quote: "'" | '"' | '`' | null = null
  let comment: 'line' | 'block' | null = null
  let regex: 'body' | 'class' | null = null

  const emit = (ch: string): void => {
    out += ch
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (ch === '\n') line++

    if (comment === 'line') {
      if (ch === '\n') {
        comment = null
        emit(ch)
      }
      continue
    }
    if (comment === 'block') {
      if (ch === '*' && next === '/') {
        comment = null
        i++
      }
      continue
    }
    if (quote !== null) {
      if (ch === '\\') {
        emit(ch + (next ?? ''))
        i++
        continue
      }
      if (ch === quote) quote = null
      emit(ch)
      continue
    }
    if (regex !== null) {
      // A `/` inside a character class is a literal slash, not the terminator —
      // `/[/]/` is one regex, and a scan that ended it early would hand the
      // rest of the line to the wrong state machine.
      if (ch === '\\') {
        emit(ch + (next ?? ''))
        i++
        continue
      }
      if (ch === '[') regex = 'class'
      else if (ch === ']') regex = 'body'
      else if (ch === '/' && regex === 'body') regex = null
      else if (ch === '\n') regex = null // unterminated; a regex cannot span lines
      emit(ch)
      continue
    }

    if (ch === '/' && next === '/') {
      comment = 'line'
      i++
      continue
    }
    if (ch === '/' && next === '*') {
      comment = 'block'
      openedAt = line
      i++
      continue
    }
    if (ch === '/' && startsRegex(out)) {
      regex = 'body'
      openedAt = line
      emit(ch)
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch
      openedAt = line
    }
    emit(ch)
  }

  const kind: OpenState['kind'] | null =
    quote !== null
      ? 'string'
      : comment === 'block'
        ? 'block comment'
        : regex !== null
          ? 'regex literal'
          : null

  return { code: out, open: kind === null ? null : { kind, line: openedAt } }
}
