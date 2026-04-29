import { useState } from 'react'
import { Alert, App, Button, Form, Input, Result } from 'antd'
import { Link } from 'react-router-dom'
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { AuthShell, FormFooter } from '@/components/AuthShell'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

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
      // Always redirect to the production URL so the reset link works regardless
      // of where the email is opened (local dev, mobile, etc.)
      const redirectTo = 'https://milbaant.vercel.app/reset-password'
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo,
      })
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
        title="Check your inbox"
        subtitle="A password reset link has been sent to your email."
      >
        <Result
          status="success"
          icon={<MailOutlined style={{ color: 'var(--primary)', fontSize: 48 }} />}
          title="Reset link sent!"
          subTitle={
            <>
              We sent a password reset link to{' '}
              <strong>{sentEmail}</strong>. Check your inbox (and spam folder)
              and click the link to set a new password.
            </>
          }
          style={{ padding: '16px 0' }}
        />
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
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a link to reset your password."
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
        >
          <Input
            prefix={<MailOutlined style={{ color: 'var(--text-muted)' }} />}
            placeholder="Enter your account email"
            size="large"
            autoComplete="email"
            autoFocus
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            htmlType="submit"
            type="primary"
            block
            size="large"
            loading={submitting}
            disabled={!isSupabaseConfigured}
            style={{ fontWeight: 600, height: 46 }}
          >
            Send Reset Link
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
