import { useRpg } from '../rpg'
import { TS_FRONTIER_MAP_ID } from './worldMap'
import { TypeScriptFrontierPage } from './TypeScriptFrontierPage'
import { WorldPage } from './WorldPage'

export function WorldRoutePage() {
  const { rpgState } = useRpg()

  if (rpgState.worldMapId === TS_FRONTIER_MAP_ID) {
    return <TypeScriptFrontierPage />
  }

  return <WorldPage />
}
