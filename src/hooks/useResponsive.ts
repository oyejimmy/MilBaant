import { useEffect, useState } from 'react'

export interface ResponsiveBreakpoints {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouch: boolean
  width: number
  height: number
}

/**
 * Custom hook for responsive design breakpoints
 * 
 * Breakpoints:
 * - Mobile: < 768px
 * - Tablet: 768px - 1023px
 * - Desktop: >= 1024px
 * 
 * Touch: Mobile or Tablet (for touch-friendly UI)
 */
export function useResponsive(): ResponsiveBreakpoints {
  const [breakpoints, setBreakpoints] = useState<ResponsiveBreakpoints>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024
    const height = typeof window !== 'undefined' ? window.innerHeight : 768
    const isMobile = width < 768
    const isTablet = width >= 768 && width < 1024
    const isDesktop = width >= 1024
    const isTouch = isMobile || isTablet

    return { isMobile, isTablet, isDesktop, isTouch, width, height }
  })

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const handleResize = () => {
      // Debounce resize events for performance
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const width = window.innerWidth
        const height = window.innerHeight
        const isMobile = width < 768
        const isTablet = width >= 768 && width < 1024
        const isDesktop = width >= 1024
        const isTouch = isMobile || isTablet

        setBreakpoints({ isMobile, isTablet, isDesktop, isTouch, width, height })
      }, 150)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return breakpoints
}

/**
 * Hook to get touch-friendly button size
 * Returns 'large' for mobile/tablet, 'middle' for desktop
 */
export function useButtonSize(): 'large' | 'middle' {
  const { isTouch } = useResponsive()
  return isTouch ? 'large' : 'middle'
}

/**
 * Hook to determine if component should use mobile layout
 * Useful for conditional rendering of mobile vs desktop components
 */
export function useMobileLayout(): boolean {
  const { isMobile } = useResponsive()
  return isMobile
}
