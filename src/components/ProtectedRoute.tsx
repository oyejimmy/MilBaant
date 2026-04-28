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
      style={{ 
        minHeight: '100vh', 
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--content-bg)',
        zIndex: 9999
      }}
    >
      <LoadingOutlined style={{ fontSize: 48, color: '#909ffa' }} spin />
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
