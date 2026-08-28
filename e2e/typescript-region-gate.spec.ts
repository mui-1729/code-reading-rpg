import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(
  page: Page,
  options: { clearedStageIds?: number[]; worldPosition?: { x: number; y: number } } = {},
) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds, worldPosition }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds,
            clearedAreaIds: clearedStageIds.includes(3) ? ['javascript'] : [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 4],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
          },
        }),
      )
      localStorage.setItem(
        rpgKey,
        JSON.stringify({
          version: 4,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId: 'overworld',
            worldPosition,
            stepsSinceEncounter: 8,
            encounterCount: 0,
            currentHp: 108,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      clearedStageIds: options.clearedStageIds ?? [],
      worldPosition: options.worldPosition ?? { x: 22, y: 14 },
    },
  )
  await page.goto('/world')
}

const viewport = (page: Page) => page.getByLabel('Open world map')

test('JavaScript未clearではTypeScript地方へ進めず理由を表示する', async ({ page }) => {
  await seedWorld(page)

  await page.getByRole('button', { name: 'Move right' }).click()

  await expect(viewport(page)).toHaveAttribute('data-world-x', '22')
  await expect(page.getByRole('status')).toContainText('TYPESCRIPT FRONTIER LOCKED')
  await expect(page.getByRole('status')).toContainText('Final Boss')
})

test('Battle 3 clear後はTypeScript地方へ進める', async ({ page }) => {
  await seedWorld(page, { clearedStageIds: [3] })

  await page.getByRole('button', { name: 'Move right' }).click()

  await expect(viewport(page)).toHaveAttribute('data-world-x', '23')
  await expect(page.getByText('TYPESCRIPT FRONTIER LOCKED')).toHaveCount(0)
})

test('既にTypeScript側にいるold saveは位置を壊さずreloadできる', async ({ page }) => {
  await seedWorld(page, { worldPosition: { x: 30, y: 14 } })

  await expect(viewport(page)).toHaveAttribute('data-world-x', '30')

  await page.reload()
  await expect(viewport(page)).toHaveAttribute('data-world-x', '30')
})
