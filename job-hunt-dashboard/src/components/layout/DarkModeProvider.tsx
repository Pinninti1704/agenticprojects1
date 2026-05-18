import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

export function DarkModeProvider() {
  const darkMode = useSettingsStore((s) => s.app.darkMode)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
    }
  }, [darkMode])

  return null
}