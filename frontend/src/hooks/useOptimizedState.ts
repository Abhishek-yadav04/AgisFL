import { useState, useCallback, useMemo, useRef } from 'react'

/**
 * Optimized state hook with throttling and memoization
 */
export function useOptimizedState<T>(initialValue: T, throttleMs: number = 1000) {
  const [state, setState] = useState<T>(initialValue)
  const lastUpdate = useRef<number>(0)
  const pendingUpdate = useRef<T | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const throttledSetState = useCallback((newValue: T | ((prev: T) => T)) => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdate.current

    const resolvedValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(pendingUpdate.current || state)
      : newValue

    pendingUpdate.current = resolvedValue

    if (timeSinceLastUpdate >= throttleMs) {
      // Update immediately
      setState(resolvedValue)
      lastUpdate.current = now
      pendingUpdate.current = null
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    } else {
      // Schedule update
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        if (pendingUpdate.current !== null) {
          setState(pendingUpdate.current)
          lastUpdate.current = Date.now()
          pendingUpdate.current = null
        }
        timeoutRef.current = null
      }, throttleMs - timeSinceLastUpdate)
    }
  }, [state, throttleMs])

  const memoizedState = useMemo(() => state, [state])

  return [memoizedState, throttledSetState] as const
}

/**
 * Debounced state hook
 */
export function useDebouncedState<T>(initialValue: T, delay: number = 300) {
  const [state, setState] = useState<T>(initialValue)
  const [debouncedState, setDebouncedState] = useState<T>(initialValue)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const setStateDebounced = useCallback((newValue: T | ((prev: T) => T)) => {
    const resolvedValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(state)
      : newValue

    setState(resolvedValue)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedState(resolvedValue)
    }, delay)
  }, [state, delay])

  return [state, debouncedState, setStateDebounced] as const
}