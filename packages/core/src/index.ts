/**
 * @wireweave/core
 *
 * Text-based wireframe DSL parser and renderer
 */

// AST types, guards, and utilities
export * from './ast'

// Parser functions
export * from './parser'

// Printer (AST → canonical DSL text)
export * from './printer'

// Renderer
export * from './renderer'

// Viewport
export * from './viewport'

// Icons (Lucide)
export * from './icons/lucide-icons'

// DSL Specification (components, attributes)
export * from './spec'

// Validation
export * from './validation'

// Diff (comparison between wireframes)
export * from './diff'

// Export (format conversion)
export * from './export'

// Analyze (statistics and metrics)
export * from './analyze'

// Extract (deterministic SSOT-shaped derivations)
export * from './extract'

// Typed state/event normalization shared by graph extraction and site runtime
export * from './interaction'

// Application manifest, module linker, and resolved app document
export * from './app'
