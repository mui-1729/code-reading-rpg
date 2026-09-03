import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(page: Page) {
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
}

test('pointer leaveを挟んだ1tapでも左右D-Padは1tileだけ進む', async ({ page }) => {
  await seedWorld(page)
  const viewport = page.locator('.world-viewport')
  const right = page.getByRole('button', { name: '右へ移動' })

  await right.dispatchEvent('pointerdown', { button: 0, pointerType: 'touch', pointerId: 1 })
  await right.dispatchEvent('pointerleave', { pointerType: 'touch', pointerId: 1 })
  await right.dispatchEvent('click', { detail: 1 })
  await expect(viewport).toHaveAttribute('data-world-x', '21')

  const left = page.getByRole('button', { name: '左へ移動' })
  await left.dispatchEvent('pointerdown', { button: 0, pointerType: 'touch', pointerId: 2 })
  await left.dispatchEvent('pointercancel', { pointerType: 'touch', pointerId: 2 })
  await left.dispatchEvent('click', { detail: 1 })
  await expect(viewport).toHaveAttribute('data-world-x', '20')
})

test('keyboard activationはpointer経路なしでも1tile進む', async ({ page }) => {
  await seedWorld(page)
  const viewport = page.locator('.world-viewport')
  const right = page.getByRole('button', { name: '右へ移動' })

  await right.focus()
  await right.press('Enter')
  await expect(viewport).toHaveAttribute('data-world-x', '21')
})
