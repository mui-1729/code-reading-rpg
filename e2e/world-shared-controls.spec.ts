import { expect, test } from '@playwright/test'
import { JS_COMPLETE } from './canonical-progress-fixtures'

for (const region of [
  { mapId: 'overworld', position: { x: 20, y: 14 } },
  { mapId: 'ts-frontier', position: { x: 2, y: 10 } },
]) {
  test(`@cross-browser ${region.mapId}: shared keyboard respects native controls and Pause`, async ({
    page,
  }) => {
    await page.addInitScript(
      ({ region, cleared }) => {
        localStorage.clear()
        localStorage.setItem(
          'code-reading-rpg:player-progress',
          JSON.stringify({
            version: 4,
            progress: {
              exp: 0,
              gold: 0,
              inventory: { patchKit: 0 },
              clearedStageIds: cleared,
              clearedAreaIds: ['javascript'],
              unlockedStageIds: [7],
              unlockedSkillIds: ['trace', 'pulse', 'nova'],
              completedSideQuestIds: [],
            },
          }),
        )
        localStorage.setItem(
          'code-reading-rpg:rpg-state',
          JSON.stringify({
            version: 4,
            state: {
              equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
              ownedEquipmentIds: ['training-blade', 'traveler-coat'],
              partyMemberIds: ['byte'],
              partyEquipment: {},
              worldMapId: region.mapId,
              worldPosition: region.position,
              stepsSinceEncounter: 0,
              encounterCount: 0,
              currentHp: 108,
              openedTreasureIds: [],
            },
          }),
        )
        localStorage.setItem(
          'code-reading-rpg:tutorial',
          JSON.stringify({
            version: 1,
            status: 'skipped',
            phase: 'battle',
          }),
        )
      },
      { region, cleared: [...JS_COMPLETE] },
    )
    await page.goto('/world')
    const player = page.locator('.world-player-sprite')
    const follower = page.locator('.world-follower-sprite')
    await expect(player).toHaveAttribute('data-world-x', String(region.position.x))
    await expect(page.locator('.world-tile')).toHaveCount(99)

    // Enter activates the focused D-Pad exactly once, not the field INTERACT action.
    await page.getByRole('button', { name: 'Move right', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(player).toHaveAttribute('data-world-x', String(region.position.x + 1))
    await expect(follower).toHaveAttribute('data-world-x', String(region.position.x))
    await expect(follower).toHaveAttribute('data-world-y', String(region.position.y))

    // Direction keys remain usable after clicking/focusing a D-Pad button.
    await page.keyboard.press('ArrowRight')
    await expect(player).toHaveAttribute('data-world-x', String(region.position.x + 2))
    await expect(follower).toHaveAttribute('data-world-x', String(region.position.x + 1))

    await page.getByRole('button', { name: 'メニューを開く', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: 'メニュー' })).toBeVisible()
    await page.keyboard.press('ArrowLeft')
    await expect(player).toHaveAttribute('data-world-x', String(region.position.x + 2))
  })
}
