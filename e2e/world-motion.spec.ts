import { expect, test, type Page } from '@playwright/test'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedWorld(
  page: Page,
  options: {
    mapId?: 'overworld' | 'js-village' | 'js-forest' | 'js-deep-forest' | 'ts-frontier'
    position?: { x: number; y: number }
    clearedStageIds?: number[]
  } = {},
) {
  const mapId = options.mapId ?? 'overworld'
  const position = options.position ?? { x: 20, y: 14 }
  const clearedStageIds = options.clearedStageIds ?? []

  await page.goto('/')
  await page.evaluate(
    ({ progressKey, rpgKey, tutorialKey, mapIdValue, positionValue, cleared }) => {
      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 900,
            gold: 200,
            inventory: { patchKit: 2 },
            clearedStageIds: cleared,
            clearedAreaIds: cleared.includes(3) ? ['javascript'] : [],
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
            equipment: {
              weapon: 'training-blade',
              armor: 'traveler-coat',
              accessory: null,
            },
            ownedEquipmentIds: ['training-blade', 'traveler-coat'],
            partyMemberIds: ['byte'],
            partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
            worldMapId: mapIdValue,
            worldPosition: positionValue,
            stepsSinceEncounter: 0,
            encounterCount: 0,
            currentHp: 132,
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
      mapIdValue: mapId,
      positionValue: position,
      cleared: clearedStageIds,
    },
  )
}

test('Playerは移動方向を向き、2-frame stepと1tile補間をpresentationとして持つ', async ({ page }) => {
  await seedWorld(page)
  await page.goto('/world')

  const player = page.locator('.world-player-sprite')
  await expect(player).toHaveAttribute('data-facing', 'down')
  await expect(player).toHaveAttribute('data-step-frame', '0')
  expect(await player.evaluate((element) => getComputedStyle(element).transitionDuration)).toContain('0.15s')

  await page.getByRole('button', { name: 'Move right' }).click()
  await expect(player).toHaveAttribute('data-world-x', '21')
  await expect(player).toHaveAttribute('data-facing', 'right')
  await expect(player).toHaveAttribute('data-step-frame', '1')
  await expect(player.locator('img')).toHaveAttribute('src', /code-knight-field-side\.svg$/)

  await page.getByRole('button', { name: 'Move left' }).click()
  await expect(player).toHaveAttribute('data-world-x', '20')
  await expect(player).toHaveAttribute('data-facing', 'left')
  await expect(player).toHaveAttribute('data-step-frame', '0')
})

test('reduced-motionでは補間を切るがfacing情報は残す', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedWorld(page)
  await page.goto('/world')

  const player = page.locator('.world-player-sprite')
  expect(await player.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe('0s')

  await page.getByRole('button', { name: 'Move right' }).click()
  await expect(player).toHaveAttribute('data-facing', 'right')
  await expect(player).toHaveAttribute('data-world-x', '21')
})

test('map transitionはAREA titleとregion field BGMを同じscene identityから切り替える', async ({ page }) => {
  await seedWorld(page, {
    position: { x: 14, y: 13 },
    clearedStageIds: [1],
  })
  await page.goto('/world')

  const viewport = page.locator('.world-viewport')
  await expect(viewport).toHaveAttribute('data-world-scene', 'javascript-grassland')
  await expect(viewport).toHaveAttribute('data-world-bgm-track', 'field')
  await expect.poll(() => page.evaluate(() => document.body.dataset.bgmTrack)).toBe('field')

  await page.getByRole('button', { name: 'Move up' }).click()

  await expect(viewport).toHaveAttribute('data-world-map', 'js-village')
  await expect(viewport).toHaveAttribute('data-world-scene', 'greenfield-village')
  await expect(viewport).toHaveAttribute('data-world-bgm-track', 'fieldVillage')
  await expect.poll(() => page.evaluate(() => document.body.dataset.bgmTrack)).toBe('fieldVillage')
  await expect(page.locator('.world-entry-transition')).toContainText('GREENFIELD VILLAGE')
})

test('Battle entryはarena identityに合わせた短いRPG transitionを持つ', async ({ page }) => {
  const cleared = [1, 7, 8, 9, 10, 11, 12, 13, 14, 2, 15, 16, 17, 18, 19, 20, 21, 22, 3]
  await seedWorld(page, { clearedStageIds: cleared })
  await page.goto('/javascript/battle/10?seed=world-motion&returnTo=%2Fworld')

  const screen = page.locator('.battle-screen')
  await expect(screen).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.body.dataset.battleArena)).toBe('field')

  const transition = await screen.evaluate((element) => {
    const style = getComputedStyle(element, '::after')
    return { content: style.content, animationName: style.animationName }
  })
  expect(transition.content).toContain('ENCOUNTER')
  expect(transition.animationName).toContain('battle-entry-title')
})
