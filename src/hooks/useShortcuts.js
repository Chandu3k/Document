import { useEffect, useRef } from 'react'

// Press G, then one of these letters
const GO = {
  o: '/',
  d: '/documents',
  s: '/subscriptions',
  c: '/calendar',
  r: '/reminders',
  p: '/settings',
}

const isTyping = (el) =>
  el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)

export default function useShortcuts({ openPalette, navigate }) {
  const pendingG = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      // Ctrl/Cmd + K works everywhere, even inside a field
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openPalette()
        return
      }

      // The rest are ignored while typing, with modifiers held, or with a dialog open
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return
      if (document.querySelector('[role="dialog"]')) return

      const key = e.key.toLowerCase()

      if (pendingG.current) {
        clearTimeout(pendingG.current)
        pendingG.current = null
        if (GO[key]) {
          e.preventDefault()
          navigate(GO[key])
        }
        return
      }

      if (key === 'g') {
        pendingG.current = setTimeout(() => {
          pendingG.current = null
        }, 1000)
        return
      }

      if (e.key === '/') {
        e.preventDefault()
        openPalette()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(pendingG.current)
      pendingG.current = null
    }
  }, [openPalette, navigate])
}