/**
 * CodeMirror Language Definition for Wireframe DSL
 *
 * Provides syntax highlighting using StreamLanguage
 */

import type { StringStream } from '@codemirror/language'
import { ALL_COMPONENTS, ATTRIBUTES, VALUE_KEYWORDS } from '../index.js'

// Component names for highlighting
const COMPONENT_NAMES = ALL_COMPONENTS.map((c) => c.name)

// Attribute names for highlighting
const ATTRIBUTE_NAMES = ATTRIBUTES.map((a) => a.name)

/**
 * StreamLanguage token function for CodeMirror
 * Use with StreamLanguage.define()
 */
export function createTokenizer() {
  return {
    token(stream: StringStream): string | null {
      // Skip whitespace
      if (stream.eatSpace()) return null

      // Comments
      if (stream.match('//')) {
        stream.skipToEnd()
        return 'comment'
      }

      // Strings
      if (stream.match(/"[^"]*"/)) {
        return 'string'
      }

      // Numbers
      if (stream.match(/\d+/)) {
        return 'number'
      }

      // Check for component keywords
      for (const kw of COMPONENT_NAMES) {
        if (stream.match(new RegExp(`^${kw}\\b`))) {
          return 'keyword'
        }
      }

      // Check for attribute names
      for (const attr of ATTRIBUTE_NAMES) {
        if (stream.match(new RegExp(`^${attr}\\b`))) {
          return 'propertyName'
        }
      }

      // Check for value keywords
      for (const val of VALUE_KEYWORDS) {
        if (stream.match(new RegExp(`^${val}\\b`))) {
          return 'atom'
        }
      }

      // Operators
      if (stream.match(/[=]/)) {
        return 'operator'
      }

      // Braces
      if (stream.match(/[{}[\]()]/)) {
        return 'bracket'
      }

      // Skip other characters
      stream.next()
      return null
    },
  }
}

/**
 * Get language configuration for CodeMirror
 * Returns configuration for auto-closing brackets, comments, etc.
 */
export function getLanguageConfig() {
  return {
    commentTokens: { line: '//' },
    closeBrackets: { brackets: ['(', '[', '{', '"'] },
    indentOnInput: /^\s*\}$/,
  }
}
