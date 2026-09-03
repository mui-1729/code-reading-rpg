import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedHub(page: Page) {
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
            unlockedStageIds: [1],
            unlockedSkillIds: ['trace', 'pulse', 'nova'],
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
    { progressKey: PROGRESS_KEY, rpgKey: RPG_KEY, tutorialKey: TUTORIAL_KEY },
  )
  await page.goto('/world')
  await expect(page.getByLabel('ワールドマップ')).toHaveAttribute('data-world-x', '20')
}

async function clickDirection(page: Page, name: string) {
  await page.getByRole('button', { name }).click()
}

test('@responsive rapid D-pad入力では途中animationを再開始せず最終cameraがlogical位置へ一致する', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedHub(page)

  const viewport = page.getByLabel('ワールドマップ')
  const snapshot = page.locator('.world-camera-snapshot')

  await clickDirection(page, '右へ移動')
  await expect(viewport).toHaveAttribute('data-world-x', '21')
  await expect(snapshot).toBeVisible()

  await page.waitForTimeout(20)
  await clickDirection(page, '左へ移動')
  await expect(viewport).toHaveAttribute('data-world-x', '20')
  await expect(snapshot).toBeHidden()

  for (const [name, x] of [
    ['右へ移動', '21'],
    ['左へ移動', '20'],
    ['右へ移動', '21'],
    ['左へ移動', '20'],
  ] as const) {
    await page.waitForTimeout(20)
    await clickDirection(page, name)
    await expect(viewport).toHaveAttribute('data-world-x', x)
    await expect(snapshot).toBeHidden()
  }

  await page.waitForTimeout(180)
  await expect(snapshot).toBeHidden()
  await expect(viewport).toHaveAttribute('data-world-x', '20')
  await expect(viewport).toHaveAttribute('data-world-y', '14')
  await expect(page.locator('.world-player-sprite')).toHaveAttribute('data-world-x', '20')
  await expect(page.locator('.world-character-layer')).toHaveAttribute('data-world-x', '20')
})

test('rapid keyboard入力でもcamera snapshotを積み重ねず入力を捨てない', async ({ page }) => {
  await seedHub(page)

  const viewport = page.getByLabel('ワールドマップ')
  const snapshot = page.locator('.world-camera-snapshot')

  await page.keyboard.press('ArrowRight')
  await expect(viewport).toHaveAttribute('data-world-x', '21')
  await expect(snapshot).toBeVisible()

  await page.waitForTimeout(20)
  await page.keyboard.press('ArrowLeft')
  await expect(viewport).toHaveAttribute('data-world-x', '20')
  await expect(snapshot).toBeHidden()

  await page.waitForTimeout(20)
  await page.keyboard.press('ArrowRight')
  await expect(viewport).toHaveAttribute('data-world-x', '21')
  await expect(snapshot).toBeHidden()

  await page.waitForTimeout(20)
  await page.keyboard.press('ArrowLeft')
  await expect(viewport).toHaveAttribute('data-world-x', '20')
  await expect(snapshot).toBeHidden()
})
