import { App } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { AuthShell } from '@/components/AuthShell'
import { supabase } from '@/lib/supabase'

/* ── Animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`

const tickPulse = keyframes`
  0%, 100% { transform: scale(1);    box-shadow: 0 4px 14px rgba(250,173,20,0.22); }
  50%       { transform: scale(1.06); box-shadow: 0 6px 22px rgba(250,173,20,0.36); }
`

/* ── Styles ─────────────────────────────────────────────────────────────── */

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px 0 4px;
  animation: ${fadeUp} 0.4s ease forwards;
`

const IconCircle = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(145deg, #fff7e6, #ffe7ba);
  border: 1.5px solid #ffd591;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin-bottom: 20px;
  animation: ${tickPulse} 2.8s ease-in-out infinite;
`

const Title = styled.h3`
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
`

const Body = styled.p`
  margin: 0 0 8px;
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.7;
  max-width: 300px;
`

const Hint = styled.p`
  margin: 0 0 24px;
  font-size: 12.5px;
  color: var(--text-muted);
  opacity: 0.7;
`

const SignOutBtn = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: #1c8ee5;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover { opacity: 0.8; }
`

/* ── Component ───────────────────────────────────────────────────────────── */

export function PendingApprovalPage() {
  const { message } = App.useApp()

  async function handleSignOut() {
    await supabase.auth.signOut()
    message.info('Signed out.')
  }

  return (
    <AuthShell
      variant="pending"
      title="Awaiting approval"
      subtitle="Your account is registered and pending admin activation."
      eyebrow="Access Restricted"
    >
      <Wrap>
        <IconCircle>
          <ClockCircleOutlined style={{ color: '#fa8c16' }} />
        </IconCircle>

        <Title>Account not yet activated</Title>

        <Body>
          Your account has been created, but an admin needs to activate it before you can access the dashboard.
        </Body>

        <Hint>Please contact your flat admin to get access.</Hint>

        <SignOutBtn onClick={() => void handleSignOut()}>
          Sign out
        </SignOutBtn>
      </Wrap>

      <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        Wrong account?{' '}
        <Link to="/login" style={{ color: '#1c8ee5', fontWeight: 600 }}>
          Sign in with a different one
        </Link>
      </div>
    </AuthShell>
  )
}
