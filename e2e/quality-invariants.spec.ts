import { expect, test, type Locator, type Page } from '@playwright/test'
import { JS_BATTLE_1_PREREQS, JS_COMPLETE, JS_MIDBOSS_PREREQS } from './canonical-progress-fixtures'

const PROGRESS_KEY = 'code-reading-rpg:player-progress'
const RPG_KEY = 'code-reading-rpg:rpg-state'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function seedState(
  page: Page,
  options: {
    clearedStageIds: readonly number[]
    worldMapId?: string
    worldPosition?: { x: number; y: number }
    currentHp?: number
  },
) {
  await page.addInitScript(
    ({ progressKey, rpgKey, tutorialKey, state }) => {
      if (sessionStorage.getItem('quality-invariants:seeded') === 'true') return

      localStorage.clear()
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 0,
            gold: 0,
            inventory: { patchKit: 0 },
            clearedStageIds: state.clearedStageIds,
            clearedAreaIds: state.clearedStageIds.includes(3) ? ['javascript'] : [],
            completedSideQuestIds: [],
            unlockedStageIds: [7],
            unlockedSkillIds: ['trace', 'pulse', 'nova'],
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
            partyMemberIds: [],
            partyEquipment: {},
            worldMapId: state.worldMapId ?? 'overworld',
            worldPosition: state.worldPosition ?? { x: 20, y: 14 },
            stepsSinceEncounter: 8,
            encounterCount: 0,
            currentHp: state.currentHp ?? 108,
            openedTreasureIds: [],
          },
        }),
      )
      localStorage.setItem(
        tutorialKey,
        JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
      )
      sessionStorage.setItem('quality-invariants:seeded', 'true')
    },
    {
      progressKey: PROGRESS_KEY,
      rpgKey: RPG_KEY,
      tutorialKey: TUTORIAL_KEY,
      state: options,
    },
  )
  await page.goto('/')
}

async function dismissStory(page: Page) {
  const story = page.locator('.battle-story-window')
  await story.waitFor({ state: 'visible', timeout: 2_000 }).catch(() => undefined)
  if (!(await story.isVisible().catch(() => false))) return
  await story.getByRole('button', { name: 'SKIP' }).click()
  await expect(story).toBeHidden()
}

async function expectDialogFocusTrap(page: Page, dialog: Locator) {
  const buttons = dialog.getByRole('button')
  const first = buttons.first()
  const last = buttons.last()

  await expect(first).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(last).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(first).toBeFocused()

  // Programmatic or pointer focus on the page background must be redirected into the modal.
  await page.locator('.skill-card').first().focus()
  await expect(first).toBeFocused()
}

test('@cross-browser registered Sprout/Boar/Guardian visuals render in the built artifact', async ({
  page,
}) => {
  await seedState(page, { clearedStageIds: [...JS_MIDBOSS_PREREQS, 13, 14] })
  await page.goto('/javascript/battle/14?seed=quality-visuals-forest&returnTo=%2Fworld')
  await dismissStory(page)

  for (const visualId of ['sprout', 'boar']) {
    const sprite = page.locator(`[data-enemy-visual-id="${visualId}"]`)
    await expect(sprite).toBeVisible()
    expect(await sprite.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    )
  }

  await page.goto('/javascript/battle/15?seed=quality-visuals-deep&returnTo=%2Fworld')
  const guardian = page.locator('[data-enemy-visual-id="guardian"]')
  await expect(guardian).toBeVisible()
  expect(await guardian.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
    'rgba(0, 0, 0, 0)',
  )
})

test('@cross-browser Pause traps focus and blocks Battle interaction/progression', async ({
  page,
}) => {
  await seedState(page, { clearedStageIds: [7] })
  await page.goto('/javascript/battle/7?seed=village-training%3A7&returnTo=%2Fworld')
  await dismissStory(page)

  const playerHp = page.locator('.player-panel .status-label-row strong')
  const enemyHp = page.locator('.enemy-name-row span')
  await expect(enemyHp).toHaveCount(2)
  const hpBefore = await playerHp.textContent()
  const enemiesBefore = await enemyHp.allTextContents()

  await page.getByRole('button', { name: 'Pause menuを開く' }).click()
  const dialog = page.getByRole('dialog', { name: 'Pause menu' })
  await expect(dialog).toBeVisible()
  await expect(page.locator('body')).toHaveAttribute('data-rpg-paused', 'true')

  for (let index = 0; index < 16; index += 1) await page.keyboard.press('Tab')
  expect(
    await page.evaluate(
      () => document.activeElement?.closest('[aria-label="Pause menu"]') !== null,
    ),
  ).toBe(true)
  await expect(playerHp).toHaveText(hpBefore ?? '')
  expect(await enemyHp.allTextContents()).toEqual(enemiesBefore)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'Pause menuを開く' })).toBeFocused()
})

