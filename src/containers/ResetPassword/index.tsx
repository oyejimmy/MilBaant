import { useEffect, useState } from 'react'
import { Alert, App, Form, Input, Spin } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { KeyOutlined, ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { AuthShell } from '@/components/AuthShell'
import { FormFooter } from '@/components/AuthShared/index'
import { supabase } from '@/lib/supabase'
import { SubmitBtn, StatusCard, StatusIconWrap, StatusTitle, StatusText } from './styles'
import type { PageState } from './types'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [pageState, setPageState] = useState<PageState>('verifying')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPageState('ready')
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setPageState('ready')
      } else {
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
      await supabase.auth.signOut()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Verifying ── */
  if (pageState === 'verifying') {
    return (
      <AuthShell variant="reset" title="Verifying link…" subtitle="Please wait while we verify your reset link.">
        <StatusCard>
          <StatusIconWrap $variant="loading">
            <Spin size="large" />
          </StatusIconWrap>
          <StatusTitle>Verifying your link</StatusTitle>
          <StatusText>Hang tight, this only takes a moment…</StatusText>
        </StatusCard>
      </AuthShell>
    )
  }

  /* ── Invalid ── */
  if (pageState === 'invalid') {
    return (
      <AuthShell variant="reset" title="Link expired" subtitle="This password reset link is no longer valid.">
        <StatusCard>
          <StatusIconWrap $variant="error">
            <CloseCircleOutlined />
          </StatusIconWrap>
          <StatusTitle>Link invalid or expired</StatusTitle>
          <StatusText>
            Password reset links expire after 1 hour.
            <br />
            Please request a new one.
          </StatusText>
        </StatusCard>
        <FormFooter>
          <Link to="/forgot-password">Request a new link</Link>
          {' · '}
          <Link to="/login">Back to Sign In</Link>
        </FormFooter>
      </AuthShell>
    )
  }

  /* ── Done ── */
  if (pageState === 'done') {
    return (
      <AuthShell variant="reset" title="Password updated" subtitle="Your password has been changed successfully.">
        <StatusCard>
          <StatusIconWrap $variant="success">
            <CheckCircleOutlined />
          </StatusIconWrap>
          <StatusTitle>Password updated!</StatusTitle>
          <StatusText>You can now sign in with your new password.</StatusText>
        </StatusCard>
        <div style={{ marginTop: 24 }}>
          <SubmitBtn
            type="primary"
            block
            onClick={() => navigate('/login', { replace: true })}
          >
            Go to Sign In
          </SubmitBtn>
        </div>
      </AuthShell>
    )
  }

  /* ── Ready — form ── */
  return (
    <AuthShell
      variant="reset"
      title="Set new password"
      subtitle="Choose a strong password for your account."
    >
      <Alert
        type="info"
        showIcon
        message="You're setting a new password for your account."
        style={{ marginBottom: 22 }}
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
            prefix={<KeyOutlined style={{ color: 'var(--text-muted)', marginRight: 2 }} />}
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
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve()
                return Promise.reject(new Error('Passwords do not match.'))
              },
            }),
          ]}
          style={{ marginBottom: 26 }}
        >
          <Input.Password
            prefix={<KeyOutlined style={{ color: 'var(--text-muted)', marginRight: 2 }} />}
            placeholder="Confirm new password"
            size="large"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <SubmitBtn
            htmlType="submit"
            type="primary"
            block
            loading={submitting}
          >
            Update Password
          </SubmitBtn>
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
