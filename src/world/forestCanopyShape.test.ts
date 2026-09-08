import { describe, expect, it } from 'vitest'
import { getTerrain, JS_FOREST_MAP_ID } from './worldMap'

function deepWoodsSegments(y: number): string {
  const segments: Array<[number, number]> = []
  let start: number | null = null

  for (let x = 1; x <= 53; x += 1) {
    const deep = getTerrain(x, y, JS_FOREST_MAP_ID) === 'deep-woods'
    if (deep && start === null) start = x
    if (!deep && start !== null) {
      segments.push([start, x - 1])
      start = null
    }
  }

  if (start !== null) segments.push([start, 53])
  return segments.map(([minX, maxX]) => `${minX}-${maxX}`).join('|')
}

describe('Forest canopy shape', () => {
  it('北西のdeep-woods境界は固定幅や長方形ではなく、行ごとに輪郭が変わる', () => {
    const signatures = Array.from({ length: 10 }, (_, index) => deepWoodsSegments(index + 3))

    expect(new Set(signatures).size).toBeGreaterThanOrEqual(8)
    expect(signatures.some((signature) => signature.split('|').length >= 3)).toBe(true)
  })

  it('中央をdeep-woodsの空白帯にせず、小さな核と枝を通す', () => {
    for (let y = 13; y <= 21; y += 1) {
      const centralDeepCount = Array.from({ length: 13 }, (_, index) => index + 17).filter(
        (x) => getTerrain(x, y, JS_FOREST_MAP_ID) === 'deep-woods',
      ).length
      expect(centralDeepCount, `central deep woods missing at y=${y}`).toBeGreaterThan(0)
    }

    expect(getTerrain(27, 15, JS_FOREST_MAP_ID)).toBe('deep-woods')
    expect(getTerrain(26, 18, JS_FOREST_MAP_ID)).toBe('deep-woods')
  })

  it('西側に大きな8×5のdeep-woods長方形を作らない', () => {
    for (let y = 2; y <= 34; y += 1) {
      for (let x = 2; x <= 13; x += 1) {
        const solidRectangle = Array.from({ length: 5 }, (_, dy) => y + dy).every((rowY) =>
          Array.from({ length: 8 }, (_, dx) => x + dx).every(
            (columnX) => getTerrain(columnX, rowY, JS_FOREST_MAP_ID) === 'deep-woods',
          ),
        )
        expect(solidRectangle, `solid deep-woods rectangle starts at ${x},${y}`).toBe(false)
      }
    }
  })
})
