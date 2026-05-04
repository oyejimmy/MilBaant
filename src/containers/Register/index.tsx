import { useState } from 'react'
import { Alert, App, Form, Input } from 'antd'
import { UserOutlined, MailOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { AuthShell } from '@/components/AuthShell'
import { FormFooter } from '@/components/AuthShared/index'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { SubmitBtn, SuccessWrap, SuccessIcon, SuccessTitle, SuccessText } from './styles'
import type { RegisterValues } from './types'

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
