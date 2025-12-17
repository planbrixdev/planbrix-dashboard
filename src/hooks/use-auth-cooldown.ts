import { useState, useEffect, useCallback } from 'react'

export function useAuthCooldown() {
  const [cooldown, setCooldown] = useState(0)
  const key = 'auth-cooldown-global'

  useEffect(() => {
    const stored = localStorage.getItem(key)
    if (stored) {
      const { timestamp, duration } = JSON.parse(stored)
      const now = Date.now()
      const elapsed = Math.floor((now - timestamp) / 1000)
      const remaining = duration - elapsed
      
      if (remaining > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCooldown(remaining)
      } else {
        localStorage.removeItem(key)
      }
    }
  }, [key])

  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setInterval(() => {
      const stored = localStorage.getItem(key)
      if (!stored) {
        setCooldown(0)
        return
      }
      
      const { timestamp, duration } = JSON.parse(stored)
      const now = Date.now()
      const elapsed = Math.floor((now - timestamp) / 1000)
      const remaining = duration - elapsed
      
      if (remaining <= 0) {
        setCooldown(0)
        localStorage.removeItem(key)
      } else {
        setCooldown(remaining)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown, key])

  const startCooldown = useCallback((duration: number = 60) => {
    setCooldown(duration)
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      duration
    }))
  }, [])

  return { cooldown, startCooldown }
}
