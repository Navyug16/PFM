import { describe, it, expect } from 'vitest'
import { escapeHtml } from './html-escaper'

describe('escapeHtml Utility', () => {
  it('escapes basic HTML entity characters (&, <, >, ", \')', () => {
    expect(escapeHtml('Ben & Jerry\'s <Ice Cream> "Special"')).toBe(
      'Ben &amp; Jerry&#39;s &lt;Ice Cream&gt; &quot;Special&quot;'
    )
  })

  it('handles empty strings, null, and undefined safely', () => {
    expect(escapeHtml('')).toBe('')
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  it('neutralizes script injection payload <script>alert(1)</script>', () => {
    const malicious = '<script>alert(1)</script>'
    const escaped = escapeHtml(malicious)
    expect(escaped).not.toContain('<script>')
    expect(escaped).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('neutralizes img/onerror injection payload <img src=x onerror=alert(1)>', () => {
    const malicious = '<img src=x onerror=alert(1)>'
    const escaped = escapeHtml(malicious)
    expect(escaped).not.toContain('<img')
    expect(escaped).toBe('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('neutralizes svg/onload injection payload <svg onload=alert(1)>', () => {
    const malicious = '<svg onload=alert(1)>'
    const escaped = escapeHtml(malicious)
    expect(escaped).not.toContain('<svg')
    expect(escaped).toBe('&lt;svg onload=alert(1)&gt;')
  })

  it('neutralizes attribute breakout payload " onmouseover="alert(1)', () => {
    const malicious = '" onmouseover="alert(1)'
    const escaped = escapeHtml(malicious)
    expect(escaped).not.toContain('"')
    expect(escaped).toBe('&quot; onmouseover=&quot;alert(1)')
  })
})
