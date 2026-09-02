import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SourceCode } from './SourceCode'

describe('SourceCode', () => {
  it('numbers original source lines once, including a long line that can visually wrap', () => {
    const code = 'const alive = enemies.filter(enemy => enemy.hp > 0)\nconst ordered = [...alive].sort((first, second) => first.attackDamage - second.attackDamage)\nordered[0]'
    const html = renderToStaticMarkup(createElement(SourceCode, { code }))

    expect(html.match(/data-source-line="\d+"/g)).toEqual([
      'data-source-line="1"', 'data-source-line="2"', 'data-source-line="3"',
    ])
    expect(html.match(/class="source-line-number" aria-hidden="true"/g)).toHaveLength(3)
    expect(html).toContain('const ordered = [...alive].sort((first, second) =&gt; first.attackDamage - second.attackDamage)')
    expect(html).toContain('<pre><code>ordered[0]</code></pre>')
  })

  it('preserves blank source lines and exposes a keyboard scroll target only when requested', () => {
    const html = renderToStaticMarkup(createElement(SourceCode, { code: 'enemies\n\n[0]', scrollable: true }))

    expect(html).toContain('tabindex="0"')
    expect(html).toContain('data-source-line="2"><span class="source-line-number" aria-hidden="true">2</span><pre><code></code></pre>')
    expect(renderToStaticMarkup(createElement(SourceCode, { code: 'enemies' }))).not.toContain('tabindex')
  })

  it('renders code as text without interpreting HTML', () => {
    const html = renderToStaticMarkup(createElement(SourceCode, { code: 'enemy.name === "<script>"' }))
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })
})
