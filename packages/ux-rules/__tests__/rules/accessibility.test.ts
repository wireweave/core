/**
 * Accessibility Rules Tests
 */

import { describe, it, expect } from 'vitest'
import { parse } from '@wireweave/core'
import { validateUX } from '../../src'

describe('Accessibility Rules', () => {
  describe('a11y-input-label', () => {
    it('should report error for input without label', () => {
      const doc = parse('page { input }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-input-label')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('error')
    })

    it('should report warning for input with only placeholder', () => {
      const doc = parse('page { input placeholder="Enter name" }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-input-label')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('warning')
    })

    it('should pass for input with label', () => {
      const doc = parse('page { input label="Name" }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-input-label')
      expect(issue).toBeUndefined()
    })

    it('should check textarea', () => {
      const doc = parse('page { textarea }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-input-label')
      expect(issue).toBeDefined()
    })

    it('should check select', () => {
      const doc = parse('page { select }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-input-label')
      expect(issue).toBeDefined()
    })
  })

  describe('a11y-image-alt', () => {
    it('should report warning for image without alt', () => {
      const doc = parse('page { image src="test.jpg" }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-image-alt')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('warning')
    })

    it('should pass for image with alt', () => {
      const doc = parse('page { image src="test.jpg" alt="Test image" }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-image-alt')
      expect(issue).toBeUndefined()
    })
  })

  describe('a11y-icon-button-label', () => {
    it('should warn (not error) for icon-only button with no accessible name', () => {
      const doc = parse('page { button "" icon=search }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-icon-button-label')
      expect(issue).toBeDefined()
      // Wireframes: a missing accessible name is an improvement, not a hard gate.
      expect(issue?.severity).toBe('warning')
      // It must not hard-fail the document.
      expect(result.severityCounts.errors).toBe(0)
    })

    it('should pass for an icon-only button with an aria accessible name', () => {
      const doc = parse('page { button "" icon=search aria="Search" }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-icon-button-label')
      expect(issue).toBeUndefined()
    })

    it('should pass for an icon-only button with an aria-label accessible name', () => {
      const doc = parse('page { button "" icon=x aria-label="Close" }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-icon-button-label')
      expect(issue).toBeUndefined()
    })

    it('should pass for an icon-only button with a title accessible name', () => {
      const doc = parse('page { button "" icon=menu title="Open menu" }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-icon-button-label')
      expect(issue).toBeUndefined()
    })

    it('should pass for button with icon and text', () => {
      const doc = parse('page { button "Search" icon=search }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-icon-button-label')
      expect(issue).toBeUndefined()
    })

    it('should pass for button without icon', () => {
      const doc = parse('page { button "Click me" }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-icon-button-label')
      expect(issue).toBeUndefined()
    })
  })

  describe('a11y-link-text', () => {
    it('should report warning for generic link text', () => {
      const doc = parse('page { link "click here" href="/test" }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-link-text')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('warning')
    })

    it('should report for "read more" link', () => {
      const doc = parse('page { link "read more" href="/test" }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-link-text')
      expect(issue).toBeDefined()
    })

    it('should pass for descriptive link text', () => {
      const doc = parse('page { link "View product details" href="/product" }')
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-link-text')
      expect(issue).toBeUndefined()
    })
  })

  describe('a11y-heading-hierarchy', () => {
    it('should report warning for skipped heading levels', () => {
      const doc = parse(`
        page {
          title "H1" level=1
          title "H3" level=3
        }
      `)
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-heading-hierarchy')
      expect(issue).toBeDefined()
      expect(issue?.message).toContain('skipped')
    })

    it('should pass for sequential heading levels', () => {
      const doc = parse(`
        page {
          title "H1" level=1
          title "H2" level=2
          title "H3" level=3
        }
      `)
      const result = validateUX(doc, { categories: ['accessibility'] })

      const issue = result.issues.find((i) => i.ruleId === 'a11y-heading-hierarchy')
      expect(issue).toBeUndefined()
    })
  })
})
