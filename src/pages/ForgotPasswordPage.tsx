import { useState } from 'react'
import { Alert, App, Button, Form, Input } from 'antd'
import { Link } from 'react-router-dom'
import { MailOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { AuthShell } from '@/components/AuthShell'
import { FormFooter } from '@/components/AuthShared'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

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

/* ── Success card ────────────────────────────────────────────────────────── */
const SuccessCard = styled.div`
  text-align: center;
  padding: 8px 0 16px;
`

const SuccessIconWrap = styled.div`
  width: 76px;
  height: 76px;
  border-radius: 50%;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  color: #1677ff;

  /* Skeuomorphic raised circle */
  background: linear-gradient(145deg, #e8f4fc 0%, #bae0ff 100%);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.9) inset,
    0 -1px 0 rgba(0,0,0,0.06) inset,
    0 4px 14px rgba(22,119,255,0.2),
    0 1px 4px rgba(0,0,0,0.08);
  border: 1px solid rgba(22,119,255,0.15);
`

const SuccessTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 19px;
  font-weight: 700;
  color: var(--text-strong);
  font-family: 'Plus Jakarta Sans', sans-serif;
`

const SuccessText = styled.p`
  margin: 0;
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.65;
`

/* ── Component ───────────────────────────────────────────────────────────── */

export function ForgotPasswordPage() {
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  async function handleSubmit(values: { email: string }) {
    if (!isSupabaseConfigured) {
      message.error('Supabase is not configured.')
      return
    }
    setSubmitting(true)
    try {
      const redirectTo = 'https://milbaant.vercel.app/reset-password'
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo })
      if (error) throw new Error(error.message)
      setSentEmail(values.email)
      setSent(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('over_email')) {
        message.error('Too many reset attempts. Please wait a few minutes and try again.')
      } else {
        message.error(msg || 'Unable to send reset email.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthShell
        variant="forgot"
        title="Check your inbox"
        subtitle="A password reset link has been sent to your email."
      >
        <SuccessCard>
          <SuccessIconWrap>
            <CheckCircleOutlined />
          </SuccessIconWrap>
          <SuccessTitle>Reset link sent!</SuccessTitle>
          <SuccessText>
            We sent a reset link to{' '}
            <strong style={{ color: 'var(--text-strong)' }}>{sentEmail}</strong>.
            <br />
            Check your inbox (and spam folder) and click the link.
          </SuccessText>
        </SuccessCard>
        <FormFooter>
          <Link to="/login">
            <ArrowLeftOutlined style={{ marginRight: 6 }} />
            Back to Sign In
          </Link>
        </FormFooter>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      variant="forgot"
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a link to reset your password."
    >
      {!isSupabaseConfigured && (
        <Alert
          type="warning"
          showIcon
          message="Supabase not configured"
          description="Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file."
          style={{ marginBottom: 22 }}
        />
      )}

      <Form
        layout="vertical"
        onFinish={(v) => void handleSubmit(v)}
        requiredMark={false}
      >
        <Form.Item
          label="Email address"
          name="email"
          rules={[
            { required: true, message: 'Email is required.' },
            { type: 'email', message: 'Enter a valid email.' },
          ]}
          style={{ marginBottom: 26 }}
        >
          <Input
            prefix={<MailOutlined style={{ color: 'var(--text-muted)', marginRight: 2 }} />}
            placeholder="you@example.com"
            size="large"
            autoComplete="email"
            autoFocus
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
            Send Reset Link
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
