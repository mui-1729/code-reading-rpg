import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  JS_BATTLE_1_PREREQS,
  JS_COMPLETE,
  JS_MIDBOSS_PREREQS,
  JS_SECOND_INCIDENT_PREREQS,
} from './canonical-progress-fixtures'
import { selectPauseTab } from './pause-menu-helpers'

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
  await story.getByRole('button', { name: 'スキップ', exact: true }).click()
  await expect(story).toBeHidden()
}

async function openFight(page: Page) {
  const fight = page.getByRole('button', { name: '戦う', exact: true })
  if ((await fight.getAttribute('aria-pressed')) !== 'true') await fight.click()
  await expect(page.getByRole('group', { name: 'スキル' })).toBeVisible()
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
  await page.locator('.battle-command-button').first().focus()
  await expect(first).toBeFocused()
}

test('@cross-browser registered Sprout/Boar/Guardian visuals render in the built artifact', async ({
  page,
}) => {
  await seedState(page, { clearedStageIds: [...JS_SECOND_INCIDENT_PREREQS, 2] })
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

  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const dialog = page.getByRole('dialog', { name: 'メニュー' })
  await expect(dialog).toBeVisible()
  await expect(page.locator('body')).toHaveAttribute('data-rpg-paused', 'true')

  for (let index = 0; index < 16; index += 1) await page.keyboard.press('Tab')
  expect(
    await page.evaluate(
      () => document.activeElement?.closest('[aria-label="メニュー"]') !== null,
    ),
  ).toBe(true)
  await expect(playerHp).toHaveText(hpBefore ?? '')
  expect(await enemyHp.allTextContents()).toEqual(enemiesBefore)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'メニューを開く' })).toBeFocused()
})

test('@responsive short/landscape viewport keeps multiline CODE HELP readable', async ({
  page,
}) => {
  await seedState(page, { clearedStageIds: JS_COMPLETE })
  await page.goto('/javascript/battle/20?seed=quality-code-help&returnTo=%2Fworld')
  await dismissStory(page)
  await openFight(page)
  const order = page.locator('[data-skill-id="order"]')
  await order.click()
  const source = (await order.locator('pre code').textContent()) ?? ''
  expect(source.split('\n').length).toBeGreaterThan(1)
  await page.getByRole('button', { name: 'コード解説を開く' }).click()

  const modal = page.locator('.explain-modal')
  await expect(modal).toBeVisible()
  const bounds = await modal.boundingBox()
  const viewport = page.viewportSize()
  expect(bounds?.y ?? -1).toBeGreaterThanOrEqual(0)
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(viewport?.height ?? 0)
  await expect(modal.locator('.source-code-line pre code').first()).toBeVisible()
  await expect(modal.locator('.source-code-line')).toHaveCount(source.split('\n').length)
  expect((await modal.locator('.source-code-line pre code').allTextContents()).join('\n')).toBe(source)
})

test('@cross-browser CODE HELP, CODE DATA, and Story keep focus inside and restore their opener', async ({
  page,
}) => {
  await seedState(page, { clearedStageIds: JS_MIDBOSS_PREREQS })
  await page.goto('/javascript/battle/13?seed=quality-modal-focus&returnTo=%2Fworld')

  const story = page.getByRole('dialog', { name: '異常の経路を守る相手を越える' })
  await expect(story).toBeVisible()
  await expect(story).toHaveAttribute('aria-modal', 'true')
  await expectDialogFocusTrap(page, story)
  await page.keyboard.press('Escape')
  await expect(story).toBeHidden()

  await openFight(page)
  const helpTrigger = page.getByRole('button', { name: 'コード解説を開く' })
  await helpTrigger.focus()
  await helpTrigger.click()
  const help = page.getByRole('dialog', { name: 'コード解説' })
  await expect(help).toBeVisible()
  await expectDialogFocusTrap(page, help)
  await page.keyboard.press('Escape')
  await expect(help).toBeHidden()
  await expect(helpTrigger).toBeFocused()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')

  const dataTrigger = page.getByRole('button', { name: 'コードで使う実データを確認' })
  await dataTrigger.focus()
  await dataTrigger.click()
  const data = page.getByRole('dialog', { name: 'コードデータ' })
  await expect(data).toBeVisible()
  await expectDialogFocusTrap(page, data)
  await page.keyboard.press('Escape')
  await expect(data).toBeHidden()
  await expect(dataTrigger).toBeFocused()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
})

