import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(
  page: Page,
  mapId: 'overworld' | 'js-forest' | 'ts-frontier',
  position: { x: number; y: number },
  clearedStageIds: number[],
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, mapId, position, clearedStageIds }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 100,
          inventory: { patchKit: 0 },
          clearedStageIds,
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
          unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
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

test('@responsive Village portalは旧mapを覆ってからstateを切り替え、新mapを開く', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedWorld(page, 'overworld', { x: 10, y: 21 }, [1])

  const viewport = page.locator('.world-viewport')
  const transition = page.locator('.world-map-transition')
  const enter = page.getByRole('button', { name: 'グリーンフィールド村へ入る' })

  await enter.click()

  await expect(transition).toHaveAttribute('data-world-transition-phase', 'covering')
  await expect(transition).toHaveAttribute('data-world-transition-from', 'overworld')
  await expect(transition).toHaveAttribute('data-world-transition-to', 'js-village')
  await expect(viewport).toHaveAttribute('data-world-map', 'overworld')
  await expect(page.locator('body')).toHaveAttribute('data-world-transitioning', 'true')
  await expect(page.getByRole('button', { name: 'メニューを開く' })).toBeHidden()

  await page.getByRole('button', { name: '下へ移動' }).click({ force: true })

  await expect(transition).toHaveAttribute('data-world-transition-phase', 'revealing')
  await expect(viewport).toHaveAttribute('data-world-map', 'js-village')
  await expect(viewport).toHaveAttribute('data-world-x', '10')
  await expect(viewport).toHaveAttribute('data-world-y', '12')
  await expect(transition).toHaveCount(0, { timeout: 1_000 })
  await expect(page.locator('body')).not.toHaveAttribute('data-world-transitioning', 'true')
  await expect(page.getByRole('button', { name: 'メニューを開く' })).toBeVisible()
})

test('歩いて跨ぐForest portalも同じtransition sequenceを使う', async ({ page }) => {
  await seedWorld(page, 'js-forest', { x: 2, y: 10 }, [1, 7, 8, 9, 10, 11, 12, 13, 14])

  const viewport = page.locator('.world-viewport')
  const transition = page.locator('.world-map-transition')
  await page.getByRole('button', { name: '左へ移動' }).click()

  await expect(transition).toHaveAttribute('data-world-transition-phase', 'covering')
  await expect(viewport).toHaveAttribute('data-world-map', 'js-forest')
  await expect(transition).toHaveAttribute('data-world-transition-phase', 'revealing')
  await expect(viewport).toHaveAttribute('data-world-map', 'js-deep-forest')
  await expect(transition).toHaveCount(0, { timeout: 1_000 })
})

test('TypeScript辺境から中央Hubへ戻る境界も共通transition sequenceを使う', async ({ page }) => {
  await seedWorld(page, 'ts-frontier', { x: 2, y: 10 }, [1, 3, 4, 5])

  const viewport = page.locator('.world-viewport')
  const transition = page.locator('.world-map-transition')
  await expect(viewport).toHaveAttribute('data-world-map', 'ts-frontier')
  await page.getByRole('button', { name: '左へ移動' }).click()

  await expect(transition).toHaveAttribute('data-world-transition-phase', 'covering')
  await expect(transition).toHaveAttribute('data-world-transition-from', 'ts-frontier')
  await expect(transition).toHaveAttribute('data-world-transition-to', 'overworld')
  await expect(transition).toHaveAttribute('data-world-transition-phase', 'revealing')
  await expect(viewport).toHaveAttribute('data-world-map', 'overworld')
  await expect(viewport).toHaveAttribute('data-world-x', '61')
  await expect(viewport).toHaveAttribute('data-world-y', '14')
  await expect(transition).toHaveCount(0, { timeout: 1_000 })
})

test('prefers-reduced-motionではvortexを省略して短いfadeへ落とす', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedWorld(page, 'overworld', { x: 10, y: 21 }, [1])

  const transition = page.locator('.world-map-transition')
  const enter = page.getByRole('button', { name: 'グリーンフィールド村へ入る' })
  await Promise.all([
    transition.waitFor({ state: 'attached' }),
    enter.click(),
  ])

  await expect(transition.locator('.world-map-transition-vortex')).toHaveCSS('display', 'none')
  await expect(page.locator('.world-viewport')).toHaveAttribute('data-world-map', 'js-village', { timeout: 500 })
  await expect(transition).toHaveCount(0, { timeout: 500 })
})
