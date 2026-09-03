import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(
  page: Page,
  options: {
    mapId: 'js-forest' | 'js-deep-forest'
    position: { x: number; y: number }
    clearedStageIds: number[]
    unlockedStageIds: number[]
  },
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, options: seed }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 180,
            gold: 60,
            inventory: { patchKit: 1 },
            clearedStageIds: seed.clearedStageIds,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: seed.unlockedStageIds,
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'viper', 'link', 'fork'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 4,
          state: {
            equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: ['byte'],
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
            worldMapId: seed.mapId,
            worldPosition: seed.position,
            stepsSinceEncounter: 0,
            encounterCount: 4,
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
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY, options },
  )
  await page.goto('/world')
}

test('@responsive Forestでは固定Battle 11の前に分岐痕が見え、踏み込むとそのBattleが始まる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedWorld(page, {
    mapId: 'js-forest',
    position: { x: 18, y: 10 },
    clearedStageIds: [1, 7, 8, 9, 10],
    unlockedStageIds: [1, 7, 8, 9, 10, 11],
  })

  const landmark = page.locator('[data-progression-battle="11"]')
  await expect(landmark).toBeVisible()
  await expect(landmark).toHaveText('分岐痕')
  await expect(landmark).toHaveAttribute('aria-label', '二手に割れた異変の痕跡')

  await page.getByRole('button', { name: '左へ移動' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/11/)
})

test('Deep Forestでも次の固定Battle 16の場所を変換痕として先に読める', async ({ page }) => {
  await seedWorld(page, {
    mapId: 'js-deep-forest',
    position: { x: 25, y: 10 },
    clearedStageIds: [1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15],
    unlockedStageIds: [1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16],
  })

  const landmark = page.locator('[data-progression-battle="16"]')
  await expect(landmark).toBeVisible()
  await expect(landmark).toHaveText('変換痕')
  await expect(landmark).toHaveAttribute('aria-label', '形の違う記録片が散る場所')

  await page.getByRole('button', { name: '左へ移動' }).click()
  await expect(page).toHaveURL(/\/javascript\/battle\/16/)
})
