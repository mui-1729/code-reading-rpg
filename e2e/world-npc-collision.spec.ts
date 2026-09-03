import { expect, test } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

test('Playerはstatic NPCのtileへ侵入せず隣接位置で止まる', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey }) => {
      localStorage.clear()
      localStorage.setItem(progressKey, JSON.stringify({
        version: 4,
        progress: {
          exp: 12,
          gold: 20,
          inventory: { patchKit: 0 },
          clearedStageIds: [1],
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [1, 7],
          unlockedSkillIds: ['trace', 'pulse', 'nova'],
        },
      }))
      localStorage.setItem(rpgKey, JSON.stringify({
        version: 5,
        state: {
          equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
          ownedEquipmentIds: ['training-blade', 'traveler-coat'],
          partyMemberIds: ['byte'],
          partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
          worldMapId: 'js-village',
          worldPosition: { x: 8, y: 9 },
          stepsSinceEncounter: 3,
          encounterCount: 0,
          currentHp: 108,
          openedTreasureIds: [],
        },
      }))
      localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }))
    },
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )

  await page.goto('/world')

  const player = page.locator('.world-player-sprite')
  const resident = page.locator('[data-world-npc="village-child"]')
  await expect(player).toHaveAttribute('data-world-x', '8')
  await expect(player).toHaveAttribute('data-world-y', '9')
  await expect(resident).toHaveAttribute('data-world-x', '8')
  await expect(resident).toHaveAttribute('data-world-y', '8')

  await page.getByRole('button', { name: '上へ移動' }).click()

  await expect(player).toHaveAttribute('data-world-x', '8')
  await expect(player).toHaveAttribute('data-world-y', '9')
  await expect(resident).toHaveAttribute('data-world-y', '8')

  const positions = await page.evaluate(() => {
    const playerElement = document.querySelector<HTMLElement>('.world-player-sprite')
    const npcElement = document.querySelector<HTMLElement>('[data-world-npc="village-child"]')
    return {
      player: [playerElement?.dataset.worldX, playerElement?.dataset.worldY],
      npc: [npcElement?.dataset.worldX, npcElement?.dataset.worldY],
    }
  })
  expect(positions.player).not.toEqual(positions.npc)
})
