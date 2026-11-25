import { useEffect, useState } from 'react'

/** True while the media query matches (e.g. '(max-width: 900px)'). */
export function useMedia(query) {
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches
  const [on, setOn] = useState(get)
  useEffect(() => {
    const m = window.matchMedia(query)
    const fn = () => setOn(m.matches)
    fn(); m.addEventListener('change', fn)
    return () => m.removeEventListener('change', fn)
  }, [query])
  return on
}