test('@responsive short/landscape viewport keeps multiline CODE HELP readable', async ({
  page,
}) => {
  await seedState(page, { clearedStageIds: JS_MIDBOSS_PREREQS })
  await page.goto('/javascript/battle/13?seed=quality-code-help&returnTo=%2Fworld')
  await dismissStory(page)
  await page.getByRole('button', { name: 'コード解説を開く' }).click()

  const modal = page.locator('.explain-modal')
  await expect(modal).toBeVisible()
  const bounds = await modal.boundingBox()
  const viewport = page.viewportSize()
  expect(bounds?.y ?? -1).toBeGreaterThanOrEqual(0)
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(viewport?.height ?? 0)
  await expect(modal.locator('pre code')).toBeVisible()
})

test('@cross-browser CODE HELP, CODE DATA, and Story keep focus inside and restore their opener', async ({
  page,
}) => {
  await seedState(page, { clearedStageIds: JS_MIDBOSS_PREREQS })
  await page.goto('/javascript/battle/13?seed=quality-modal-focus&returnTo=%2Fworld')

  const story = page.getByRole('dialog', { name: '今までの読み方だけで進む' })
  await expect(story).toBeVisible()
  await expect(story).toHaveAttribute('aria-modal', 'true')
  await expectDialogFocusTrap(page, story)
  await page.keyboard.press('Escape')
  await expect(story).toBeHidden()

  const helpTrigger = page.getByRole('button', { name: 'コード解説を開く' })
  await helpTrigger.focus()
  await helpTrigger.click()
  const help = page.getByRole('dialog', { name: 'Code help' })
  await expect(help).toBeVisible()
  await expectDialogFocusTrap(page, help)
  await page.keyboard.press('Escape')
  await expect(help).toBeHidden()
  await expect(helpTrigger).toBeFocused()

  const dataTrigger = page.getByRole('button', { name: 'コードで使う実データを確認' })
  await dataTrigger.focus()
  await dataTrigger.click()
  const data = page.getByRole('dialog', { name: 'Code data' })
  await expect(data).toBeVisible()
  await expectDialogFocusTrap(page, data)
  await page.keyboard.press('Escape')
  await expect(data).toBeHidden()
  await expect(dataTrigger).toBeFocused()
})

test('@cross-browser Victory/Defeat result dialog traps focus and blocks Battle background', async ({
  page,
}) => {
  await seedState(page, { clearedStageIds: JS_BATTLE_1_PREREQS, currentHp: 1 })
  await page.goto('/javascript/battle/1?seed=quality-result-focus&returnTo=%2Fworld')
  await dismissStory(page)

  const trace = page.getByRole('button', { name: /^TRACE\b/ })
  await trace.click()
  await trace.click()

  const result = page.getByRole('dialog', { name: 'Defeat result' })
  await expect(result).toBeVisible()
  await expect(result).toHaveAttribute('aria-modal', 'true')
  await expectDialogFocusTrap(page, result)
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/world$/)
})

test('@responsive mobile keeps selected code and Enemy runtime data comparable', async ({
  page,
}) => {
  await seedState(page, { clearedStageIds: JS_BATTLE_1_PREREQS })
  await page.goto('/javascript/battle/1?seed=quality-code-data&returnTo=%2Fworld')
  await dismissStory(page)

  const trace = page.getByRole('button', { name: /^TRACE\b/ })
  await trace.click()
  await page.getByRole('button', { name: 'コードで使う実データを確認' }).click()

  await expect(trace.locator('pre code')).toBeVisible()
  const data = page.getByRole('dialog', { name: 'Code data' })
  await expect(data).toBeVisible()
  await expect(data.getByRole('heading', { name: 'TRACE' })).toBeVisible()
  await expect(data.getByText('enemies', { exact: true }).first()).toBeVisible()
})

test('@responsive current Atlas card is in the scrollport immediately after opening', async ({
  page,
}) => {
  await seedState(page, {
    clearedStageIds: JS_COMPLETE,
    worldMapId: 'ts-frontier',
    worldPosition: { x: 5, y: 5 },
  })
  await page.goto('/world')
  await page.getByRole('button', { name: 'Pause menuを開く' }).click()
  await page.getByRole('button', { name: 'MAP', exact: true }).click()

  const visible = await page.locator('.atlas-scrollport').evaluate((scrollport) => {
    const current = scrollport.querySelector('.atlas-map.is-current')
    if (!current) return false
    const viewport = scrollport.getBoundingClientRect()
    const card = current.getBoundingClientRect()
    return card.left >= viewport.left && card.right <= viewport.right
  })
  expect(visible).toBe(true)
})
