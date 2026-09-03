import { expect, test } from '@playwright/test'

test('OpeningだけでCode Knightの役割とCode Worldの暮らしを大まかに理解できる', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()

  await page.getByRole('button', { name: 'はじめる' }).click()
  const opening = page.getByLabel('JavaScript オープニングストーリー')
  await expect(opening).toBeVisible()

  await opening.getByRole('button', { name: '次へ ▶' }).click()
  await opening.getByRole('button', { name: '次へ ▶' }).click()

  await expect(opening).toContainText('Code KnightはREAL WORLDからCONNECTし')
  await expect(opening).toContainText('codeを読むことでこの世界のruleを確かめ')

  await opening.getByRole('button', { name: '次へ ▶' }).click()
  await expect(opening).toContainText('草原や村、森はlessonのために並んだstageじゃない')
  await expect(opening).toContainText('ここで暮らす人たちの道や生活')
})