test('@cross-browser Victory/Defeat result dialog traps focus and blocks Battle background', async ({
  page,
}) => {
  await seedState(page, { clearedStageIds: JS_BATTLE_1_PREREQS, currentHp: 1 })
  await page.goto('/javascript/battle/1?seed=quality-result-focus&returnTo=%2Fworld')
  await dismissStory(page)
  await openFight(page)

  const trace = page.getByRole('button', { name: /^TRACE\b/ })
  await trace.click()
  await trace.click()

  const result = page.getByRole('dialog', { name: '敗北結果' })
  await expect(result).toBeVisible()
  await expect(result).toHaveAttribute('aria-modal', 'true')
  await expectDialogFocusTrap(page, result)
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/world$/)
})

test('@cross-browser post-Battle Story exclusively owns focus until the Victory result is revealed', async ({ page }) => {
  await seedState(page, { clearedStageIds: JS_BATTLE_1_PREREQS })
  await page.goto('/javascript/battle/1?seed=encounter%3A5%3A10%3A11&returnTo=%2Fworld')
  await dismissStory(page)

  // First-clear Chapter 1 has a post-Battle Story; training Battle 7 does not.
  // Check the displayed comparison rather than relying on the card name alone.
  for (const name of ['TRACE', 'NOVA', 'TRACE']) {
    await openFight(page)
    const card = page.getByRole('button', { name: new RegExp(`^${name}\\b`) })
    await expect(card).toBeEnabled()
    await expect(card.locator('pre code')).toContainText(name === 'NOVA' ? '> 60' : '< 45')
    await card.click()
    await card.click()
  }

  const story = page.locator('.battle-story-window')
  const overlay = page.locator('.victory-overlay')
  await expect(story).toBeVisible()
  await expect(overlay).toHaveAttribute('inert', '')
  await expect(overlay).toHaveAttribute('aria-hidden', 'true')
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await expect(page.getByRole('dialog', { name: '勝利結果' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'スキップ', exact: true })).toHaveCount(1)
  await expectDialogFocusTrap(page, story)

  await story.getByRole('button', { name: 'スキップ', exact: true }).click()
  const result = page.getByRole('dialog', { name: '勝利結果' })
  await expect(result).toBeVisible()
  await expect(overlay).not.toHaveAttribute('inert', '')
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  await expect(result.getByRole('button').first()).toBeFocused()
  await result.getByRole('button', { name: /ワールドへ戻る/ }).click()
  await expect(page).toHaveURL(/\/world$/)
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
})

