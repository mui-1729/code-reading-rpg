import { useEffect, useLayoutEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

let scrollLockCount = 0
let previousBodyOverflow = ''

/** A covered result and its foreground Story may overlap during React transitions. */
function lockBackgroundScroll() {
  if (scrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  scrollLockCount += 1
  return () => {
    scrollLockCount -= 1
    if (scrollLockCount === 0) document.body.style.overflow = previousBodyOverflow
  }
}

function isTopmostModal(dialog: HTMLElement): boolean {
  const modals = document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')
  return modals[modals.length - 1] === dialog
}

/** Keeps keyboard focus inside the currently topmost modal and restores its opener on close. */
export function useModalFocus<T extends HTMLElement>(options: {
  open: boolean
  active?: boolean
  getRestoreFocusTarget?: () => HTMLElement | null
  onEscape?: () => void
}) {
  const { active = true, getRestoreFocusTarget, onEscape, open } = options
  const dialogRef = useRef<T>(null)
  const onEscapeRef = useRef(onEscape)
  const lastFocusedRef = useRef<HTMLElement | null>(null)
  const activeRef = useRef(active)
  const focusFirstRef = useRef<(() => void) | null>(null)

  useLayoutEffect(() => {
    activeRef.current = active
  }, [active])

  useLayoutEffect(() => {
    if (open) return lockBackgroundScroll()
  }, [open])

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
    onEscapeRef.current = onEscape
  }, [onEscape])

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (!dialog) return
    let disposed = false
    const requestedRestoreFocus = getRestoreFocusTarget?.()
    const activeElement = document.activeElement
    const restoreFocus =
      requestedRestoreFocus ?? (activeElement instanceof HTMLElement && activeElement !== document.body
        ? activeElement
        : lastFocusedRef.current)
    const focusable = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) =>
          element.tabIndex >= 0 &&
          element.getClientRects().length > 0 &&
          getComputedStyle(element).visibility !== 'hidden' &&
          !element.closest('[inert]'),
      )
    const focusFirst = () => {
      if (
        !activeRef.current ||
        !isTopmostModal(dialog) ||
        dialog.closest('[inert]') ||
        dialog.closest('[aria-hidden="true"]')
      ) return
      const focusTarget = focusable()[0] ?? dialog
      focusTarget.focus()
    }
    focusFirstRef.current = focusFirst

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
      focusFirstRef.current = null
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
      queueMicrotask(() => {
        if (
          restoreFocus?.isConnected &&
          !restoreFocus.closest('[inert]') &&
          !restoreFocus.closest('[aria-hidden="true"]')
        ) restoreFocus.focus()
      })
    }
  }, [getRestoreFocusTarget, open])

  useEffect(() => {
    if (!open || !active) return
    queueMicrotask(() => {
      if (dialogRef.current?.contains(document.activeElement)) return
      focusFirstRef.current?.()
    })
  }, [active, open])

  return dialogRef
}
