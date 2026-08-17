/**
 * Types for the icon-name extractor, which is plain ESM so it can run as a build
 * step with no compile of its own. Only the parts tests consume are declared.
 */

export declare const ICONS_PATH: string
export declare const OUTPUT_PATH: string

export declare function extractIconNames(source: string): string[]
export declare function renderModule(names: string[]): string
