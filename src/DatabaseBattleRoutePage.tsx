import { useEffect, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import App from './App'
import { useBgm } from './audio/useBgm'
import { areaById, DATABASE_AREA_ID, DATABASE_PROTOTYPE_BATTLE_ID } from './game'

const databaseBattleRouteApi = getRouteApi('/database/battle/$battleId')
const createRunSeed = () => crypto.randomUUID()

export function DatabaseBattleRoutePage() {
  const { battleId } = databaseBattleRouteApi.useParams()
  const { seed: searchSeed, returnTo } = databaseBattleRouteApi.useSearch()
  const navigate = useNavigate()
  const [fallbackSeed] = useState(createRunSeed)
  const seed = searchSeed ?? fallbackSeed
  const numericBattleId = Number(battleId)
  const exists = numericBattleId === DATABASE_PROTOTYPE_BATTLE_ID

  useEffect(() => {
    if (searchSeed || !exists) return

    navigate({
      to: '/database/battle/$battleId',
      params: { battleId },
      search: { seed, returnTo },
      replace: true,
    })
  }, [battleId, exists, navigate, returnTo, searchSeed, seed])

  if (!exists) return <DatabaseBattleNotFound />

  return (
    <App
      key={`${battleId}:${seed}`}
      battleId={numericBattleId}
      seed={seed}
      returnTo={returnTo}
    />
  )
}

function DatabaseBattleNotFound() {
  const navigate = useNavigate()
  useBgm('menu')
  const area = areaById[DATABASE_AREA_ID]

  return (
    <main className="app-shell center-shell title-screen">
      <section className="result-card defeat-card pixel-window">
        <div className="eyebrow">DATABASE ROUTE ERROR</div>
        <h2>そのQuery BattleはArchiveに存在しない</h2>
        <button className="primary-button" onClick={() => navigate({ to: '/world' })}>
          ◀ RETURN TO {area?.title.toUpperCase() ?? 'WORLD'}
        </button>
      </section>
    </main>
  )
}
