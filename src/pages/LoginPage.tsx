import { useState } from 'react'
import { Alert, Button, Form, Input, message } from 'antd'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell, FormBody, FormFooter } from '@/components/AuthShell'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface LoginValues {
  email: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin(values: LoginValues) {
    if (!isSupabaseConfigured) {
      message.error('Supabase is not configured. Add environment variables and restart.')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword(values)
      if (error) throw new Error(error.message)
      message.success('Welcome back!')
      navigate('/', { replace: true })
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your flat expenses and shared bills."
    >
      {!isSupabaseConfigured && (
        <Alert
          type="warning"
          showIcon
          message="Supabase not configured"
          description="Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file."
          style={{ marginBottom: 20, borderRadius: 10 }}
        />
      )}

      <Form
        layout="vertical"
        onFinish={(values) => void handleLogin(values)}
        requiredMark={false}
      >
        <FormBody>
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
              placeholder="yasir@milbaant.com"
              size="large"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Password is required.' }]}
            style={{ marginBottom: 24 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="Enter your password"
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            block
            size="large"
            loading={submitting}
            disabled={!isSupabaseConfigured}
            style={{ fontWeight: 600, height: 48 }}
          >
            Sign In
          </Button>
        </FormBody>
      </Form>

      <FormFooter>
        Don't have an account? <Link to="/register">Create one</Link>
      </FormFooter>
    </AuthShell>
  )
}
