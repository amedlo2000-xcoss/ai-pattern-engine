import { useState, useEffect } from 'react'

export function useModelSelector(modelKey) {
  const [glbPath, setGlbPath] = useState(null)
  const [cacheMap, setCacheMap] = useState({})
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    fetch('/models/cache-map.json', { cache: 'no-store' })
      .then(r => r.json())
      .then(map => {
        setCacheMap(map)
        const entry = modelKey ? map[modelKey] : null
        setGlbPath(entry || null)
        setChecked(true)
      })
      .catch(() => {
        setChecked(true)
      })
  }, [modelKey])

  const hasCached = checked && !!glbPath

  return { glbPath, cacheMap, hasCached, checked }
}
