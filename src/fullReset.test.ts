import { describe, expect, it } from 'vitest'
import { FULL_RESET_STORAGE_KEYS, clearFullResetStorage } from './fullReset'

describe('full reset', () => {
  it('game progression keysだけを削除対象にする', () => {
    const removed: string[] = []
    clearFullResetStorage({ removeItem: (key) => removed.push(key) })

    expect(removed).toEqual([...FULL_RESET_STORAGE_KEYS])
    expect(removed).not.toContain('code-reading-rpg:audio-settings')
  })
})
