import { expect, test, type Page } from '@playwright/test'
import { JS_BATTLE_1_PREREQS } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedPixelParty(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, clearedStageIds }) => {
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
          version: 3,
          state: {
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: ['byte'],
            partyEquipment: {
              byte: { weapon: null, armor: null, accessory: null },
            },
            worldPosition: { x: 20, y: 11 },
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
      clearedStageIds: [...JS_BATTLE_1_PREREQS],
    },
  )
}

test('FieldでCODE KNIGHTと加入済みBYTEをpixel sprite表示する', async ({ page }) => {
  await seedPixelParty(page)
  await page.goto('/world')

  await expect(page.locator('.world-player-pixel')).toHaveAttribute(
    'src',
    /code-knight-field\.svg/,
  )
  await expect(page.locator('.world-follower-pixel')).toHaveAttribute('src', /byte-field\.svg/)
})

test('Battleで主人公・装備武器・BYTEをpixel sprite表示する', async ({ page }) => {
  await seedPixelParty(page)
  await page.goto('/javascript/battle/1?seed=pixel-art-e2e&returnTo=%2Fworld')

  await expect(page.locator('.battle-character-pixel')).toHaveAttribute(
    'src',
    /code-knight-battle\.svg/,
  )
  await expect(page.locator('.battle-weapon-pixel')).toHaveAttribute(
    'src',
    /training-blade\.svg/,
  )
  await expect(page.locator('.battle-party-member img')).toHaveAttribute('src', /byte-battle\.svg/)
})
