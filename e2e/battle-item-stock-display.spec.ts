import { expect, test, type Page } from '@playwright/test'
import { JS_SECOND_INCIDENT_PREREQS } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedBattle(page: Page, patchKitCount: number) {
  await page.addInitScript(
    ({ progressKey, rpgKey, tutorialKey, patchKitCount: seededPatchKitCount, clearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 200,
          inventory: { patchKit: seededPatchKitCount },
          clearedStageIds,
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [7],
          unlockedSkillIds: ['trace', 'pulse', 'nova'],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 5,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: [],
          worldMapId: 'overworld',
          worldPosition: { x: 20, y: 14 },
          stepsSinceEncounter: 8,
          encounterCount: 0,
          currentHp: 108,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      patchKitCount,
      clearedStageIds: [...JS_SECOND_INCIDENT_PREREQS, 2],
    },
  )
}

test('@responsive zero-stock items keep their slot and show ×0 without a no-stock label', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedBattle(page, 0)
  await page.goto('/javascript/battle/2?seed=item-stock-zero&returnTo=%2Fworld')
  await page.waitForTimeout(600)

  const root = page.getByRole('group', { name: '戦闘コマンド' })
  await root.getByRole('button', { name: 'アイテム', exact: true }).dispatchEvent('click')

  const itemMenu = page.getByRole('group', { name: 'アイテム選択' })
  const patchKit = itemMenu.locator('[data-item-id="patch-kit"]')
  await expect(patchKit).toBeVisible()
  await expect(patchKit).toHaveAttribute('data-item-count', '0')
  await expect(patchKit.getByLabel('0個所持')).toHaveText('×0')
  await expect(itemMenu).not.toContainText('所持なし')
})
