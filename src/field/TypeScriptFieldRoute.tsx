import { useBgm } from '../audio/useBgm'
import { TypeScriptFieldPage } from './TypeScriptFieldPage'

export function TypeScriptFieldRoute() {
  useBgm('field')
  return <TypeScriptFieldPage />
}
