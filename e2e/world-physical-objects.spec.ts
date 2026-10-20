import { expect, test, type Page } from '@playwright/test'
import { JS_COMPLETE } from './canonical-progress-fixtures'
import { selectPauseTab } from './pause-menu-helpers'

async function seedWorld(page: Page, mapId: string, x: number, y: number) {
  await page.goto('/')
  await page.evaluate(
    ({ mapId, x, y, cleared }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        'code-reading-rpg:game-state',
        JSON.stringify({
          version: 2,
          revision: 1,
          progress: {
            version: 4,
            progress: {
              exp: 200,
              gold: 120,
              inventory: { patchKit: 1 },
              clearedStageIds: cleared,
              clearedAreaIds: ['javascript', 'typescript', 'database'],
              completedSideQuestIds: [],
              unlockedStageIds: [],
              unlockedSkillIds: ['trace', 'pulse', 'nova'],
            },
          },
          rpg: {
            version: 8,
            state: {
              equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
              ownedEquipmentIds: ['training-blade', 'traveler-coat'],
              partyMemberIds: ['byte'],
              partyEquipment: {},
              worldMapId: mapId,
              worldPosition: { x, y },
              safeCheckpoint: { id: 'central-hub', mapId: 'overworld', position: { x: 20, y: 14 } },
              stepsSinceEncounter: 0,
              encounterCount: 0,
              currentHp: 108,
              openedTreasureIds: [],
              revealedWorldCells: { 'database-archive': ['15:4', '9:13', '18:6', '11:3'] },
              ownedWorldMapIds: [],
            },
          },
          battleSession: null,
        }),
      )
      localStorage.setItem(
        'code-reading-rpg:tutorial',
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    { mapId, x, y, cleared: [...JS_COMPLETE, 4, 5, 6, 23] },
  )
  await page.goto('/world')
  await expect(page.locator('.world-viewport')).toHaveAttribute('data-world-map', mapId)
}

async function expectControlsInsideScreen(page: Page) {
  const controls = await page.locator('.world-controls').boundingBox()
  expect(controls).not.toBeNull()
  expect(controls!.y + controls!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
}

test('@responsive @cross-browser 書庫の壁・棚・閲覧台と地図の物体名が一致する', async ({
  page,
}) => {
  await seedWorld(page, 'database-archive', 15, 5)
  const map = page.locator('.world-viewport')
  await expect(map.locator('.terrain-wall')).not.toHaveCount(0)
  await expect(map.locator('.terrain-house, .terrain-mountain, .terrain-training')).toHaveCount(0)
  await expect(map.locator('[data-world-furniture="bookshelf"]')).toHaveCount(2)
  await expect(map.locator('[data-scenery-object="lectern"]')).toBeVisible()
  await page.getByRole('button', { name: '上へ移動', exact: true }).click()
  await expect(map).toHaveAttribute('data-world-y', '5')
  await expect(page.getByRole('button', { name: '台帳を調べる', exact: true })).toBeEnabled()
  await expectControlsInsideScreen(page)

  await page.getByRole('button', { name: 'メニューを開く' }).click()
  await selectPauseTab(page.getByRole('dialog', { name: 'メニュー', exact: true }), 'マップ')
  const atlas = page.getByRole('region', { name: 'ワールドマップ' })
  await expect(atlas.locator('[data-atlas-landmark="archive"]')).toHaveAttribute(
    'aria-label',
    '台帳の閲覧台',
  )
  await expect(atlas.locator('[data-atlas-landmark="training"]')).toHaveCount(0)
  await expect(atlas.locator('[data-atlas-landmark="exit"]')).toHaveAttribute(
    'aria-label',
    '上り階段',
  )
})

test('@responsive @cross-browser 地下への階段を往復でき、同行者は階段を隠さない', async ({
  page,
}) => {
  await seedWorld(page, 'ts-frontier', 27, 15)
  await expect(page.locator('[data-scenery-object="stairs-down"]')).toBeVisible()
  await page.getByRole('button', { name: '下へ移動', exact: true }).click()
  await page.getByRole('button', { name: '地下書庫へ入る', exact: true }).click()
  const map = page.locator('.world-viewport')
  await expect(map).toHaveAttribute('data-world-map', 'database-archive')
  await expect(page.locator('[data-scenery-object="stairs-up"]')).toBeVisible()
  const follower = page.locator('.world-follower-sprite')
  const position = await follower.evaluate((element) => ({
    x: element.getAttribute('data-world-x'),
    y: element.getAttribute('data-world-y'),
  }))
  expect(position).not.toEqual({ x: '9', y: '13' })
  await page.getByRole('button', { name: '下へ移動', exact: true }).click()
  await page.getByRole('button', { name: 'TypeScript辺境へ入る', exact: true }).click()
  await expect(map).toHaveAttribute('data-world-map', 'ts-frontier')
  await expectControlsInsideScreen(page)
})

test('@responsive 川を渡れる範囲と一つの丸太の絵が通常の森・深層の森で一致する', async ({
  page,
}) => {
  for (const [mapId, x, y] of [
    ['js-forest', 32, 12],
    ['js-forest', 30, 31],
    ['js-deep-forest', 42, 14],
    ['js-deep-forest', 40, 33],
  ] as const) {
    await seedWorld(page, mapId, x, y)
    const bridge = page.locator('[data-world-bridge="log"]')
    await expect(bridge).toHaveCount(1)
    const cell = page.locator(`.world-tile[data-world-x="${x}"][data-world-y="${y}"]`)
    await expect(cell).toHaveClass(/terrain-log-crossing/)
    const bridgeBounds = await bridge.boundingBox()
    const cellBounds = await cell.boundingBox()
    expect(Math.abs(bridgeBounds!.x - cellBounds!.x)).toBeLessThan(1)
    expect(Math.abs(bridgeBounds!.width - cellBounds!.width * 2)).toBeLessThan(1)
    await page.getByRole('button', { name: '右へ移動', exact: true }).click()
    await expect(page.locator('.world-viewport')).toHaveAttribute('data-world-x', String(x + 1))
  }
})

test('@responsive 新しい村入口は南の柵の開口部にあり、往復とreloadで現在地を保持する', async ({
  page,
}) => {
  await seedWorld(page, 'js-village', 10, 23)
  const map = page.locator('.world-viewport')
  await expect(page.locator('[data-scenery-object="village-exit"]')).toBeVisible()
  await page.keyboard.press('ArrowUp')
  await expect(map).toHaveAttribute('data-world-y', '22')
  await page.keyboard.press('ArrowDown')
  await expect(map).toHaveAttribute('data-world-y', '23')
  await page.keyboard.press('ArrowDown')
  await expect(map).toHaveAttribute('data-world-y', '23')
  await page.getByRole('button', { name: 'JavaScript草原へ入る', exact: true }).click()
  await expect(map).toHaveAttribute('data-world-map', 'overworld')
  await page.getByRole('button', { name: 'グリーンフィールド村へ入る', exact: true }).click()
  await expect(map).toHaveAttribute('data-world-map', 'js-village')
  await expect(map).toHaveAttribute('data-world-y', '23')
  await page.reload()
  await expect(map).toHaveAttribute('data-world-y', '23')
  await expectControlsInsideScreen(page)
})

test('@responsive 集落の宿・補給所は一軒の建物の正面で操作できる', async ({ page }) => {
  for (const [id, x, action, dialog] of [
    ['settlement-inn', 6, '宿で休む', '宿'],
    ['settlement-shop', 16, '道具屋を見る', '道具屋'],
  ] as const) {
    await seedWorld(page, 'js-forest-settlement', x, 14)
    const building = page.locator(`[data-world-building="${id}"]`)
    await expect(building).toHaveCount(1)
    await expect(building.locator('[data-building-roof]')).toHaveCount(1)
    await expect(building.locator('[data-building-entrance]')).toBeVisible()
    await page.getByRole('button', { name: '上へ移動', exact: true }).click()
    await expect(page.locator('.world-viewport')).toHaveAttribute('data-world-y', '14')
    await page.getByRole('button', { name: action, exact: true }).click()
    await expect(page.getByRole('dialog', { name: dialog, exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expectControlsInsideScreen(page)
  }
})
