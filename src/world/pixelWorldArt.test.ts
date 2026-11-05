/// <reference types="vite/client" />
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WorldSceneryLayer } from './WorldScenery'
import { getWorldCellObjectKind, WORLD_BUILDINGS } from './worldStructures'

const assets = import.meta.glob<string>('/public/pixel-art/world/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('World pixel art contract', () => {
  it('terrain and object assets use bounded integer rectangles and a small palette', () => {
    expect(Object.keys(assets).length).toBeGreaterThan(30)
    for (const [name, svg] of Object.entries(assets)) {
      expect(svg, name).toContain('viewBox="0 0 16 16"')
      expect(svg, name).toContain('shape-rendering="crispEdges"')
      expect(svg, name).not.toMatch(
        /<(?:path|polygon|ellipse|circle|filter|linearGradient|radialGradient)\b/,
      )
      expect(svg, name).not.toMatch(/\b(?:opacity|stroke|transform)=/)
      const colors = new Set([...svg.matchAll(/fill="(#[\da-f]{6})"/gi)].map((match) => match[1]))
      expect(colors.size, name).toBeLessThanOrEqual(8)
      const rectangles = [
        ...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/g),
      ]
      expect(rectangles.length, name).toBeGreaterThan(0)
      for (const rect of rectangles) {
        const [, x, y, width, height] = rect.map(Number)
        expect(x + width, name).toBeLessThanOrEqual(16)
        expect(y + height, name).toBeLessThanOrEqual(16)
        expect(width, name).toBeGreaterThan(0)
        expect(height, name).toBeGreaterThan(0)
      }
    }
  })

  it('whole buildings retain their collision footprint on the same pixel grid', () => {
    for (const building of WORLD_BUILDINGS) {
      const { left, right, top, bottom } = building.bounds
      const html = renderToStaticMarkup(
        createElement(WorldSceneryLayer, {
          mapId: building.mapId,
          viewportStart: { x: left, y: top },
        }),
      )
      expect(html).toContain(`viewBox="0 0 ${(right - left + 1) * 16} ${(bottom - top + 1) * 16}"`)
      expect(html).not.toMatch(/<(?:path|polygon|ellipse|circle)\b/)
    }
  })

  it('portal art follows destination semantics while stairs retain their own identity', () => {
    expect(getWorldCellObjectKind('overworld', 'exit', 'js-forest')).toBe('forest-arch')
    expect(getWorldCellObjectKind('js-forest', 'exit', 'js-forest-settlement')).toBe('timber-gate')
    expect(getWorldCellObjectKind('js-forest-settlement', 'exit', 'js-deep-forest')).toBe(
      'root-arch',
    )
    expect(getWorldCellObjectKind('js-deep-forest', 'exit', 'overworld')).toBe('root-arch')
    expect(getWorldCellObjectKind('js-deep-forest', 'exit', 'js-forest-settlement')).toBe(
      'light-gap',
    )
    expect(getWorldCellObjectKind('ts-frontier', 'exit', 'overworld')).toBe('stone-gate')
    expect(getWorldCellObjectKind('ts-frontier', 'stairs-down', 'database-archive')).toBe(
      'stairs-down',
    )
    expect(getWorldCellObjectKind('database-archive', 'stairs-up', 'ts-frontier')).toBe('stairs-up')
    expect(getWorldCellObjectKind('js-village', 'exit', 'overworld')).toBe('village-exit')
    expect(getWorldCellObjectKind('js-forest', 'woods')).toBeUndefined()
  })
})
