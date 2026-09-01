import { expect, test } from '@playwright/test'
import { JS_SECOND_INCIDENT_PREREQS } from './canonical-progress-fixtures'

const OPENING_KEY = 'code-read-rpg:javascript-opening:v1'
const PROGRESS_KEY = 'code-reading-rpg:player-progress'

async function seedForestMastery(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(
    ({ openingKey, progressKey, clearedStageIds }) => {
      localStorage.clear()
      localStorage.setItem(openingKey, 'seen')
      localStorage.setItem(
        progressKey,
        JSON.stringify({
          version: 4,
          progress: {
            exp: 160,
            gold: 44,
            inventory: { patchKit: 0 },
            clearedStageIds,
            clearedAreaIds: [],
            completedSideQuestIds: [],
            unlockedStageIds: [1, 99],
            // Intentionally forged cache: restore must derive mastery from clears instead.
            unlockedSkillIds: ['moon-edge', 'ts-scan'],
          },
        }),
      )
    },
    {
      openingKey: OPENING_KEY,
      progressKey: PROGRESS_KEY,
      clearedStageIds: [...JS_SECOND_INCIDENT_PREREQS],
    },
  )
  await page.goto('/world')
}

test('CODEXはclear履歴から導出したMASTERED Skillを表示する', async ({ page }) => {
  await seedForestMastery(page)

  await page.getByRole('button', { name: 'メニューを開く' }).click()
  const dialog = page.getByRole('dialog', { name: 'メニュー' })
  await dialog.getByRole('button', { name: 'コード図鑑' }).click()

  const codex = dialog.getByLabel('Code Codex')
  await expect(codex).toContainText('13 CONCEPTS · 9 MASTERED')
  await expect(codex.getByLabel('Mastered skills')).toContainText('TRACE')
  await expect(codex.getByLabel('Mastered skills')).toContainText('LINK')
  await expect(codex.getByLabel('Mastered skills')).toContainText('LOCK')
  await expect(codex.getByLabel('Mastered skills')).toContainText('FORK')
  await expect(codex.getByLabel('Mastered skills')).toContainText('ALERT')
  await expect(codex.getByLabel('Mastered skills')).toContainText('GATHER')
  await expect(codex.getByLabel('Mastered skills')).toContainText('VIPER')
  await expect(codex.getByLabel('Mastered skills')).not.toContainText('MOON EDGE')

  await codex.getByRole('tab', { name: 'TYPESCRIPT' }).click()
  await expect(codex).toContainText('0 MASTERED')
  await expect(codex.getByLabel('Mastered skills')).toContainText('NONE YET')
})
