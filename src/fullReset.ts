import { PLAYER_PROGRESS_STORAGE_KEY } from './progression'
import { RPG_STORAGE_KEY } from './rpg'
import { GAME_STATE_BACKUP_STORAGE_KEY, GAME_STATE_STORAGE_KEY } from './persistence/gameStateStorage'
import { JAVASCRIPT_OPENING_STORAGE_KEY } from './story/javascriptOpening'
import { TUTORIAL_STORAGE_KEY } from './tutorial/storage'

export const FULL_RESET_STORAGE_KEYS = [
  PLAYER_PROGRESS_STORAGE_KEY,
  RPG_STORAGE_KEY,
  GAME_STATE_STORAGE_KEY,
  GAME_STATE_BACKUP_STORAGE_KEY,
  TUTORIAL_STORAGE_KEY,
  JAVASCRIPT_OPENING_STORAGE_KEY,
] as const

type RemovableStorage = Pick<Storage, 'removeItem'>

export function clearFullResetStorage(storage: RemovableStorage) {
  for (const key of FULL_RESET_STORAGE_KEYS) {
    storage.removeItem(key)
  }
}

export function resetGameToTitle() {
  try {
    clearFullResetStorage(window.localStorage)
  } catch {
    // Always leave the current document so stale in-memory game/tutorial state cannot survive.
  }

  window.location.replace('/')
}
