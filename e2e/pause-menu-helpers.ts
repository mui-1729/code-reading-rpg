import { expect, type Locator } from '@playwright/test'

export async function selectPauseTab(menu: Locator, label: string) {
  const trigger = menu.locator('.pause-tab-trigger')
  await expect(trigger).toBeVisible()
  if ((await trigger.textContent())?.includes(label)) return

  await trigger.click()
  const picker = menu.getByRole('listbox', { name: 'メニュー項目を選ぶ' })
  await expect(picker).toBeVisible()
  await picker.getByRole('option', { name: label, exact: true }).click()
  await expect(picker).toBeHidden()
  await expect(trigger).toContainText(label)
}