test('@responsive mobile keeps all three Enemy cards and selected code comparable without horizontal overflow', async ({
  page,
}) => {
  await seedState(page, { clearedStageIds: [...JS_SECOND_INCIDENT_PREREQS, 2] })
  await page.goto('/javascript/battle/2?seed=quality-code-data&returnTo=%2Fworld')
  await dismissStory(page)
  await openFight(page)

  const trace = page.getByRole('button', { name: /^TRACE\b/ })
  await trace.click()

  const geometry = await page.evaluate(() => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const rows = Array.from(document.querySelectorAll<HTMLElement>('.enemy-card'))
    const selected = document.querySelector<HTMLElement>('.selected-skill-reading')
    const sourceLines = Array.from(document.querySelectorAll<HTMLElement>('.selected-skill-reading .source-code-line'))
    const referenceButtons = Array.from(document.querySelectorAll<HTMLElement>(
      '.battle-reference-actions > .floating-code-data, .battle-reference-actions > .floating-help',
    ))
    const commandBar = document.querySelector<HTMLElement>('.battle-command-bar')
    const withinWidth = (element: HTMLElement) => {
      const bounds = element.getBoundingClientRect()
      return bounds.left >= -1 && bounds.right <= viewportWidth + 1 && bounds.width > 0
    }
    const overlaps = (first: DOMRect, second: DOMRect) =>
      first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top
    const compactMode = viewportWidth <= 900 || (viewportHeight <= 520 && viewportWidth <= 1100)
    const mobileReading = compactMode
    const readingElements = mobileReading && selected ? [...rows, selected] : []
    const readingBounds = readingElements.map((element) => element.getBoundingClientRect())
    const readingTop = readingBounds.length > 0 ? Math.min(...readingBounds.map((bounds) => bounds.top)) : 0
    const readingBottom = readingBounds.length > 0 ? Math.max(...readingBounds.map((bounds) => bounds.bottom)) : 0
    return {
      rowCount: rows.length,
      mobileReading,
      rowsWithinWidth: rows.every(withinWidth),
      rowFieldsWithinWidth: rows.every((row) =>
        Array.from(row.querySelectorAll<HTMLElement>(
          '.enemy-name-row h2, .enemy-name-row > span, .enemy-role, .enemy-raw-attack, .intent-box',
        )).every((field) => {
          const card = row.getBoundingClientRect()
          const bounds = field.getBoundingClientRect()
          return withinWidth(field) && bounds.left >= card.left && bounds.right <= card.right &&
            bounds.top >= card.top && bounds.bottom <= card.bottom
        }),
      ),
      readableSprites: rows.every((row) => {
        const sprite = row.querySelector<HTMLElement>('.enemy-sprite')?.getBoundingClientRect()
        return Boolean(sprite && sprite.width >= 40 && sprite.height >= 40)
      }),
      visibleHpBars: rows.every((row) => {
        const track = row.querySelector<HTMLElement>('.enemy-track')?.getBoundingClientRect()
        return Boolean(track && track.width > 0 && track.height >= 6)
      }),
      rowsHaveRuntimeData: rows.every((row) =>
        Boolean(
          row.querySelector('.enemy-name-row h2') &&
          row.querySelector('.enemy-name-row > span') &&
          row.querySelector('.enemy-raw-attack strong') &&
          row.querySelector('.intent-box strong'),
        ),
      ),
      selectedWithinWidth: selected ? withinWidth(selected) : false,
      sourceLineCount: sourceLines.length,
      selectedCodeVisible: sourceLines.every(withinWidth),
      referenceButtonCount: referenceButtons.length,
      referenceButtonsInline: referenceButtons.every((button) => getComputedStyle(button).position === 'static'),
      referenceButtonsWithinWidth: referenceButtons.every(withinWidth),
      referenceButtonsOverlapCommands: commandBar
        ? referenceButtons.some((button) => overlaps(button.getBoundingClientRect(), commandBar.getBoundingClientRect()))
        : true,
      horizontalOverflow: document.documentElement.scrollWidth - viewportWidth,
      readingUnionHeight: readingBottom - readingTop,
      viewportHeight,
    }
  })

  expect(geometry.rowCount).toBe(3)
  expect(geometry.rowsWithinWidth).toBe(true)
  expect(geometry.rowFieldsWithinWidth).toBe(true)
  expect(geometry.rowsHaveRuntimeData).toBe(true)
  expect(geometry.readableSprites).toBe(true)
  expect(geometry.visibleHpBars).toBe(true)
  expect(geometry.horizontalOverflow).toBeLessThanOrEqual(1)
  if (geometry.mobileReading) {
    expect(geometry.selectedWithinWidth).toBe(true)
    expect(geometry.sourceLineCount).toBeGreaterThan(0)
    expect(geometry.selectedCodeVisible).toBe(true)
    expect(geometry.readingUnionHeight).toBeLessThanOrEqual(geometry.viewportHeight)
    expect(geometry.referenceButtonCount).toBe(2)
    expect(geometry.referenceButtonsInline).toBe(true)
    expect(geometry.referenceButtonsWithinWidth).toBe(true)
    expect(geometry.referenceButtonsOverlapCommands).toBe(false)
  } else {
    await expect(trace.locator('pre code')).toBeVisible()
  }

  // Keep the existing live DATA contract alongside the compact reading layout.
  await page.getByRole('button', { name: 'コードで使う実データを確認' }).click()
  const data = page.getByRole('dialog', { name: 'コードデータ' })
  await expect(data).toBeVisible()
  await expect(data.getByRole('heading', { name: 'TRACE' })).toBeVisible()
  await expect(data.getByText('enemies', { exact: true }).first()).toBeVisible()
  const dataBounds = await data.boundingBox()
  const viewport = page.viewportSize()
  expect(dataBounds?.y ?? -1).toBeGreaterThanOrEqual(0)
  expect((dataBounds?.y ?? 0) + (dataBounds?.height ?? 0)).toBeLessThanOrEqual(viewport?.height ?? 0)
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
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const menu = page.getByRole('dialog', { name: 'メニュー' })
  await selectPauseTab(menu, 'マップ')

  const visible = await page.locator('.atlas-scrollport').evaluate((scrollport) => {
    const current = scrollport.querySelector('.atlas-map.is-current')
    if (!current) return false
    const viewport = scrollport.getBoundingClientRect()
    const card = current.getBoundingClientRect()
    return card.left >= viewport.left && card.right <= viewport.right
  })
  expect(visible).toBe(true)
})