/**
 * CookRoute — guards routes that are accessible to the cook role.
 *
 * - Unauthenticated users → /login
 * - Authenticated non-cook users → / (regular app)
 * - Cook users → renders children
 */
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { BrandLoader } from '@/components/BrandLoader'
import { useAuth } from '@/hooks/useAuth'

export function CookRoute({ children }: { children: ReactNode }) {
  const { sessionLoading, profileLoading, userId, isCook } = useAuth()

  if (sessionLoading || profileLoading) return <BrandLoader />
  if (!userId) return <Navigate to="/login" replace />

  // Non-cook users go to the regular app
  if (!isCook) return <Navigate to="/" replace />

  return <>{children}</>
}
