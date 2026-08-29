import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function isTopmostModal(dialog: HTMLElement): boolean {
  const modals = document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')
  return modals[modals.length - 1] === dialog
}

/** Keeps keyboard focus inside the currently topmost modal and restores its opener on close. */
export function useModalFocus<T extends HTMLElement>(options: {
  open: boolean
  onEscape?: () => void
}) {
  const dialogRef = useRef<T>(null)
  const onEscapeRef = useRef(options.onEscape)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const rememberFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target !== document.body) {
        lastFocusedRef.current = event.target
      }
    }
    document.addEventListener('focusin', rememberFocus)
    return () => document.removeEventListener('focusin', rememberFocus)
  }, [])

  useEffect(() => {
    onEscapeRef.current = options.onEscape
  }, [options.onEscape])

  useEffect(() => {
    if (!options.open) return
    const dialog = dialogRef.current
    if (!dialog) return
    let disposed = false
    const activeElement = document.activeElement
    const restoreFocus =
      activeElement instanceof HTMLElement && activeElement !== document.body
        ? activeElement
        : lastFocusedRef.current
    const focusable = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    const focusFirst = () => (focusable()[0] ?? dialog).focus()

    queueMicrotask(() => {
      if (!disposed) focusFirst()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTopmostModal(dialog)) return
      if (event.key === 'Escape' && onEscapeRef.current) {
        event.preventDefault()
        event.stopPropagation()
        onEscapeRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const elements = focusable()
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (!first || !last) {
        event.preventDefault()
        dialog.focus()
        return
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const onFocusIn = (event: FocusEvent) => {
      if (!isTopmostModal(dialog) || dialog.contains(event.target as Node)) return
      focusFirst()
    }

    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      disposed = true
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
      if (restoreFocus?.isConnected) restoreFocus.focus()
    }
  }, [options.open])

  return dialogRef
}
