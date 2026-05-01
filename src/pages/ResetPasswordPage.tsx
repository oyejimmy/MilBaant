import { useEffect, useState } from 'react'
import { Alert, App, Button, Form, Input, Spin } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { KeyOutlined, ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { AuthShell } from '@/components/AuthShell'
import { FormFooter } from '@/components/AuthShared'
import { supabase } from '@/lib/supabase'

type PageState = 'verifying' | 'ready' | 'invalid' | 'done'

/* ── Skeuomorphic submit button ─────────────────────────────────────────── */
const SubmitBtn = styled(Button)`
  && {
    height: 50px;
    font-size: 15px;
    font-weight: 700;
    border-radius: 12px;
    border: none;
    background: linear-gradient(160deg, #2d7aff 0%, #1260e8 50%, #0a4fd4 100%);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.25) inset,
      0 -1px 0 rgba(0,0,0,0.2) inset,
      0 4px 12px rgba(18,96,232,0.4),
      0 1px 3px rgba(0,0,0,0.15);
    transition: box-shadow 0.18s ease, transform 0.12s ease;

    &:hover:not(:disabled) {
      background: linear-gradient(160deg, #3d87ff 0%, #1a6ef5 50%, #1260e8 100%) !important;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.3) inset,
        0 6px 18px rgba(18,96,232,0.5),
        0 2px 6px rgba(0,0,0,0.15) !important;
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
      box-shadow: 0 2px 6px rgba(18,96,232,0.3) !important;
    }
  }
`

/* ── Status cards ────────────────────────────────────────────────────────── */
const StatusCard = styled.div`
  text-align: center;
  padding: 8px 0 16px;
`

const StatusIconWrap = styled.div<{ $variant: 'success' | 'error' | 'loading' }>`
  width: 76px;
  height: 76px;
  border-radius: 50%;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;

  /* Skeuomorphic raised circle */
  background: ${p =>
    p.$variant === 'success' ? 'linear-gradient(145deg, #f6ffed 0%, #d9f7be 100%)' :
    p.$variant === 'error'   ? 'linear-gradient(145deg, #fff2f0 0%, #ffccc7 100%)' :
                               'linear-gradient(145deg, #e8f4fc 0%, #bae0ff 100%)'};
  color: ${p =>
    p.$variant === 'success' ? '#52c41a' :
    p.$variant === 'error'   ? '#ff4d4f' :
                               '#1677ff'};
  box-shadow:
    0 1px 0 rgba(255,255,255,0.9) inset,
    0 -1px 0 rgba(0,0,0,0.06) inset,
    0 4px 14px ${p =>
      p.$variant === 'success' ? 'rgba(82,196,26,0.2)' :
      p.$variant === 'error'   ? 'rgba(255,77,79,0.2)' :
                                 'rgba(22,119,255,0.2)'},
    0 1px 4px rgba(0,0,0,0.08);
  border: 1px solid ${p =>
    p.$variant === 'success' ? 'rgba(82,196,26,0.15)' :
    p.$variant === 'error'   ? 'rgba(255,77,79,0.15)' :
                               'rgba(22,119,255,0.15)'};
`

const StatusTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 19px;
  font-weight: 700;
  color: var(--text-strong);
  font-family: 'Plus Jakarta Sans', sans-serif;
`

const StatusText = styled.p`
  margin: 0;
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.65;
`

/* ── Component ───────────────────────────────────────────────────────────── */

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
