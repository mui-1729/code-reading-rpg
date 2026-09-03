import { expect, test, type Page } from '@playwright/test'
import { JS_MIDBOSS_PREREQS } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedMidbossReady(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 96,
            gold: 24,
            inventory: { patchKit: 0 },
            clearedStageIds,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [7],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
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
            worldMapId: 'js-forest',
            worldPosition: { x: 6, y: 10 },
            stepsSinceEncounter: 8,
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
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      clearedStageIds: [...JS_MIDBOSS_PREREQS],
    },
  )
}

test('STANDARD等の内部roleを本文に出さず、強敵badgeでもcard高さを変えない', async ({ page }) => {
  await seedMidbossReady(page)
  await page.goto('/javascript/battle/13?seed=midboss%3Ajs-forest%3A1&returnTo=%2Fworld')

  const story = page.getByRole('dialog')
  if (await story.isVisible()) {
    const skip = story.getByRole('button', { name: /SKIP|スキップ/ })
    if (await skip.isVisible()) await skip.click()
  }

  const standardCards = page.locator('.enemy-card[data-enemy-role="standard"]')
  const standard = standardCards.first()
  const elite = page.locator('.enemy-card[data-enemy-role="elite"]')
  await expect(standardCards).toHaveCount(2)
  await expect(standard).toBeVisible()
  await expect(elite).toBeVisible()

  await expect(standard.locator('.enemy-role')).toBeHidden()
  await expect(elite.locator('.enemy-role')).toBeHidden()
  expect(await standard.evaluate((element) => element.innerText)).not.toMatch(/\bstandard\b/i)
  expect(await elite.evaluate((element) => element.innerText)).not.toMatch(/\belite\b/i)

  const eliteBadge = await elite.evaluate((element) => getComputedStyle(element, '::before').content)
  expect(eliteBadge).toContain('強敵')

  const [standardBox, eliteBox] = await Promise.all([standard.boundingBox(), elite.boundingBox()])
  expect(standardBox).not.toBeNull()
  expect(eliteBox).not.toBeNull()
  if (!standardBox || !eliteBox) return
  expect(Math.abs(standardBox.height - eliteBox.height)).toBeLessThanOrEqual(1)
})
