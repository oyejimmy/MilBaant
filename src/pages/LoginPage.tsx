import { useState } from 'react'
import { Alert, Button, Form, Input, Typography, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/AuthShell'
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
      message.error(
        'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env and restart the app.',
      )
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithPassword(values)

      if (error) {
        throw new Error(error.message)
      }

      message.success('Welcome back.')
      navigate('/', { replace: true })
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Unable to sign in right now.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Sign In"
      subtitle="Log in with your email and password to manage shared flat expenses."
    >
      {!isSupabaseConfigured ? (
        <Alert
          type="warning"
          showIcon
          message="Supabase environment variables are missing."
          description="Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before signing in."
        />
      ) : null}

      <Form layout="vertical" onFinish={(values) => void handleLogin(values)}>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please enter your email.' },
            { type: 'email', message: 'Please enter a valid email.' },
          ]}
        >
          <Input placeholder="you@example.com" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please enter your password.' }]}
        >
          <Input.Password placeholder="Your password" />
        </Form.Item>

        <Button
          htmlType="submit"
          type="primary"
          block
          loading={submitting}
          disabled={!isSupabaseConfigured}
        >
          Sign In
        </Button>
      </Form>

      <Typography.Text style={{ color: 'var(--text-base)' }}>
        Need an account? <Link to="/register">Create one</Link>
      </Typography.Text>
    </AuthShell>
  )
}
