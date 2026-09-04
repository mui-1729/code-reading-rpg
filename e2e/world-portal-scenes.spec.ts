import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(
  page: Page,
  mapId: 'overworld' | 'js-village' | 'js-forest' | 'js-deep-forest',
  position: { x: number; y: number },
  clearedStageIds: number[],
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, mapId, position, clearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 0,
          inventory: { patchKit: 0 },
          clearedStageIds,
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 7, 8, 9, 10, 11, 12, 13, 14],
          unlockedSkillIds: ['trace', 'pulse', 'nova'],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 6,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: ['byte'],
          partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
          worldMapId: mapId,
          worldPosition: position,
          stepsSinceEncounter: 0,
          encounterCount: 0,
          currentHp: 108,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY, mapId, position, clearedStageIds },
  )
  await page.goto('/world')
}

async function portalSceneKind(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--portal-scene-kind').trim(),
  )
}

test('Overworldの森入口は文字札ではなく木のarchとして見え、踏み込むと森へ遷移する', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedWorld(page, 'overworld', { x: 34, y: 33 }, [1, 7, 8, 9])

  const entrance = '.world-tile[data-world-x="34"][data-world-y="34"]'
  await expect(page.locator(entrance)).toBeVisible()
  expect(await portalSceneKind(page, entrance)).toBe('forest-arch')
  const arch = await page.locator(entrance).evaluate((element) => {
    const style = getComputedStyle(element, '::before')
    return { content: style.content, borderTopWidth: parseFloat(style.borderTopWidth) }
  })
  expect(arch.content).not.toBe('none')
  expect(arch.borderTopWidth).toBeGreaterThan(0)

  await page.getByRole('button', { name: '下へ移動' }).click()
  await expect(page.locator('.world-viewport')).toHaveAttribute('data-world-map', 'js-forest')
})

test('村入口は木柵門、Village出口は草原へ抜ける門として別sceneになる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedWorld(page, 'overworld', { x: 10, y: 21 }, [1])

  const villageGate = '.world-tile[data-world-x="10"][data-world-y="22"]'
  expect(await portalSceneKind(page, villageGate)).toBe('village-gate')
  await expect(page.locator(`${villageGate} .village-object`)).toHaveCSS('font-size', '0px')
  await expect(page.getByRole('button', { name: 'グリーンフィールド村へ入る' })).toBeEnabled()

  await seedWorld(page, 'js-village', { x: 10, y: 13 }, [1])
  const outGate = '.world-tile[data-world-x="10"][data-world-y="14"]'
  expect(await portalSceneKind(page, outGate)).toBe('village-outgate')
  await expect(page.locator(`${outGate} .exit-object`)).toHaveCSS('font-size', '0px')

  await page.getByRole('button', { name: '下へ移動' }).click()
  await expect(page.locator('.world-viewport')).toHaveAttribute('data-world-map', 'overworld')
  await expect(page.locator('.world-viewport')).toHaveAttribute('data-world-x', '10')
  await expect(page.locator('.world-viewport')).toHaveAttribute('data-world-y', '21')
})

test('ForestからDeep Forestは太い根のarchになりgeneric出口表示へ依存しない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedWorld(page, 'js-forest', { x: 2, y: 10 }, [1, 7, 8, 9, 10, 11, 12, 13, 14])

  const deepGate = '.world-tile[data-world-x="1"][data-world-y="10"]'
  await expect(page.locator(deepGate)).toBeVisible()
  expect(await portalSceneKind(page, deepGate)).toBe('deep-forest-root-arch')
  await expect(page.locator(`${deepGate} .exit-object`)).toHaveCSS('font-size', '0px')

  await page.getByRole('button', { name: '左へ移動' }).click()
  await expect(page.locator('.world-viewport')).toHaveAttribute('data-world-map', 'js-deep-forest')
})
