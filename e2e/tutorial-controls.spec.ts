import { readStoredRpg } from './storedGameState'
import { expect, test } from '@playwright/test'
import { selectPauseTab } from './pause-menu-helpers'

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

async function faceByte(page: Parameters<typeof test>[0]['page']) {
  await page.getByRole('button', { name: '上へ移動' }).click()
  await expect(page.locator('.world-player-sprite')).toHaveAttribute('data-facing', 'up')
  await expect(page.getByRole('button', { name: 'BYTEと話す' })).toBeEnabled()
}

test('mobile TutorialがD-Pad移動後にBYTEへのアクションへ進む', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedTutorial(page, 'field-move')
  await page.goto('/world')

  await expect(page.locator('.tutorial-prompt-field')).toContainText('移動')
  await expect(page.locator('.tutorial-prompt-field')).toContainText('BYTE')
  const player = page.locator('.world-player-sprite')
  const beforeX = await player.evaluate((element) => element.parentElement?.dataset.worldX)
  await page.getByRole('button', { name: '左へ移動' }).click()
  await expect.poll(() => player.evaluate((element) => element.parentElement?.dataset.worldX)).not.toBe(beforeX)
  await expect(page.locator('.tutorial-prompt-field')).toContainText('アクション')
  await expect(page.locator('.tutorial-prompt-field')).toContainText('BYTE')
  await expect.poll(async () => (await storedTutorial(page))?.phase).toBe('field-interact')
})

test('mobile TutorialでBYTEの方を向いて加入させ、追従と役割を確認してからBattleへ進む', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedTutorial(page, 'field-interact')
  await page.goto('/world')

  await expect(page.locator('.tutorial-prompt-field')).toContainText('BYTEの隣まで歩こう')
  await page.getByRole('button', { name: '左へ移動' }).click()
  await expect(page.locator('.tutorial-prompt-field')).toContainText(/BYTEの方を向こう/)
  await faceByte(page)
  await expect(page.locator('.tutorial-prompt-field')).toContainText(/BYTEに話しかける/)

  await page.getByRole('button', { name: 'BYTEと話す' }).click()
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

test('desktop TutorialでもKeyboardでBYTEの方を向いて加入まで操作できる', async ({ page }) => {
  await seedTutorial(page, 'field-interact')
  await page.goto('/world')

  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.tutorial-prompt-field')).toContainText(/BYTEの方を向こう/)
  await page.keyboard.press('ArrowUp')
  await expect(page.getByRole('button', { name: 'BYTEと話す' })).toBeEnabled()
  await page.keyboard.press('Enter')

  await expect.poll(async () => (await storedRpg(page))?.state?.partyMemberIds).toContain('byte')
  await expect.poll(async () => (await storedTutorial(page))?.phase).toBe('party-join')
})

test('party-joinはreload後もBYTE加入状態を保ち重複加入しない', async ({ page }) => {
  await seedTutorial(page, 'field-interact')
  await page.goto('/world')
  await page.getByRole('button', { name: '左へ移動' }).click()
  await faceByte(page)
  await page.getByRole('button', { name: 'BYTEと話す' }).click()
  await expect.poll(async () => (await storedTutorial(page))?.phase).toBe('party-join')

  await page.reload()
  await expect(page.locator('.tutorial-prompt-field')).toContainText('BYTEが仲間になった！')
  expect((await storedRpg(page))?.state?.partyMemberIds).toEqual(['byte'])
})

test('設定からTutorialを最初からやり直しても加入済みBYTEを壊さずアクションを再体験する', async ({ page }) => {
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
  await selectPauseTab(menu, '設定')
  await menu.getByRole('button', { name: 'チュートリアルをやり直す' }).click()

  await expect(page.locator('.tutorial-prompt-field')).toContainText('移動')
  await page.getByRole('button', { name: '左へ移動' }).click()
  await expect.poll(async () => (await storedTutorial(page))?.phase).toBe('field-interact')
  await expect(page.locator('.tutorial-prompt-field')).toContainText('アクション')
  await faceByte(page)
  await page.getByRole('button', { name: 'BYTEと話す' }).click()
  await expect.poll(async () => (await storedTutorial(page))?.phase).toBe('party-join')
  expect((await storedRpg(page))?.state?.partyMemberIds).toEqual(['byte'])
})