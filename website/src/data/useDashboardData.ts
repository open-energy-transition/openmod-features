import { useEffect, useState } from 'react'
import type { DashboardData } from './types'

type DataState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: DashboardData; error: null }
  | { status: 'error'; data: null; error: Error }

export function useDashboardData(): DataState {
  const [state, setState] = useState<DataState>({
    status: 'loading',
    data: null,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '')
    const dataUrl = `${baseUrl}/data/features.json`

    fetch(dataUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load dashboard data (${response.status})`)
        }
        return response.json() as Promise<DashboardData>
      })
      .then((data) => {
        if (!cancelled) {
          setState({ status: 'ready', data, error: null })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error instanceof Error ? error : new Error(String(error)),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
