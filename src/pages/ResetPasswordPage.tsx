import { useEffect, useState } from 'react'
import { Alert, App, Button, Form, Input, Result, Spin } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { KeyOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { AuthShell, FormFooter } from '@/components/AuthShell'
import { supabase } from '@/lib/supabase'

type PageState = 'verifying' | 'ready' | 'invalid' | 'done'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [pageState, setPageState] = useState<PageState>('verifying')
  const [submitting, setSubmitting] = useState(false)

  // Supabase appends the recovery tokens as a URL hash fragment.
  // supabase-js v2 picks them up automatically via onAuthStateChange
  // and fires a PASSWORD_RECOVERY event, which means the user is now
  // in a temporary authenticated session — just enough to call updateUser.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('ready')
      }
    })

    // Also check if there's already an active session with a recovery token
    // (handles page refresh after the hash has been consumed)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setPageState('ready')
      } else {
        // Give the hash-based token a moment to be processed
        const timer = setTimeout(() => {
          setPageState((prev) => (prev === 'verifying' ? 'invalid' : prev))
        }, 3000)
        return () => clearTimeout(timer)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(values: { newPassword: string }) {
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: values.newPassword })
      if (error) throw new Error(error.message)
      setPageState('done')
      message.success('Password updated!')
      // Sign out so the user logs in fresh with the new password
      await supabase.auth.signOut()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Verifying token ──────────────────────────────────────────────────────
  if (pageState === 'verifying') {
    return (
      <AuthShell title="Verifying link…" subtitle="Please wait while we verify your reset link.">
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 14 }}>
            Verifying your reset link…
          </p>
        </div>
      </AuthShell>
    )
  }

  // ── Invalid / expired link ───────────────────────────────────────────────
  if (pageState === 'invalid') {
    return (
      <AuthShell title="Link expired" subtitle="This password reset link is no longer valid.">
        <Result
          status="error"
          title="Reset link invalid or expired"
          subTitle="Password reset links expire after 1 hour. Please request a new one."
          style={{ padding: '16px 0' }}
        />
        <FormFooter>
          <Link to="/forgot-password">Request a new link</Link>
          {' · '}
          <Link to="/login">Back to Sign In</Link>
        </FormFooter>
      </AuthShell>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (pageState === 'done') {
    return (
      <AuthShell title="Password updated" subtitle="Your password has been changed successfully.">
        <Result
          icon={<CheckCircleOutlined style={{ color: 'var(--success, #52c41a)', fontSize: 52 }} />}
          title="Password updated!"
          subTitle="You can now sign in with your new password."
          style={{ padding: '16px 0' }}
          extra={
            <Button type="primary" size="large" onClick={() => navigate('/login', { replace: true })}>
              Go to Sign In
            </Button>
          }
        />
      </AuthShell>
    )
  }

  // ── Ready — show the form ────────────────────────────────────────────────
  return (
    <AuthShell
      title="Set new password"
      subtitle="Choose a strong password for your account."
    >
      <Alert
        type="info"
        showIcon
        message="You're setting a new password for your account."
        style={{ marginBottom: 20 }}
      />

      <Form
        layout="vertical"
        onFinish={(v) => void handleSubmit(v)}
        requiredMark={false}
      >
        <Form.Item
          label="New password"
          name="newPassword"
          rules={[
            { required: true, message: 'Please enter a new password.' },
            { min: 6, message: 'Password must be at least 6 characters.' },
          ]}
        >
          <Input.Password
            prefix={<KeyOutlined style={{ color: 'var(--text-muted)' }} />}
            placeholder="Enter new password"
            size="large"
            autoComplete="new-password"
            autoFocus
          />
        </Form.Item>

        <Form.Item
          label="Confirm new password"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Please confirm your password.' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('Passwords do not match.'))
              },
            }),
          ]}
          style={{ marginBottom: 24 }}
        >
          <Input.Password
            prefix={<KeyOutlined style={{ color: 'var(--text-muted)' }} />}
            placeholder="Confirm new password"
            size="large"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            htmlType="submit"
            type="primary"
            block
            size="large"
            loading={submitting}
            style={{ fontWeight: 600, height: 46 }}
          >
            Update Password
          </Button>
        </Form.Item>
      </Form>

      <FormFooter>
        <Link to="/login">
          <ArrowLeftOutlined style={{ marginRight: 6 }} />
          Back to Sign In
        </Link>
      </FormFooter>
    </AuthShell>
  )
}
