import { expect, test } from '@playwright/test'

const AUDIO_KEY = 'code-reading-rpg:audio-settings'
const TUTORIAL_KEY = 'code-reading-rpg:tutorial'

async function prepareWorld(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate((tutorialKey) => {
    localStorage.clear()
    localStorage.setItem(
      tutorialKey,
      JSON.stringify({ version: 1, status: 'skipped', phase: 'battle' }),
    )
  }, TUTORIAL_KEY)
  await page.goto('/world')
}

async function openPauseMenu(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Pause menuを開く' }).click()
  return page.getByRole('dialog', { name: 'Pause menu' })
}

test('Sound設定はPause SYSTEMだけにありreload後も保持される', async ({ page }) => {
  await prepareWorld(page)

  await expect(page.locator('.audio-settings-toggle')).toHaveCount(0)

  let dialog = await openPauseMenu(page)
  await dialog.getByRole('button', { name: 'SYSTEM' }).click()
  const se = dialog.getByLabel('Sound effect volume')
  const bgm = dialog.getByLabel('Background music volume')

  await se.fill('65')
  await bgm.fill('35')
  await dialog.getByRole('button', { name: 'SOUND ON' }).click()
  await expect(dialog.getByRole('button', { name: 'SOUND OFF' })).toBeVisible()

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), AUDIO_KEY)
  expect(stored).toEqual({
    version: 1,
    settings: { muted: true, seVolume: 0.65, bgmVolume: 0.35 },
  })

  await page.reload()
  dialog = await openPauseMenu(page)
  await dialog.getByRole('button', { name: 'SYSTEM' }).click()
  await expect(dialog.getByRole('button', { name: 'SOUND OFF' })).toBeVisible()
  await expect(dialog.getByLabel('Sound effect volume')).toHaveValue('65')
  await expect(dialog.getByLabel('Background music volume')).toHaveValue('35')
})

test('Codexは独立buttonを持たずPause CODEXから参照できる', async ({ page }) => {
  await prepareWorld(page)

  await expect(page.locator('.codex-toggle')).toHaveCount(0)

  const dialog = await openPauseMenu(page)
  await dialog.getByRole('button', { name: 'CODEX' }).click()
  const codex = dialog.getByLabel('Code Codex')

  await expect(codex.getByRole('tab', { name: 'JAVASCRIPT' })).toHaveAttribute('aria-selected', 'true')
  await expect(codex.getByText('CONCEPTS', { exact: false })).toBeVisible()

  await codex.getByRole('tab', { name: 'TYPESCRIPT' }).click()
  await expect(codex.getByRole('tab', { name: 'TYPESCRIPT' })).toHaveAttribute('aria-selected', 'true')
})
