/**
 * ProtectedRoute — guards routes for admin/user roles.
 *
 * Access rules:
 *  - Not logged in → /login
 *  - Logged in but is_active = false → /pending (account awaiting admin approval)
 *  - Cook role → /cook-portal
 *  - Everyone else → render children
 */
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { BrandLoader } from '@/components/BrandLoader'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { sessionLoading, profileLoading, userId, profile, isCook } = useAuth()

  if (sessionLoading || profileLoading) return <BrandLoader />
  if (!userId) return <Navigate to="/login" replace />

  // Account exists but admin hasn't activated it yet
  if (profile?.is_active === false) return <Navigate to="/pending" replace />

  // Cook users have their own portal
  if (isCook) return <Navigate to="/cook-portal" replace />

  return <>{children}</>
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { sessionLoading, profileLoading, userId, profile, isCook } = useAuth()

  if (sessionLoading || profileLoading) return <BrandLoader />

  if (userId) {
    if (profile?.is_active === false) return <Navigate to="/pending" replace />
    return <Navigate to={isCook ? '/cook-portal' : '/'} replace />
  }

  return <>{children}</>
}
