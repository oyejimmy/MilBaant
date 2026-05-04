import { Button, Flex, Typography } from 'antd'
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Wrap, Card, BigNumber, IconWrap } from './styles'

export function NotFoundPage() {
  const navigate  = useNavigate()
  const { userId, isCook } = useAuth()

  const homeRoute = !userId ? '/login' : isCook ? '/cook-portal' : '/'
  const homeLabel = !userId ? 'Go to Login' : isCook ? 'Cook Dashboard' : 'Dashboard'

  return (
    <Wrap>
      <Card>
        <BigNumber>404</BigNumber>

        <IconWrap>
          {/* Simple compass/lost icon using text */}
          <span style={{ fontSize: 32 }}>🧭</span>
        </IconWrap>

        <Typography.Title
          level={3}
          style={{ margin: '0 0 8px', color: 'var(--text-strong)' }}
        >
          Page not found
        </Typography.Title>

        <Typography.Text
          style={{
            color: 'var(--text-muted)',
            fontSize: 14,
            display: 'block',
            marginBottom: 28,
            lineHeight: 1.6,
          }}
        >
          The page you're looking for doesn't exist or you don't have
          permission to access it.
        </Typography.Text>

        <Flex gap={10} justify="center" wrap="wrap">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            size="large"
            style={{ minWidth: 120 }}
          >
            Go Back
          </Button>
          <Button
            type="primary"
            icon={<HomeOutlined />}
            onClick={() => navigate(homeRoute, { replace: true })}
            size="large"
            style={{ minWidth: 140 }}
          >
            {homeLabel}
          </Button>
        </Flex>
      </Card>
    </Wrap>
  )
}
