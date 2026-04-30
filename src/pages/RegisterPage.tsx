import { useState } from 'react'
import { Alert, App, Button, Form, Input } from 'antd'
import { UserOutlined, MailOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
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

/* ── Success screen ──────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`

const SuccessWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px 0 4px;
  animation: ${fadeUp} 0.4s ease forwards;
`

const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(145deg, #f6ffed, #d9f7be);
  border: 1.5px solid #95de64;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 18px;
  box-shadow: 0 4px 14px rgba(82,196,26,0.2);
`

const SuccessTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-strong);
`

const SuccessText = styled.p`
  margin: 0 0 22px;
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.65;
  max-width: 300px;
`

/* ── Types ───────────────────────────────────────────────────────────────── */

interface RegisterValues {
  full_name: string
  email: string
  password: string
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function RegisterPage() {
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleRegister(values: RegisterValues) {
    if (!isSupabaseConfigured) {
      message.error('Supabase is not configured. Add environment variables and restart.')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        options: { data: { full_name: values.full_name.trim() } },
      })
      if (error) throw new Error(error.message)

      // Always sign them out after registration — admin must activate first
      await supabase.auth.signOut()
      setDone(true)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to register.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Post-registration success screen ── */
  if (done) {
    return (
      <AuthShell
        variant="register"
        title="Account created"
        subtitle="You're almost in — just waiting on admin approval."
        eyebrow="Registration Complete"
      >
        <SuccessWrap>
          <SuccessIcon>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          </SuccessIcon>
          <SuccessTitle>Request submitted!</SuccessTitle>
          <SuccessText>
            Your account has been created. An admin will review and activate it shortly.
            You'll be able to sign in once your account is approved.
          </SuccessText>
          <Link to="/login" style={{ fontSize: 13.5, fontWeight: 600, color: '#1c8ee5' }}>
            Back to sign in
          </Link>
        </SuccessWrap>
      </AuthShell>
    )
  }

  /* ── Registration form ── */
  return (
    <AuthShell
      variant="register"
      title="Create account"
      subtitle="Join your flat and start tracking shared expenses together."
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
        onFinish={(values) => void handleRegister(values as RegisterValues)}
        requiredMark={false}
      >
        <Form.Item
          label="Full name"
          name="full_name"
          rules={[{ required: true, message: 'Full name is required.' }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: 'var(--text-muted)', marginRight: 2 }} />}
            placeholder="Your full name"
            size="large"
            autoComplete="name"
          />
        </Form.Item>

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
          rules={[
            { required: true, message: 'Password is required.' },
            { min: 6, message: 'Use at least 6 characters.' },
          ]}
          style={{ marginBottom: 24 }}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: 'var(--text-muted)', marginRight: 2 }} />}
            placeholder="At least 6 characters"
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
            disabled={!isSupabaseConfigured}
          >
            Create Account
          </SubmitBtn>
        </Form.Item>
      </Form>

      <FormFooter>
        Already have an account?{' '}
        <Link to="/login">Sign in</Link>
      </FormFooter>
    </AuthShell>
  )
}
