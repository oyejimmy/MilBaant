/**
 * ProtectedRoute — guards routes for admin/user roles.
 * Cook users are redirected to their dedicated portal.
 */
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { BrandLoader } from '@/components/BrandLoader'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { sessionLoading, profileLoading, userId, isCook } = useAuth()
  if (sessionLoading || profileLoading) return <BrandLoader />
  if (!userId) return <Navigate to="/login" replace />
  // Cook users have their own portal
  if (isCook) return <Navigate to="/cook-portal" replace />
  return <>{children}</>
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { sessionLoading, profileLoading, userId, isCook } = useAuth()
  if (sessionLoading || profileLoading) return <BrandLoader />
  if (userId) return <Navigate to={isCook ? '/cook-portal' : '/'} replace />
  return <>{children}</>
}
