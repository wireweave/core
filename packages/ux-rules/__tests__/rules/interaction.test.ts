/**
 * Interaction Rules Tests
 *
 * Note: Some rules (Form, Tab, MenuItem, IconButton, Dialog) are defined
 * but not testable because @wireweave/core parser doesn't support these
 * node types yet. Tests for those rules will be added when parser support
 * is available.
 */

import { describe, it, expect } from 'vitest'
import { parse } from '@wireweave/core'
import { validateUX } from '../../src'
import { interactionRules } from '../../src/rules/interaction'

describe('Interaction Rules', () => {
  describe('interactionRules array', () => {
    it('should export 8 interaction rules', () => {
      expect(interactionRules).toHaveLength(8)
    })

    it('should have all rules with correct category', () => {
      interactionRules.forEach((rule) => {
        expect(rule.category).toBe('interaction')
      })
    })

    it('should have all required rule properties', () => {
      interactionRules.forEach((rule) => {
        expect(rule.id).toBeDefined()
        expect(rule.name).toBeDefined()
        expect(rule.description).toBeDefined()
        expect(rule.severity).toBeDefined()
        expect(rule.appliesTo).toBeDefined()
        expect(rule.check).toBeInstanceOf(Function)
      })
    })
  })

  describe('interaction-button-action', () => {
    it('should report warning for button without action', () => {
      const doc = parse('page { button "Click me" }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-button-action')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('warning')
    })

    it('should pass for button with onClick', () => {
      const doc = parse('page { button "Click" onClick="handleClick" }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-button-action')
      expect(issue).toBeUndefined()
    })

    it('should pass for button with href', () => {
      const doc = parse('page { button "Go" href="/page" }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-button-action')
      expect(issue).toBeUndefined()
    })

    it('should pass for button with action', () => {
      const doc = parse('page { button "Submit" action="submit" }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-button-action')
      expect(issue).toBeUndefined()
    })

    it('should pass for submit type button', () => {
      const doc = parse('page { button "Submit" type="submit" }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-button-action')
      expect(issue).toBeUndefined()
    })

    it('should include button text in message', () => {
      const doc = parse('page { button "Save Changes" }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-button-action')
      expect(issue?.message).toContain('Save Changes')
    })
  })

  describe('interaction-link-destination', () => {
    it('should report warning for link without destination', () => {
      const doc = parse('page { link "Click here" }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-link-destination')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('warning')
    })

    it('should pass for link with href', () => {
      const doc = parse('page { link "Home" href="/" }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-link-destination')
      expect(issue).toBeUndefined()
    })

    it('should pass for link with to', () => {
      const doc = parse('page { link "About" to="/about" }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-link-destination')
      expect(issue).toBeUndefined()
    })

    it('should pass for link with url', () => {
      const doc = parse('page { link "External" url="https://example.com" }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-link-destination')
      expect(issue).toBeUndefined()
    })
  })

  // Note: Form node type is not supported by @wireweave/core parser yet
  // Tests for interaction-form-submit will be added when support is available
  describe('interaction-form-submit', () => {
    it('should have correct rule definition', () => {
      const rule = interactionRules.find((r) => r.id === 'interaction-form-submit')
      expect(rule).toBeDefined()
      expect(rule?.appliesTo).toContain('Form')
      expect(rule?.severity).toBe('warning')
    })
  })

  // Note: Tab/TabItem node types are not supported by @wireweave/core parser yet
  // Tests for interaction-tab-target will be added when support is available
  describe('interaction-tab-target', () => {
    it('should have correct rule definition', () => {
      const rule = interactionRules.find((r) => r.id === 'interaction-tab-target')
      expect(rule).toBeDefined()
      expect(rule?.appliesTo).toContain('Tab')
      expect(rule?.appliesTo).toContain('TabItem')
      expect(rule?.severity).toBe('warning')
    })
  })

  // The parser does emit `DropdownItem` now, but it puts the items in the
  // dropdown's `items` array rather than `children`, which is what the UX walker
  // descends into — so the rule still has nothing to fire on. `MenuItem` has no
  // grammar rule at all. Behavioural tests wait on the walker reaching `items`.
  describe('interaction-menu-action', () => {
    it('should have correct rule definition', () => {
      const rule = interactionRules.find((r) => r.id === 'interaction-menu-action')
      expect(rule).toBeDefined()
      expect(rule?.appliesTo).toContain('MenuItem')
      expect(rule?.appliesTo).toContain('DropdownItem')
      expect(rule?.severity).toBe('warning')
    })
  })

  describe('interaction-card-action', () => {
    it('should report info for clickable card without action', () => {
      const doc = parse('page { card clickable { text "Content" } }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-card-action')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('info')
    })

    it('should pass for clickable card with onClick', () => {
      const doc = parse('page { card clickable onClick="handleClick" { text "Content" } }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-card-action')
      expect(issue).toBeUndefined()
    })

    it('should pass for clickable card with href', () => {
      const doc = parse('page { card clickable href="/detail" { text "Content" } }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-card-action')
      expect(issue).toBeUndefined()
    })

    it('should not check non-clickable cards', () => {
      const doc = parse('page { card { text "Content" } }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-card-action')
      expect(issue).toBeUndefined()
    })
  })

  // Note: IconButton node type is not supported by @wireweave/core parser yet
  // Tests for interaction-icon-button-action will be added when support is available
  describe('interaction-icon-button-action', () => {
    it('should have correct rule definition', () => {
      const rule = interactionRules.find((r) => r.id === 'interaction-icon-button-action')
      expect(rule).toBeDefined()
      expect(rule?.appliesTo).toContain('IconButton')
      expect(rule?.severity).toBe('warning')
    })
  })

  describe('interaction-modal-close', () => {
    it('should report info for modal without close mechanism', () => {
      const doc = parse('page { modal { text "Content" } }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-modal-close')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('info')
    })

    it('should pass for modal with onClose', () => {
      const doc = parse('page { modal onClose="handleClose" { text "Content" } }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-modal-close')
      expect(issue).toBeUndefined()
    })

    it('should pass for modal with closable attribute', () => {
      const doc = parse('page { modal closable { text "Content" } }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-modal-close')
      expect(issue).toBeUndefined()
    })

    it('should pass for modal with dismissible attribute', () => {
      const doc = parse('page { modal dismissible { text "Content" } }')
      const result = validateUX(doc, { categories: ['interaction'] })

      const issue = result.issues.find((i) => i.ruleId === 'interaction-modal-close')
      expect(issue).toBeUndefined()
    })
  })
})
