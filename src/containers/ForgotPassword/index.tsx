import { useState } from 'react'
import { Alert, App, Form, Input } from 'antd'
import { Link } from 'react-router-dom'
import { MailOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { AuthShell } from '@/components/AuthShell'
import { FormFooter } from '@/components/AuthShared/index'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { SubmitBtn, SuccessCard, SuccessIconWrap, SuccessTitle, SuccessText } from './styles'

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
