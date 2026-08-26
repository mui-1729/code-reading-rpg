import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { buildResultSequence, type RawResultItem, type ResultSequenceItem } from './resultSequence'

const AUTO_ADVANCE_MS = 1100

const readRewardItems = (summary: HTMLElement): RawResultItem[] => {
  const items = Array.from(summary.children).flatMap((element) => {
    if (!(element instanceof HTMLElement)) return []
    if (element.classList.contains('result-sequence-panel')) return []

    if (element.classList.contains('reward-stat')) {
      return [{
        label: element.querySelector('span')?.textContent ?? undefined,
        value: element.querySelector('strong')?.textContent ?? undefined,
      }]
    }

    if (element.classList.contains('reward-unlock')) {
      return [{ text: element.textContent ?? undefined }]
    }

    return []
  })

  const questFeedback = document.querySelector<HTMLElement>('.quest-victory-feedback')
  if (questFeedback) {
    const status = questFeedback.querySelector('span')?.textContent?.trim()
    const title = questFeedback.querySelector('strong')?.textContent?.trim()
    const next = questFeedback.querySelector('em')?.textContent?.trim()
    const completed = questFeedback.querySelector('p')?.textContent?.trim()
    const detail = [title, completed, next].filter(Boolean).join(' · ')
    if (status && detail) items.push({ text: `${status}: ${detail}` })
    questFeedback.classList.add('result-sequence-consumed')
  }

  return items
}

export function BattleResultSequence() {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [items, setItems] = useState<ResultSequenceItem[]>([])
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const activeTarget = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let collectFrame = 0

    const scan = () => {
      const nextTarget = document.querySelector<HTMLElement>('.victory-card .reward-summary')
      if (nextTarget === activeTarget.current) return

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

      collectFrame = window.requestAnimationFrame(() => {
        setItems(buildResultSequence(readRewardItems(nextTarget)))
      })
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
    if (!target || done || items.length === 0) return
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
  }, [done, index, items.length, target])

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
