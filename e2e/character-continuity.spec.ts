import { expect, test, type Page } from '@playwright/test'

const TUTORIAL_KEY = 'code-reading-rpg:tutorial'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const GAME_STATE_KEY = 'code-reading-rpg:game-state'

async function seedState(
  page: Page,
  options: {
    clearedStageIds: number[]
    clearedAreaIds?: string[]
    mapId: 'js-village' | 'ts-frontier'
    position: { x: number; y: number }
  },
) {
  await page.goto('/')
  await page.evaluate(
    ({ tutorialKey, progressKey, rpgKey, clearedStageIds, clearedAreaIds, mapId, position }) => {
      localStorage.clear()
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 100,
            inventory: { patchKit: 0 },
            clearedStageIds,
            clearedAreaIds,
            completedSideQuestIds: [],
            unlockedStageIds: [1, 4, 5, 6, 7, 8, 9],
            unlockedSkillIds: ['trace', 'pulse', 'nova', 'ts-scan', 'ts-guard', 'ts-label'],
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
            partyMemberIds: ['byte'],
            worldMapId: mapId,
            worldPosition: position,
            stepsSinceEncounter: 8,
            encounterCount: 0,
            currentHp: 108,
            openedTreasureIds: [],
          },
        }),
      )
    },
    {
      tutorialKey: TUTORIAL_KEY,
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      clearedStageIds: options.clearedStageIds,
      clearedAreaIds: options.clearedAreaIds ?? [],
      mapId: options.mapId,
      position: options.position,
    },
  )
  await page.goto('/world')
}

test('Opening初登場でADA/BYTEのportraitと名前を同時に結びつける', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: 'START' }).click()
  await expect(page.getByText('LEAD ADA', { exact: true })).toBeVisible()
  await expect(page.getByAltText('LEAD ADA portrait')).toBeVisible()

  await page.getByRole('button', { name: 'NEXT ▶' }).click()
  await expect(page.getByText('BYTE', { exact: true })).toBeVisible()
  await expect(page.getByAltText('BYTE portrait')).toBeVisible()
  await expect(page.getByText(/僕はBYTE/)).toBeVisible()
})

test('Training完了後もVillageでMIOへ戻って会話できる', async ({ page }) => {
  await seedState(page, {
    clearedStageIds: [1, 7, 8, 9],
    mapId: 'js-village',
    position: { x: 12, y: 8 },
  })

  const talk = page.getByRole('button', { name: 'INTERACT · TALK TO TRAINER MIO' })
  await expect(talk).toBeEnabled()
  await talk.click()

  const conversation = page.getByRole('dialog', { name: 'TRAINER MIO conversation' })
  await expect(conversation).toBeVisible()
  await expect(conversation).toContainText('もうTRAINへ戻らなくていい')
  await expect(conversation).toContainText('森で、自分の読み方を使う番')
})

test('Villageのordinary residentはmain progression外で生活の会話を持つ', async ({ page }) => {
  await seedState(page, {
    clearedStageIds: [1, 7, 8, 9],
    mapId: 'js-village',
    position: { x: 3, y: 4 },
  })

  const talk = page.getByRole('button', { name: 'INTERACT · TALK TO VILLAGE CHILD' })
  await expect(talk).toBeEnabled()
  await talk.click()

  const conversation = page.getByRole('dialog', { name: 'VILLAGE CHILD conversation' })
  await expect(conversation).toBeVisible()
  await expect(conversation).toContainText('MIOは怖くないよ')
  await expect(conversation).not.toContainText('find()')
})

test('TypeScriptではWARDEN NPCとBattle 6のFrontier Compilerを別objectとして扱う', async ({ page }) => {
  await seedState(page, {
    clearedStageIds: [3, 4, 5],
    clearedAreaIds: ['javascript'],
    mapId: 'ts-frontier',
    position: { x: 29, y: 6 },
  })

  const talk = page.getByRole('button', { name: 'INTERACT · TALK TO TYPE WARDEN' })
  await expect(talk).toBeEnabled()
  await talk.click()
  const conversation = page.getByRole('dialog', { name: 'TYPE WARDEN conversation' })
  await expect(conversation).toContainText('Frontier Compiler')
  await conversation.getByRole('button', { name: '▶ NEXT' }).click()
  await expect(conversation).toContainText('私はここに残って境界を支える')
  await conversation.getByRole('button', { name: 'CLOSE' }).click()

  await page.evaluate((key) => {
    const stored = JSON.parse(localStorage.getItem(key) ?? 'null')
    stored.rpg.state.worldPosition = { x: 27, y: 5 }
    stored.revision += 1
    localStorage.setItem(key, JSON.stringify(stored))
  }, GAME_STATE_KEY)
  await page.reload()

  await expect(page.getByLabel('Frontier Compiler Boss')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'INTERACT · CHALLENGE FRONTIER COMPILER' }),
  ).toBeEnabled()
})
