import { useEffect } from 'react'
import { useSelector } from 'react-redux'

// Puts data-theme="light" or "dark" on the page root, following the preference.
// "system" follows the device setting and reacts if it changes.
export default function ThemeApplier() {
  const theme = useSelector((s) => s.preferences.theme)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
    }
    apply()

    if (theme !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  return null
}