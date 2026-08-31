import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useBattleSessionContext } from './BattleSessionContext'
import type {
  BattleCommitEvent,
  BattleRollbackMode,
  BattleSessionIdentity,
  BattleStateAction,
} from './sessionTransaction'

export function useBattleSession(identity: Omit<BattleSessionIdentity, 'id'>) {
  const { start, update, commit, abort, externalRevision } = useBattleSessionContext()
  const navigate = useNavigate()
  const [initialExternalRevision] = useState(externalRevision)
  const [attempt] = useState(() => ({ ...identity, id: crypto.randomUUID() }))
  const mounted = useRef(false)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  useLayoutEffect(() => {
    mounted.current = true
    start(attempt)
    const pending = timers.current
    return () => {
      mounted.current = false
      pending.forEach(clearTimeout)
      pending.clear()
      abort(attempt.id, 'abort')
    }
  }, [abort, attempt, start])

  // A foreign tab's state cannot be combined with this component's old enemies/turn.
  useLayoutEffect(() => {
    if (externalRevision === initialExternalRevision) return
    mounted.current = false
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    void navigate({ to: '/world', replace: true })
  }, [externalRevision, initialExternalRevision, navigate])

  const schedule = useCallback((callback: () => void, delay: number) => {
    if (!mounted.current) return
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      if (mounted.current) callback()
    }, delay)
    timers.current.add(timer)
  }, [])
  const updateState = useCallback((action: BattleStateAction) => {
    if (mounted.current) update(attempt.id, action)
  }, [attempt.id, update])
  const finish = useCallback((event: BattleCommitEvent, action?: BattleStateAction) => {
    if (mounted.current) commit(attempt.id, event, action)
  }, [attempt.id, commit])
  const rollback = useCallback((mode: BattleRollbackMode = 'abort') => {
    if (mounted.current) abort(attempt.id, mode)
  }, [abort, attempt.id])
  return { schedule, updateState, finish, rollback }
}
