import type { Page } from '@playwright/test'

/** E2E seeds may use legacy v4 keys to exercise migration; assertions read the root commit. */
export const readStoredGameState = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('code-reading-rpg:game-state') ?? 'null'))

export const readStoredProgress = async (page: Page) => (await readStoredGameState(page))?.progress
export const readStoredRpg = async (page: Page) => (await readStoredGameState(page))?.rpg
