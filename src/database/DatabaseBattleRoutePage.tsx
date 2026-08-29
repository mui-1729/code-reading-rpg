import { useEffect, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import App from '../App'
import { useBgm } from '../audio/useBgm'
import { areaById, DATABASE_AREA_ID, getAreaForBattle } from '../game'

const databaseBattleRouteApi = getRouteApi('/database/battle/$battleId')
const createRunSeed = () => crypto.randomUUID()

export function DatabaseBattleRoutePage() {
  const { battleId } = databaseBattleRouteApi.useParams()
  const { seed: searchSeed, returnTo } = databaseBattleRouteApi.useSearch()
  const navigate = useNavigate()
  const [fallbackSeed] = useState(createRunSeed)
  const seed = searchSeed ?? fallbackSeed
  const numericBattleId = Number(battleId)
  const battleArea = getAreaForBattle(numericBattleId)
  const exists = battleArea?.id === DATABASE_AREA_ID

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
        <div className="eyebrow">ROUTE ERROR</div>
        <h2>そのBattleはDatabase Archiveに存在しない</h2>
        <button
          className="primary-button"
          onClick={() => navigate({ to: area.routes.field ?? '/world' })}
        >
          ◀ RETURN TO WORLD
        </button>
      </section>
    </main>
  )
}
