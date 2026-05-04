import { App } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { AuthShell } from '@/components/AuthShell'
import { supabase } from '@/lib/supabase'
import { Wrap, IconCircle, Title, Body, Hint, SignOutBtn } from './styles'

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
