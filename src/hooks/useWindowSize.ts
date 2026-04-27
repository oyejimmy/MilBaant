import { useCallback, useEffect, useState } from 'react'

interface WindowSize {
  width: number
  height: number
}

function getSize(): WindowSize {
  return { width: window.innerWidth, height: window.innerHeight }
}

export function useWindowSize(debounceMs = 300): WindowSize {
  const [size, setSize] = useState<WindowSize>(getSize)

  const handleResize = useCallback(() => {
    let timer: ReturnType<typeof setTimeout>
    return () => {
      clearTimeout(timer)
      timer = setTimeout(() => setSize(getSize()), debounceMs)
    }
  }, [debounceMs])

  useEffect(() => {
    const handler = handleResize()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [handleResize])

  return size
}
