import { battles as authoredBattles } from './battles'
import { databaseBattle } from './databaseBattle'
import type { Battle } from './types'

export const battles: readonly Battle[] = [...authoredBattles, databaseBattle]
