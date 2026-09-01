import { readStoredRpg } from './storedGameState'
import { expect, test } from '@playwright/test'

const TUTORIAL_KEY = 'code-reading-rpg:tutorial'
const RPG_KEY = 'code-reading-rpg:rpg-state'

const seedTutorial = async (page: Parameters<typeof test>[0]['page'], phase: string) => {
  await page.goto('/')
  await page.evaluate(({ key, phaseValue }) => {
    localStorage.clear()
    localStorage.setItem(key, JSON.stringify({ version: 1, status: 'active', phase: phaseValue }))
  }, { key: TUTORIAL_KEY, phaseValue: phase })
}

const storedTutorial = (page: Parameters<typeof test>[0]['page']) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), TUTORIAL_KEY)

const storedRpg = (page: Parameters<typeof test>[0]['page']) =>
  readStoredRpg(page)

test('mobile TutorialがD-Pad移動後にBYTE INTERACTへ進む', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedTutorial(page, 'field-move')
  await page.goto('/world')

  await expect(page.locator('.tutorial-prompt-field')).toContainText('MOVE')
  await expect(page.locator('.tutorial-prompt-field')).toContainText('BYTE')
  const player = page.locator('.world-player-sprite')
  const beforeX = await player.evaluate((element) => element.parentElement?.dataset.worldX)
  await page.getByRole('button', { name: 'Move left' }).click()
  await expect.poll(() => player.evaluate((element) => element.parentElement?.dataset.worldX)).not.toBe(beforeX)
  await expect(page.locator('.tutorial-prompt-field')).toContainText('INTERACT')
  await expect(page.locator('.tutorial-prompt-field')).toContainText('BYTE')
  await expect.poll(async () => (await storedTutorial(page))?.phase).toBe('field-interact')
})

test('mobile TutorialでBYTEを実際に加入させ、追従と役割を確認してからBattleへ進む', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedTutorial(page, 'field-interact')
  await page.goto('/world')

  await expect(page.locator('.tutorial-prompt-field')).toContainText('BYTEの隣まで歩こう')
  await page.getByRole('button', { name: 'Move left' }).click()
  await expect(page.locator('.tutorial-prompt-field')).toContainText(/BYTEに話しかける/)

  await page.getByRole('button', { name: 'INTERACT' }).click()
  await expect(page.locator('.tutorial-prompt-field')).toContainText('BYTEが仲間になった！')
  await expect.poll(async () => (await storedTutorial(page))?.phase).toBe('party-join')
  await expect.poll(async () => (await storedRpg(page))?.state?.partyMemberIds).toContain('byte')

  const prompt = page.locator('.tutorial-prompt-field')
  await expect(prompt).toContainText('仲間')
  await expect(prompt).toContainText('Worldでは後ろから追従する')
  await expect(prompt).toContainText('同じ対象へ追撃する')
  await expect(page.locator('.world-follower-sprite')).toBeVisible()

  await prompt.getByRole('button', { name: '次へ · 戦闘' }).click()
  await expect.poll(async () => (await storedTutorial(page))?.phase).toBe('battle')
  expect((await storedTutorial(page))?.status).toBe('active')
})

test('desktop TutorialでもKeyboardでBYTE加入まで操作できる', async ({ page }) => {
  await seedTutorial(page, 'field-interact')
  await page.goto('/world')

  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.tutorial-prompt-field')).toContainText(/BYTEに話しかける/)
  await page.keyboard.press('Enter')

  await expect.poll(async () => (await storedRpg(page))?.state?.partyMemberIds).toContain('byte')
  await expect.poll(async () => (await storedTutorial(page))?.phase).toBe('party-join')
})

test('party-joinはreload後もBYTE加入状態を保ち重複加入しない', async ({ page }) => {
  await seedTutorial(page, 'field-interact')
  await page.goto('/world')
  await page.getByRole('button', { name: 'Move left' }).click()
  await page.getByRole('button', { name: 'INTERACT' }).click()
  await expect.poll(async () => (await storedTutorial(page))?.phase).toBe('party-join')

  await page.reload()
  await expect(page.locator('.tutorial-prompt-field')).toContainText('BYTEが仲間になった！')
  expect((await storedRpg(page))?.state?.partyMemberIds).toEqual(['byte'])
})

test('設定からTutorialを最初からやり直しても加入済みBYTEを壊さずINTERACTを再体験する', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(({ tutorialKey, rpgKey }) => {
    localStorage.clear()
    localStorage.setItem(tutorialKey, JSON.stringify({ version: 1, status: 'completed', phase: 'battle' }))
    localStorage.setItem(rpgKey, JSON.stringify({
      version: 4,
      state: {
        equipment: { weapon: 'training-blade', armor: 'traveler-coat', accessory: null },
        ownedEquipmentIds: ['training-blade', 'traveler-coat'],
        partyMemberIds: ['byte'],
        partyEquipment: { byte: { weapon: null, armor: null, accessory: null } },
        worldMapId: 'overworld',
        worldPosition: { x: 20, y: 14 },
        stepsSinceEncounter: 8,
        encounterCount: 0,
        currentHp: 108,
        openedTreasureIds: [],
      },
    }))
  }, { tutorialKey: TUTORIAL_KEY, rpgKey: RPG_KEY })
  await page.goto('/world')

  await expect(page.locator('.tutorial-prompt')).toHaveCount(0)
  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const menu = page.getByRole('dialog', { name: 'メニュー' })
  await menu.getByRole('button', { name: '設定' }).click()
  await menu.getByRole('button', { name: 'チュートリアルをやり直す' }).click()

  await expect(page.locator('.tutorial-prompt-field')).toContainText('MOVE')
  await page.getByRole('button', { name: 'Move left' }).click()
  await expect.poll(async () => (await storedTutorial(page))?.phase).toBe('field-interact')
  await expect(page.locator('.tutorial-prompt-field')).toContainText('INTERACT')
  await page.getByRole('button', { name: 'INTERACT' }).click()
  await expect.poll(async () => (await storedTutorial(page))?.phase).toBe('party-join')
  expect((await storedRpg(page))?.state?.partyMemberIds).toEqual(['byte'])
})
