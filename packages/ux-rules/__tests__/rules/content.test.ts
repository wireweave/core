/**
 * Content Rules Tests
 */

import { describe, it, expect } from 'vitest'
import { parse } from '@wireweave/core'
import { validateUX } from '../../src'

describe('Content Rules', () => {
  describe('content-empty-text', () => {
    it('should report warning for empty text', () => {
      const doc = parse('page { text "" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-empty-text')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('warning')
    })

    it('should report warning for Lorem ipsum', () => {
      const doc = parse('page { text "Lorem ipsum" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-empty-text')
      expect(issue).toBeDefined()
    })

    it('should pass for meaningful text', () => {
      const doc = parse('page { text "Welcome to our app" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-empty-text')
      expect(issue).toBeUndefined()
    })
  })

  describe('content-button-text-length', () => {
    it('should report info for very long button text', () => {
      const doc = parse(
        'page { button "Click here to submit your application and save all changes" }',
      )
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-button-text-length')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('info')
    })

    it('should pass for concise button text', () => {
      const doc = parse('page { button "Submit" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-button-text-length')
      expect(issue).toBeUndefined()
    })
  })

  describe('content-title-length', () => {
    it('should report info for very long title', () => {
      const doc = parse(
        'page { title "This is an extremely long title that goes on and on and contains way too much information for a heading" }',
      )
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-title-length')
      expect(issue).toBeDefined()
    })

    it('should pass for reasonable title', () => {
      const doc = parse('page { title "User Settings" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-title-length')
      expect(issue).toBeUndefined()
    })
  })

  describe('content-page-title', () => {
    it('should report warning for page without title', () => {
      const doc = parse(`
        page {
          card {
            text "Some content"
            button "Click" primary
          }
        }
      `)
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-page-title')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('warning')
    })

    it('should pass for page with title', () => {
      const doc = parse(`
        page {
          title "Dashboard"
          card {
            text "Some content"
          }
        }
      `)
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-page-title')
      expect(issue).toBeUndefined()
    })

    it('should find title in nested container', () => {
      const doc = parse(`
        page {
          header {
            title "Dashboard"
          }
          main {
            text "Content"
          }
        }
      `)
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-page-title')
      expect(issue).toBeUndefined()
    })
  })

  describe('content-link-text', () => {
    it('should report error for link without text', () => {
      const doc = parse('page { link "" href="/page" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-link-text')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('error')
    })

    it('should pass for link with text', () => {
      const doc = parse('page { link "Learn more" href="/page" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-link-text')
      expect(issue).toBeUndefined()
    })
  })

  describe('content-no-placeholder', () => {
    it('should report warning for lorem ipsum content', () => {
      const doc = parse('page { text "Lorem ipsum dolor sit amet" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-no-placeholder')
      expect(issue).toBeDefined()
    })

    it('should report warning for TODO content', () => {
      const doc = parse('page { text "TODO: Add real content" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-no-placeholder')
      expect(issue).toBeDefined()
    })

    it('should pass for real content', () => {
      const doc = parse('page { text "Welcome to our application" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-no-placeholder')
      expect(issue).toBeUndefined()
    })
  })

  describe('content-unknown-icon', () => {
    it('should report warning for a button with an unknown icon', () => {
      const doc = parse('page { button "" icon="definitely-not-an-icon" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-unknown-icon')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('warning')
    })

    it('should report warning for an input with an unknown icon', () => {
      const doc = parse('page { input "Email" icon="definitely-not-an-icon" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-unknown-icon')
      expect(issue).toBeDefined()
    })

    it('should report warning for an icon node with an unknown name', () => {
      const doc = parse('page { icon "definitely-not-an-icon" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-unknown-icon')
      expect(issue).toBeDefined()
    })

    it('should pass for a valid icon name', () => {
      const doc = parse('page { button "" icon="settings" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-unknown-icon')
      expect(issue).toBeUndefined()
    })

    it('should pass for a legacy alias that now resolves (more-vertical)', () => {
      const doc = parse('page { icon "more-vertical" }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-unknown-icon')
      expect(issue).toBeUndefined()
    })
  })

  describe('content-control-value-range', () => {
    it('should report warning for a slider value above its declared max', () => {
      const doc = parse('page { slider "Temperature" min=0 max=1 value=70 }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-control-value-range')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('warning')
      expect(issue?.message).toContain('70')
      expect(issue?.message).toContain('[0, 1]')
    })

    it('should report warning for a slider value below its declared min', () => {
      const doc = parse('page { slider "Gain" min=10 max=20 value=3 }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-control-value-range')
      expect(issue).toBeDefined()
    })

    it('should report warning for a progress value above its declared max', () => {
      const doc = parse('page { progress value=140 max=100 }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-control-value-range')
      expect(issue).toBeDefined()
    })

    it('should pass for a slider value within its declared range', () => {
      const doc = parse('page { slider "Max Tokens" min=1024 max=8192 value=4096 }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-control-value-range')
      expect(issue).toBeUndefined()
    })

    it('should pass for a slider value within the default 0..100 range when min/max are omitted', () => {
      const doc = parse('page { slider "Volume" value=70 }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-control-value-range')
      expect(issue).toBeUndefined()
    })

    it('should pass for a progress within the default 0..100 range', () => {
      const doc = parse('page { progress value=30 }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-control-value-range')
      expect(issue).toBeUndefined()
    })

    it('should not fire when a slider value is unset', () => {
      const doc = parse('page { slider "Brightness" min=0 max=1 }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-control-value-range')
      expect(issue).toBeUndefined()
    })
  })

  describe('content-duplicate-control-label', () => {
    it('should report warning when a slider repeats an adjacent text label', () => {
      const doc = parse(
        'page { card { text "Temperature" slider "Temperature" min=0 max=1 value=0 } }',
      )
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-duplicate-control-label')
      expect(issue).toBeDefined()
      expect(issue?.severity).toBe('warning')
    })

    it('should match case-insensitively and trimmed', () => {
      const doc = parse('page { card { text "  temperature " slider "Temperature" value=0 } }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-duplicate-control-label')
      expect(issue).toBeDefined()
    })

    it('should report when the duplicate text follows the control', () => {
      const doc = parse('page { card { slider "Temperature" value=0 text "Temperature" } }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-duplicate-control-label')
      expect(issue).toBeDefined()
    })

    it('should pass when the text label differs from the control label', () => {
      const doc = parse('page { card { text "Temperature" slider "Humidity" value=0 } }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-duplicate-control-label')
      expect(issue).toBeUndefined()
    })

    it('should pass when the matching text is not an adjacent sibling', () => {
      const doc = parse('page { card { text "Temperature" divider slider "Temperature" value=0 } }')
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-duplicate-control-label')
      expect(issue).toBeUndefined()
    })

    it('should pass when the matching text lives in a different container', () => {
      const doc = parse(
        'page { card { text "Temperature" } card { slider "Temperature" value=0 } }',
      )
      const result = validateUX(doc, { categories: ['content'] })

      const issue = result.issues.find((i) => i.ruleId === 'content-duplicate-control-label')
      expect(issue).toBeUndefined()
    })
  })
})
