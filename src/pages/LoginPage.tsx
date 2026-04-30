import { useState } from 'react'
import { Alert, App, Button, Form, Input } from 'antd'
import { MailOutlined, LockOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { AuthShell, FormFooter } from '@/components/AuthShell'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

/* ── Submit button ───────────────────────────────────────────────────────── */

const SubmitBtn = styled(Button)`
  && {
    height: 48px;
    font-size: 14.5px;
    font-weight: 700;
    border-radius: 11px;
    border: none;
    letter-spacing: 0.2px;
    background: linear-gradient(155deg, #1465a3 0%, #1c8ee5 55%, #2fa8f5 100%);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.22) inset,
      0 -1px 0 rgba(0,0,0,0.18) inset,
      0 4px 14px rgba(28,142,229,0.42),
      0 1px 3px rgba(0,0,0,0.12);
    transition: box-shadow 0.16s ease, transform 0.12s ease;

    &:hover:not(:disabled) {
      background: linear-gradient(155deg, #1a72b8 0%, #2299f0 55%, #3db5ff 100%) !important;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.28) inset,
        0 6px 20px rgba(28,142,229,0.52),
        0 2px 6px rgba(0,0,0,0.12) !important;
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
      box-shadow: 0 2px 6px rgba(28,142,229,0.3) !important;
    }
  }
`

/* ── Pending approval screen ─────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`

const PendingWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px 0 4px;
  animation: ${fadeUp} 0.4s ease forwards;
`

const PendingIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(145deg, #fff7e6, #ffe7ba);
  border: 1.5px solid #ffd591;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 18px;
  box-shadow: 0 4px 14px rgba(250,173,20,0.22);
`

const PendingTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-strong);
`

const PendingText = styled.p`
  margin: 0 0 22px;
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.65;
  max-width: 300px;
`

const SignOutLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: #1c8ee5;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
`

/* ── Types ───────────────────────────────────────────────────────────────── */

interface LoginValues {
  email: string
  password: string
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function LoginPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleLogin(values: LoginValues) {
    if (!isSupabaseConfigured) {
      message.error('Supabase is not configured. Add environment variables and restart.')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword(values)
      if (error) throw new Error(error.message)

      const userId = data.session?.user.id
      if (!userId) throw new Error('Sign-in failed — no session returned.')

      // Check if admin has activated this account
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', userId)
        .single()

      if (profileError) throw new Error(profileError.message)

      if (profile?.is_active === false) {
        // Account exists but not yet approved — sign them back out and show pending screen
        await supabase.auth.signOut()
        setPending(true)
        return
      }

      navigate('/', { replace: true })
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setPending(false)
  }

  /* ── Pending approval screen ── */
  if (pending) {
    return (
      <AuthShell
        variant="pending"
        title="Awaiting approval"
        subtitle="Your account has been created and is pending admin activation."
        eyebrow="Access Restricted"
      >
        <PendingWrap>
          <PendingIcon>
            <ClockCircleOutlined style={{ color: '#fa8c16' }} />
          </PendingIcon>
          <PendingTitle>Account not yet activated</PendingTitle>
          <PendingText>
            Your account is registered but an admin needs to activate it before you can access the dashboard.
            Please contact your flat admin.
          </PendingText>
          <SignOutLink onClick={() => void handleSignOut()}>
            Back to sign in
          </SignOutLink>
        </PendingWrap>
      </AuthShell>
    )
  }

  /* ── Login form ── */
  return (
    <AuthShell
      variant="login"
      title="Welcome back"
      subtitle="Sign in to manage your flat expenses and shared bills."
    >
      {!isSupabaseConfigured && (
        <Alert
          type="warning"
          showIcon
          message="Supabase not configured"
          description="Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file."
          style={{ marginBottom: 20 }}
        />
      )}

      <Form
        layout="vertical"
        onFinish={(values) => void handleLogin(values as LoginValues)}
        requiredMark={false}
      >
        <Form.Item
          label="Email address"
          name="email"
          rules={[
            { required: true, message: 'Email is required.' },
            { type: 'email', message: 'Enter a valid email.' },
          ]}
        >
          <Input
            prefix={<MailOutlined style={{ color: 'var(--text-muted)', marginRight: 2 }} />}
            placeholder="you@example.com"
            size="large"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Password is required.' }]}
          style={{ marginBottom: 6 }}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: 'var(--text-muted)', marginRight: 2 }} />}
            placeholder="Enter your password"
            size="large"
            autoComplete="current-password"
          />
        </Form.Item>

        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <Link to="/forgot-password" style={{ fontSize: 12.5, fontWeight: 600, color: '#1c8ee5' }}>
            Forgot password?
          </Link>
        </div>

        <Form.Item style={{ marginBottom: 0 }}>
          <SubmitBtn
            htmlType="submit"
            type="primary"
            block
            loading={submitting}
            disabled={!isSupabaseConfigured}
          >
            Sign In
          </SubmitBtn>
        </Form.Item>
      </Form>

      <FormFooter>
        Don't have an account?{' '}
        <Link to="/register">Create one</Link>
      </FormFooter>
    </AuthShell>
  )
}
