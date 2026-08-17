/**
 * Recorded reach of the override containment gate: which of its assertions
 * actually execute against the current table.
 *
 * `spec-override-containment.test.ts` guards four containments, and one of them
 * — "an override may narrow a value domain, never widen it" — compares the
 * override's values against the registry's. That comparison can only run where
 * the registry enumerates values at all. Today it never runs: all eight
 * overrides sit on `icon` and `name`, and the registry deliberately leaves both
 * open, which is the very decision the gate's fifth section exists to protect.
 * The assertion is not wrong. It is asleep, and nothing was watching whether it
 * stayed that way.
 *
 * This file is what watches. It records, per override pair, whether the
 * widening comparison is `live` or `dormant`, so the split is visible in the
 * tree rather than inferable only by instrumenting the loop.
 *
 * **Both directions are failures**, for different reasons than usual.
 *
 *   - `dormant` → `live`: an override now sits on an attribute the registry
 *     enumerates, so the arm has woken up. That is good news and still a
 *     failure, because nobody has yet confirmed the woken assertion asserts
 *     what it claims to. Wake it deliberately or not at all.
 *   - `live` → `dormant`: coverage was withdrawn. An assertion that used to
 *     run now skips, and a skipped assertion is green. This is the silent one.
 *
 * Recording the state rather than asserting `reached > 0` is the point. A floor
 * on the number of overrides that *carry* values — which is what the gate
 * originally counted — is structurally incapable of seeing this: all eight
 * carry 1,667 values each, and all eight skip. The two quantities are
 * unrelated, so the floor read 8 and the arm ran 0 and both were green.
 *
 * **Updating**: change an entry in the same commit as the spec change and say
 * which direction in the message. If a pair goes `live`, check that the arm has
 * something to say before recording it — a live arm that compares an override
 * against a registry list identical to it is awake and still proves nothing.
 */

/** Whether the widening comparison executes for an override pair. */
export type WideningArm = 'live' | 'dormant'

/**
 * Every override pair, keyed `NodeType.attribute`, with the arm's state.
 *
 * All eight are dormant, and all eight are the glyph vocabulary — the one case
 * the registry is required to stay open for. A ninth entry that is also dormant
 * would be worth a second look; a ninth that is dormant for a *different* reason
 * than "the registry keeps this attribute open on purpose" is a defect.
 */
export const WIDENING_ARM_BASELINE: Readonly<Record<string, WideningArm>> = {
  'Alert.icon': 'dormant',
  'Badge.icon': 'dormant',
  'Button.icon': 'dormant',
  'DropdownItem.icon': 'dormant',
  'Icon.name': 'dormant',
  'Input.icon': 'dormant',
  'ListItem.icon': 'dormant',
  'NavItem.icon': 'dormant',
}
