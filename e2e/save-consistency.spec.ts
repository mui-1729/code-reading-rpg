import { expect, test, type Page } from '@playwright/test'
import { readStoredGameState } from './storedGameState'

async function seedLegacySave(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem(
      'code-reading-rpg:player-progress',
      JSON.stringify({
        version: 4,
        progress: {
          exp: 0,
          gold: 42,
          inventory: { patchKit: 1 },
          clearedStageIds: [],
          clearedAreaIds: [],
          completedSideQuestIds: [],
          unlockedStageIds: [7],
          unlockedSkillIds: ['trace', 'pulse', 'nova'],
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
          worldMapId: 'ts-frontier',
          worldPosition: { x: 8, y: 8 },
          stepsSinceEncounter: 8,
          encounterCount: 0,
          currentHp: 61,
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
  })
  await page.goto('/world')
}

test('legacy split saveを単一revisionへ移行しlocked mapをnormalizeする', async ({ page }) => {
  await seedLegacySave(page)
  await expect(page.getByLabel('ワールドマップ')).toBeVisible()
  await expect
    .poll(() => readStoredGameState(page))
    .toMatchObject({
      version: 2,
      progress: { progress: { gold: 42, inventory: { patchKit: 1 } } },
      rpg: {
        version: 6,
        state: { worldMapId: 'overworld', currentHp: 61, partyMemberIds: ['byte'] },
      },
    })
  await expect
    .poll(() =>
      page.evaluate(() => [
        localStorage.getItem('code-reading-rpg:player-progress'),
        localStorage.getItem('code-reading-rpg:rpg-state'),
      ]),
    )
    .toEqual([null, null])
})

test('storage eventで別tabの新revisionを取り込み、次の移動で巻き戻さない', async ({
  page,
  context,
}) => {
  await seedLegacySave(page)
  const second = await context.newPage()
  await second.goto('/world')
  await second.getByRole('button', { name: 'メニューを開く' }).click()
  const menu = second.getByRole('dialog', { name: 'メニュー' })
  await expect(menu.getByText('42 G', { exact: true })).toBeVisible()

  const incomingRevision = await page.evaluate(() => {
    const key = 'code-reading-rpg:game-state'
    const snapshot = JSON.parse(localStorage.getItem(key) ?? 'null')
    snapshot.revision += 1
    snapshot.progress.progress.gold = 77
    snapshot.progress.progress.clearedStageIds = [3]
    snapshot.progress.progress.clearedAreaIds = ['javascript']
    snapshot.rpg.state.ownedEquipmentIds.push('branch-saber')
    localStorage.setItem(key, JSON.stringify(snapshot))
    return snapshot.revision
  })
  await expect(menu.getByText('77 G', { exact: true })).toBeVisible()
  const settledRevision = await second.evaluate(() => new Promise<number>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve(JSON.parse(localStorage.getItem('code-reading-rpg:game-state') ?? 'null').revision)
    }))
  }))
  expect(settledRevision).toBe(incomingRevision)
  await second.keyboard.press('Escape')
  await second.keyboard.press('ArrowRight')
  await expect
    .poll(() => readStoredGameState(second))
    .toMatchObject({
      progress: { progress: { gold: 77 } },
      rpg: { state: { worldPosition: { x: 21, y: 14 } } },
    })
})
