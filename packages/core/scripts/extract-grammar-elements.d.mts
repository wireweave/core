/**
 * Types for the grammar extractor, which is plain ESM so it can run as a build
 * step with no compile of its own. Only the parts tests consume are declared.
 */

export interface BareNodeType {
  /** Grammar rule whose action builds the node. */
  rule: string
  /** The literal written to the `type` key. */
  type: string
}

export interface NodeConstruction {
  /** Node types passed to `createNode`, deduped. */
  viaCreateNode: string[]
  /** Node types passed to `createBlockNode`, deduped. */
  viaCreateBlockNode: string[]
  /** Node types written through neither helper. */
  bare: BareNodeType[]
  /** Rules returning an object literal they built themselves, deduped. */
  bareObjectRules: string[]
}

export interface Extraction {
  elements: [string, string][]
  blockNodeTypes: string[]
  childKeywords: string[]
}

export declare const GRAMMAR_PATH: string
export declare const OUTPUT_PATH: string

export declare function extractGrammarElements(source: string): Extraction
export declare function extractNodeConstructions(source: string): NodeConstruction
export declare function renderModule(extraction: Extraction): string
