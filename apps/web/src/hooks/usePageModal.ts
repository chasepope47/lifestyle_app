import { useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function usePageModal() {
  const searchParams = useSearchParams()
  const modalMode = searchParams.get('modal') === 'true'

  const createModalUrl = useCallback((href: string) => {
    return `${href}?modal=true`
  }, [])

  return { modalMode, createModalUrl }
}
