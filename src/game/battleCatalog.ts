import { battles as coreBattles } from './battles'
import { databaseBattles } from './databaseBattles'
import type { Battle } from './types'

export const battles: readonly Battle[] = [...coreBattles, ...databaseBattles]
