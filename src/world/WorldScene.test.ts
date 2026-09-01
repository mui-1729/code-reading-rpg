import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { WorldViewport } from './WorldScene'
import { getWorldScenePresentation } from './worldPresentation'
import { getWorldSpriteStyle, isWorldPositionVisible } from './worldSceneGeometry'
import {
  VIEWPORT_WIDTH as WORLD_VIEWPORT_COLUMNS,
  VIEWPORT_HEIGHT as WORLD_VIEWPORT_ROWS,
  type WorldMapId,
} from './worldMap'

describe('shared World scene geometry', () => {
  it('player/followerをmap座標から共通viewport座標へ変換する', () => {
    expect(getWorldSpriteStyle({ x: 15, y: 9 }, { x: 10, y: 5 })).toEqual({
      left: `${(5.5 / WORLD_VIEWPORT_COLUMNS) * 100}%`,
      top: `${(4.5 / WORLD_VIEWPORT_ROWS) * 100}%`,
    })
  })

  it('viewport境界を全regionで同じhalf-open rangeとして判定する', () => {
    const start = { x: 10, y: 5 }

    expect(isWorldPositionVisible(start, start)).toBe(true)
    expect(
      isWorldPositionVisible(
        { x: start.x + WORLD_VIEWPORT_COLUMNS - 1, y: start.y + WORLD_VIEWPORT_ROWS - 1 },
        start,
      ),
    ).toBe(true)
    expect(isWorldPositionVisible({ x: start.x + WORLD_VIEWPORT_COLUMNS, y: start.y }, start)).toBe(
      false,
    )
    expect(isWorldPositionVisible({ x: start.x, y: start.y - 1 }, start)).toBe(false)
  })
})

describe('shared World viewport', () => {
  it.each<WorldMapId>(['overworld', 'js-village', 'js-forest', 'js-deep-forest', 'ts-frontier'])(
    '%s keeps coordinate identity while region data owns terrain and object presentation',
    (mapId) => {
      const presentation = getWorldScenePresentation(mapId)
      const html = renderToStaticMarkup(
        createElement(WorldViewport, {
          mapId,
          playerPosition: { x: 8, y: 4 },
          cells: [{ mapId, x: 9, y: 4, terrain: 'midboss', region: 'javascript' }],
          label: `${mapId} map`,
          terrainLabels: { road: 'Open road' },
          getTerrain: () => 'road' as const,
          renderObject: (cell, terrain) => `${cell.mapId}:${terrain}`,
          children: 'character layer',
        }),
      )

      expect(html).toContain(`aria-label="${mapId} map"`)
      expect(html).toContain(`data-world-map="${mapId}"`)
      expect(html).toContain('data-world-x="8"')
      expect(html).toContain('data-world-y="4"')
      expect(html).toContain(`data-world-scene="${presentation.sceneId}"`)
      expect(html).toContain(`data-world-bgm-track="${presentation.bgmTrack}"`)
      expect(html).toContain('class="world-tile terrain-road" title="Open road"')
      expect(html).toContain('data-world-x="9"')
      expect(html).toContain(`${mapId}:road</div>character layer`)
      expect(html).toContain(presentation.title)
      expect(html).not.toContain('terrain-midboss')
    },
  )
})
