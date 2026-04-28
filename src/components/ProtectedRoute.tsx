import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { BrandLoader } from '@/components/BrandLoader'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { sessionLoading, userId } = useAuth()
  if (sessionLoading) return <BrandLoader />
  if (!userId) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { sessionLoading, userId } = useAuth()
  if (sessionLoading) return <BrandLoader />
  if (userId) return <Navigate to="/" replace />
  return <>{children}</>
}
