import { expect, test } from '@playwright/test'
import { selectPauseTab } from './pause-menu-helpers'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('ワールドマップは100%を全体fit基準にして現在倍率だけを表示する', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds: [],
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [],
            unlockedSkillIds: [],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 5,
          state: {
            equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId: 'overworld',
            worldPosition: { x: 20, y: 14 },
            stepsSinceEncounter: 0,
            encounterCount: 0,
            currentHp: 100,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )
  await page.goto('/world')
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const menu = page.getByRole('dialog', { name: 'メニュー' })
  await selectPauseTab(menu, 'マップ')

  const atlas = page.getByRole('region', { name: 'ワールドマップ' })
  const zoomValue = atlas.locator('.atlas-zoom-value')
  const zoomOut = atlas.getByRole('button', { name: 'ワールドマップを縮小' })
  const zoomIn = atlas.getByRole('button', { name: 'ワールドマップを拡大' })

  await expect(atlas).toHaveAttribute('data-atlas-zoom', '100')
  await expect(zoomValue).toHaveText('100%')
  await expect(zoomOut).toBeDisabled()
  await expect(atlas.getByRole('button', { name: '全体', exact: true })).toHaveCount(0)
  await expect(atlas.getByRole('button', { name: '100%', exact: true })).toHaveCount(0)

  const fitAt100 = await atlas.evaluate((element) => {
    const scrollport = element.querySelector<HTMLElement>('.atlas-scrollport')
    const canvas = element.querySelector<HTMLElement>('.atlas-detail-canvas')
    if (!scrollport || !canvas) return false
    return canvas.getBoundingClientRect().width <= scrollport.getBoundingClientRect().width + 1
  })
  expect(fitAt100).toBe(true)

  await zoomIn.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '125')
  await expect(zoomValue).toHaveText('125%')
  await expect(zoomOut).toBeEnabled()

  await zoomIn.click()
  await expect(atlas).toHaveAttribute('data-atlas-zoom', '150')
  await expect(zoomValue).toHaveText('150%')
  await expect(zoomIn).toBeDisabled()

  await zoomOut.click()
  await expect(zoomValue).toHaveText('125%')
  await zoomOut.click()
  await expect(zoomValue).toHaveText('100%')
  await expect(zoomOut).toBeDisabled()
})