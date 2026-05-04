import { useState } from 'react'
import { Alert, App, Form, Input } from 'antd'
import { MailOutlined, LockOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/AuthShell'
import { FormFooter } from '@/components/AuthShared/index'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { SubmitBtn, PendingWrap, PendingIcon, PendingTitle, PendingText, SignOutLink } from './styles'
import type { LoginValues } from './types'

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
