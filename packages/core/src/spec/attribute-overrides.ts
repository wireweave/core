/**
 * Element-scoped attribute facts.
 *
 * `ATTRIBUTE_SPECS` is keyed by attribute name with no owning element, which is
 * what lets an editor answer "is `gap` a real attribute" without knowing where
 * the cursor is. The price is that it can hold only one answer per name, so a
 * fact that is true on one element and false on the next has nowhere to live —
 * the registry either states it everywhere (wrong) or nowhere (silent).
 *
 * This module is that missing place. It is keyed by node type first and
 * attribute second, and {@link attributeFor} is the only way to read it: a
 * consumer that has an element in hand gets the narrow answer, and one that has
 * only a name still gets the registry's wide one.
 *
 * **The icon vocabulary is here on purpose, not for want of a better home.**
 * `icon` is glyph-valued on all seven elements that declare it, so it looks like
 * it belongs in the registry — but "in the registry" means "visible to
 * element-blind consumers", and those are exactly the consumers that must not
 * see it. `packages/language-data` mirrors registry `values` into the editor's
 * value-keyword vocabulary, which is a single alternation matched against any
 * value position; absorbing 1,667 glyph names there would colour `home` and
 * `map` as language constants wherever a value can appear, in a document that
 * has no icon in it. Icon names are a dataset the renderer looks names up in,
 * not words of the language. Keeping them behind {@link attributeFor} is what
 * keeps that distinction enforceable rather than merely stated.
 *
 * Keys are node types, never keywords. `item` names three different shapes
 * (`NavItem`, `DropdownItem`, `ListItem`) — see the note on `BLOCK_NODE_METADATA`
 * in `components.ts` — so a keyword-keyed table would silently apply one
 * element's narrowing to two others. {@link attributeFor} still accepts either
 * spelling and resolves it to the node type before looking here, so the two
 * spellings cannot disagree.
 */

import type { AttributeOverride, AttributeSpec } from './types'
import { ATTRIBUTE_MAP } from './attributes'
import { BLOCK_NODE_SPECS, COMPONENT_MAP, COMPONENT_SPECS, NODE_TYPE_MAP } from './components'
import { LUCIDE_ICON_NAMES } from './icon-names.generated'

/**
 * The glyph domain, as an attribute narrowing.
 *
 * `values` comes from the generated name list rather than a literal, so the
 * promise the spec makes is the set `getIconData` can actually resolve. The two
 * cannot drift: `scripts/extract-icon-names.mjs --check` fails on a stale list,
 * and `__tests__/icon-names-ssot.test.ts` re-derives it from the dataset itself.
 */
const GLYPH_NAME: AttributeOverride = {
  type: 'enum',
  values: LUCIDE_ICON_NAMES,
  description: 'Icon name, from the Lucide set',
}

/**
 * Attributes that are glyph-valued on every element declaring them.
 *
 * Derived rather than listed against elements: a new element that declares
 * `icon` is glyph-valued for the same reason the existing seven are, and a
 * transcribed list of those seven would be a copy of `COMPONENT_SPECS` that
 * goes stale the first time an element is added.
 */
const GLYPH_VALUED_ATTRIBUTES: readonly string[] = ['icon']

/**
 * Attributes that are glyph-valued on one element only.
 *
 * `icon "star"` writes the glyph into `name`, because the element's own content
 * *is* the glyph. Everywhere else `name` is an ordinary open string — a radio
 * group's name, a person's name on an avatar — so this narrowing cannot be
 * derived from the attribute name the way {@link GLYPH_VALUED_ATTRIBUTES} is.
 */
const GLYPH_VALUED_PAIRS: readonly (readonly [nodeType: string, attribute: string])[] = [
  ['Icon', 'name'],
]

/**
 * Build the override table from the two glyph rules above.
 *
 * @returns node type → attribute → narrowing
 */
function buildOverrides(): Record<string, Record<string, AttributeOverride>> {
  const overrides: Record<string, Record<string, AttributeOverride>> = {}

  const put = (nodeType: string, attribute: string, override: AttributeOverride): void => {
    overrides[nodeType] ??= {}
    overrides[nodeType][attribute] = override
  }

  for (const spec of [...COMPONENT_SPECS, ...BLOCK_NODE_SPECS]) {
    for (const attribute of GLYPH_VALUED_ATTRIBUTES) {
      if (spec.attributes.includes(attribute)) put(spec.nodeType, attribute, GLYPH_NAME)
    }
  }

  for (const [nodeType, attribute] of GLYPH_VALUED_PAIRS) {
    put(nodeType, attribute, GLYPH_NAME)
  }

  return overrides
}

/**
 * Every element-scoped narrowing, keyed by node type then attribute name.
 *
 * Exported for the gates and for tooling that wants to enumerate the narrowings
 * rather than ask about one pair. Read a single pair through
 * {@link attributeFor}, which composes the narrowing onto the registry entry.
 */
export const ATTRIBUTE_OVERRIDES: Readonly<
  Record<string, Readonly<Record<string, AttributeOverride>>>
> = buildOverrides()

/**
 * The spec of one attribute *on one element*.
 *
 * The element-aware counterpart to `isValidAttribute`, resolving the same way:
 * either an element keyword or an AST node type identifies the element, so a
 * consumer walking a parsed tree and one completing source text ask the same
 * question and get the same answer.
 *
 * `undefined` means there is no spec to return — the element is unknown, or it
 * does not accept the attribute, or the registry has never heard of the
 * attribute. A caller that needs to tell those apart is asking a diagnostic
 * question and should reach for the registries directly; this function answers
 * "what does this attribute mean here", and all three cases answer it the same.
 *
 * @param componentNameOrType - element keyword (`icon`) or node type (`Icon`)
 * @param attributeName - attribute as written in the source
 * @returns the registry entry, narrowed by any override for this element
 */
export function attributeFor(
  componentNameOrType: string,
  attributeName: string,
): AttributeSpec | undefined {
  const spec = COMPONENT_MAP.get(componentNameOrType) ?? NODE_TYPE_MAP.get(componentNameOrType)
  if (!spec?.attributes.includes(attributeName)) return undefined

  const base = ATTRIBUTE_MAP.get(attributeName)
  if (!base) return undefined

  const override = ATTRIBUTE_OVERRIDES[spec.nodeType]?.[attributeName]
  return override ? { ...base, ...override } : base
}
