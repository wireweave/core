import { describe, expect, it } from 'vitest'
import { buildCompactGrammarPrompt, buildGrammarPrompt } from '../src/index.js'

describe('buildGrammarPrompt', () => {
  const prompt = buildGrammarPrompt()

  it('returns a non-empty string', () => {
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(1000)
  })

  it('documents that .wf files may contain MORE THAN ONE top-level page', () => {
    expect(prompt).toMatch(/one OR MORE top-level page declarations/i)
  })

  it('documents the at(x, y) functional attribute on page', () => {
    expect(prompt).toMatch(/at\(x, y\)/)
    expect(prompt).toMatch(/at\(0, 0\)/)
  })

  it('documents the viewport="WxH" attribute on page', () => {
    expect(prompt).toMatch(/viewport="WxH"/)
    expect(prompt).toMatch(/viewport="1280x800"/)
  })

  it('describes the multi-page canvas mode', () => {
    expect(prompt).toMatch(/MULTI-PAGE CANVAS/i)
    expect(prompt).toMatch(/side-by-side on (one|a single) canvas/i)
  })

  it('mentions the renderer modes (render / renderCanvas / renderPage)', () => {
    expect(prompt).toMatch(/render\(doc\)/)
    expect(prompt).toMatch(/renderCanvas\(doc\)/)
    expect(prompt).toMatch(/renderPage\(page\)/)
  })

  it('still forbids nesting page inside page', () => {
    expect(prompt).toMatch(/Do NOT nest page inside page/i)
  })

  it('forbids collapsing multi-view apps into one page with sidebar tabs', () => {
    expect(prompt).toMatch(/separate top-level pages/i)
  })

  it('keeps inputType vs type warning', () => {
    expect(prompt).toMatch(/use inputType, NOT type/i)
  })

  it('documents the four interaction wiring attrs with their semantics', () => {
    expect(prompt).toMatch(/# INTERACTION WIRING/)
    expect(prompt).toMatch(/navigate="Page Title or URL"/)
    expect(prompt).toMatch(/opens="id"/)
    expect(prompt).toMatch(/toggles="id"/)
    expect(prompt).toMatch(/action="name"/)
    expect(prompt).toMatch(/action="none"/)
  })

  it('lists navigate/opens/toggles/action on every clickable component entry', () => {
    for (const entry of [
      'card:',
      'link:',
      'icon:',
      'avatar:',
      'badge:',
      'image:',
      'button:',
      'item:',
    ]) {
      const line = prompt.split('\n').find((l) => l.startsWith(entry))
      expect(line, entry).toMatch(/navigate, opens, toggles, action/)
    }
  })

  it('documents modal/drawer id as the opens/toggles target anchor', () => {
    expect(prompt).toMatch(
      /modal: Dialog\. String arg for title\. Attrs: w, h, id \(opens\/toggles target\)\./,
    )
    expect(prompt).toMatch(
      /drawer: Slide panel\. String arg for title\. Attrs: w, position, id \(opens\/toggles target\)\./,
    )
    expect(prompt).toMatch(/modal "Confirm delete" id="confirm-delete"/)
  })

  it('shows item-level wiring in nav/dropdown block syntax', () => {
    expect(prompt).toMatch(/item "Help" icon="info" opens="help-modal"/)
    expect(prompt).toMatch(/item "Logout" action="logout"/)
  })

  it('requires exactly one interaction per clickable element in the constraints', () => {
    expect(prompt).toMatch(/exactly one interaction attr \(navigate\/opens\/toggles\/action\)/)
  })
})

describe('buildCompactGrammarPrompt', () => {
  const prompt = buildCompactGrammarPrompt()

  it('returns a non-empty string', () => {
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(200)
  })

  it('is strictly shorter than the full prompt', () => {
    expect(prompt.length).toBeLessThan(buildGrammarPrompt().length)
  })

  it('still documents multi-page support', () => {
    expect(prompt).toMatch(/MULTI-PAGE CANVAS/i)
    expect(prompt).toMatch(/ONE OR MORE top-level page declarations/i)
    expect(prompt).toMatch(/at\(x, y\)/)
    expect(prompt).toMatch(/viewport="WxH"/)
  })

  it('still warns about sidebar collapse anti-pattern', () => {
    expect(prompt).toMatch(/separate top-level pages/i)
  })

  it('documents interaction wiring compactly', () => {
    expect(prompt).toMatch(/# INTERACTIONS/)
    expect(prompt).toMatch(/exactly ONE of: navigate="Page Title or URL"/)
    expect(prompt).toMatch(/opens="modal\/drawer id"/)
    expect(prompt).toMatch(/modal\/drawer take id="…" as the opens\/toggles target/)
    expect(prompt).toMatch(/exactly one of navigate\/opens\/toggles\/action/)
  })
})
