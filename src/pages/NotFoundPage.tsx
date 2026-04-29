import { Button, Flex, Typography } from 'antd'
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import styled, { keyframes } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/* ─── Animations ──────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
`

/* ─── Styled ──────────────────────────────────────────────────────────────── */

const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-bg);
  padding: 24px;
`

const Card = styled.div`
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 48px 40px;
  text-align: center;
  max-width: 440px;
  width: 100%;
  animation: ${fadeUp} 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);

  @media (max-width: 480px) {
    padding: 36px 24px;
    border-radius: 12px;
  }
`

const BigNumber = styled.div`
  font-size: clamp(80px, 20vw, 120px);
  font-weight: 800;
  font-family: 'Plus Jakarta Sans', sans-serif;
  line-height: 1;
  color: var(--primary);
  opacity: 0.15;
  letter-spacing: -4px;
  margin-bottom: -16px;
  animation: ${float} 4s ease-in-out infinite;
  user-select: none;
`

const IconWrap = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: var(--primary-soft);
  border: 1.5px solid rgba(64, 150, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 32px;
`

/* ─── Component ───────────────────────────────────────────────────────────── */

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
