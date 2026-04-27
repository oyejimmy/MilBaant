import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Flex } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { useAuth } from '@/hooks/useAuth'

function FullscreenLoader() {
  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: '100vh', width: '100%' }}
    >
      <LoadingOutlined style={{ fontSize: 40, color: '#909ffa' }} spin />
    </Flex>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { sessionLoading, userId } = useAuth()
  if (sessionLoading) return <FullscreenLoader />
  if (!userId) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { sessionLoading, userId } = useAuth()
  if (sessionLoading) return <FullscreenLoader />
  if (userId) return <Navigate to="/" replace />
  return <>{children}</>
}
