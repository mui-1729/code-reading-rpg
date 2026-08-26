import { useBgm } from '../audio/useBgm'
import { JavaScriptFieldPage } from './JavaScriptFieldPage'

export function JavaScriptFieldRoute() {
  useBgm('field')
  return <JavaScriptFieldPage />
}
