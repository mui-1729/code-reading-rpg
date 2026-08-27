import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BattleStoryEvent } from '../story/BattleStoryEvent'
import {
  getJavaScriptPostBattleEvent,
  getJavaScriptPreBattleEvent,
  type BattleStoryEvent as BattleStoryEventData,
} from '../story/javascriptBattleEvents'
import { buildResultSequence, type RawResultItem, type ResultSequenceItem } from './resultSequence'

const AUTO_ADVANCE_MS = 1100
const WORLD_PROGRESS_SELECTOR =
  '[data-result-feedback="world-progress"]:not(.result-sequence-consumed)'
const JAVASCRIPT_BATTLE_PATH = /^\/javascript\/battle\/(\d+)$/

const getJavaScriptBattleId = () => {
  const match = JAVASCRIPT_BATTLE_PATH.exec(window.location.pathname)
  return match?.[1] ? Number(match[1]) : null
}

const isFirstClear = (summary: HTMLElement) =>
  Array.from(summary.querySelectorAll<HTMLElement>('.reward-unlock'))
    .some((element) => element.textContent?.includes('STAGE CLEAR RECORDED'))

const readRewardItems = (summary: HTMLElement): RawResultItem[] => {
  const items: RawResultItem[] = []

  for (const element of Array.from(summary.children)) {
    if (!(element instanceof HTMLElement)) continue
    if (element.classList.contains('result-sequence-panel')) continue

    if (element.classList.contains('reward-stat')) {
      items.push({
        label: element.querySelector('span')?.textContent ?? undefined,
        value: element.querySelector('strong')?.textContent ?? undefined,
      })
      continue
    }

    if (element.classList.contains('reward-unlock')) {
      items.push({ text: element.textContent ?? undefined })
    }
  }

  const progressFeedback = document.querySelector<HTMLElement>(WORLD_PROGRESS_SELECTOR)
  if (progressFeedback) {
    const status = progressFeedback.querySelector('span')?.textContent?.trim()
    const title = progressFeedback.querySelector('strong')?.textContent?.trim()
    const progress = progressFeedback.querySelector('p')?.textContent?.trim()
    const next = progressFeedback.querySelector('em')?.textContent?.trim()
    const detail = [title, progress, next].filter(Boolean).join(' · ')
    if (status && detail) items.push({ text: `${status}: ${detail}` })
    progressFeedback.classList.add('result-sequence-consumed')
  }

  return items
}

export function BattleResultSequence() {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [items, setItems] = useState<ResultSequenceItem[]>([])
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [storyEvent, setStoryEvent] = useState<BattleStoryEventData | null>(null)
  const activeTarget = useRef<HTMLElement | null>(null)
  const activePath = useRef('')
  const preStoryShown = useRef(false)
  const postStoryTarget = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let collectFrame = 0

    const collect = (summary: HTMLElement) => {
      if (collectFrame !== 0) return
      collectFrame = window.requestAnimationFrame(() => {
        collectFrame = 0
        setItems(buildResultSequence(readRewardItems(summary)))
      })
    }

    const scan = () => {
      const path = window.location.pathname
      if (path !== activePath.current) {
        activePath.current = path
        preStoryShown.current = false
        postStoryTarget.current = null
        setStoryEvent(null)
      }

      const nextTarget = document.querySelector<HTMLElement>('.victory-card .reward-summary')
      const battleId = getJavaScriptBattleId()

      if (battleId !== null && !nextTarget && !preStoryShown.current) {
        const preEvent = getJavaScriptPreBattleEvent(battleId)
        if (preEvent) {
          preStoryShown.current = true
          setStoryEvent(preEvent)
        }
      }

      if (nextTarget === activeTarget.current) {
        const pendingProgress = document.querySelector(WORLD_PROGRESS_SELECTOR)
        if (nextTarget && pendingProgress) collect(nextTarget)
        return
      }

      if (activeTarget.current) {
        activeTarget.current.classList.remove('result-sequence-active')
        activeTarget.current.closest<HTMLElement>('.victory-card')?.classList.remove(
          'result-sequence-host',
          'result-sequence-complete',
        )
      }

      activeTarget.current = nextTarget
      setTarget(nextTarget)
      setHost(nextTarget?.closest<HTMLElement>('.victory-card') ?? null)
      setIndex(0)
      setDone(false)

      if (!nextTarget) {
        setItems([])
        return
      }

      nextTarget.classList.add('result-sequence-active')
      nextTarget.closest<HTMLElement>('.victory-card')?.classList.add('result-sequence-host')
      collect(nextTarget)

      if (battleId !== null && postStoryTarget.current !== nextTarget && isFirstClear(nextTarget)) {
        const postEvent = getJavaScriptPostBattleEvent(battleId)
        if (postEvent) {
          postStoryTarget.current = nextTarget
          setStoryEvent(postEvent)
        }
      }
    }

    scan()
    const observer = new MutationObserver(scan)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      if (collectFrame) window.cancelAnimationFrame(collectFrame)
      activeTarget.current?.classList.remove('result-sequence-active')
      activeTarget.current?.closest<HTMLElement>('.victory-card')?.classList.remove(
        'result-sequence-host',
        'result-sequence-complete',
      )
      activeTarget.current = null
    }
  }, [])

  useEffect(() => {
    if (!host) return
    host.classList.toggle('result-sequence-complete', done)
    return () => host.classList.remove('result-sequence-complete')
  }, [done, host])

  useEffect(() => {
    if (!target || done || items.length === 0 || storyEvent) return
    const timer = window.setTimeout(() => {
      setIndex((current) => {
        if (current >= items.length - 1) {
          setDone(true)
          return current
        }
        return current + 1
      })
    }, AUTO_ADVANCE_MS)
    return () => window.clearTimeout(timer)
  }, [done, index, items.length, storyEvent, target])

  if (storyEvent) {
    return (
      <BattleStoryEvent
        event={storyEvent}
        onComplete={() => setStoryEvent(null)}
        onSkip={() => {
          setStoryEvent(null)
          if (target) setDone(true)
        }}
      />
    )
  }

  if (!target || items.length === 0) return null

  const current = items[Math.min(index, items.length - 1)]
  const advance = () => {
    if (done) return
    if (index >= items.length - 1) {
      setDone(true)
      return
    }
    setIndex((currentIndex) => currentIndex + 1)
  }

  const skip = () => setDone(true)

  return createPortal(
    <div className={`result-sequence-panel ${done ? 'is-summary' : `tone-${current.tone}`}`} aria-live="polite">
      {done ? (
        <>
          <div className="result-sequence-kicker">RESULT</div>
          <div className="result-sequence-summary">
            {items.map((item) => (
              <div key={item.id}>
                <span>{item.title}</span>
                {item.detail && <strong>{item.detail}</strong>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="result-sequence-event" key={`${current.id}:${index}`} onClick={advance}>
          <div className="result-sequence-kicker">{index + 1} / {items.length}</div>
          <strong>{current.title}</strong>
          {current.detail && <span>{current.detail}</span>}
          <small>Tap / click to continue</small>
        </div>
      )}

      {!done && (
        <div className="result-sequence-controls">
          <button type="button" className="primary-button" onClick={advance}>NEXT</button>
          <button type="button" className="secondary-button" onClick={skip}>SKIP</button>
        </div>
      )}
    </div>,
    target,
  )
}
