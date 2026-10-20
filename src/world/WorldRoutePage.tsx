import { DatabaseArchivePage } from './DatabaseArchivePage'
import { DATABASE_ARCHIVE_MAP_ID } from './databaseArchive'
import { useRpg } from '../rpg'
import { TS_FRONTIER_MAP_ID } from './worldMap'
import { TypeScriptFrontierPage } from './TypeScriptFrontierPage'
import { WorldPage } from './WorldPage'

export function WorldRoutePage() {
  const { rpgState } = useRpg()

  if (rpgState.worldMapId === DATABASE_ARCHIVE_MAP_ID) return <DatabaseArchivePage />

  if (rpgState.worldMapId === TS_FRONTIER_MAP_ID) {
    return <TypeScriptFrontierPage />
  }

  return <WorldPage />
}
