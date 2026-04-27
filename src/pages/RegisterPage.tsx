import { useState } from 'react'
import { Alert, Button, Form, Input, Typography, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/AuthShell'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface RegisterValues {
  full_name: string
  email: string
  password: string
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  async function handleRegister(values: RegisterValues) {
    if (!isSupabaseConfigured) {
      message.error(
        'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env and restart the app.',
      )
      return
    }

    setSubmitting(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
          },
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.session) {
        message.success('Account created and signed in.')
        navigate('/', { replace: true })
      } else {
        message.success(
          'Account created. If email confirmation is enabled, please check your inbox.',
        )
        navigate('/login', { replace: true })
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Unable to register right now.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Create Account"
      subtitle="Join the flat and start tracking monthly fixed expenses and weekend meal splits."
    >
      {!isSupabaseConfigured ? (
        <Alert
          type="warning"
          showIcon
          message="Supabase environment variables are missing."
          description="Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before creating accounts."
        />
      ) : null}

      <Form layout="vertical" onFinish={(values) => void handleRegister(values)}>
        <Form.Item
          label="Full Name"
          name="full_name"
          rules={[{ required: true, message: 'Please enter your full name.' }]}
        >
          <Input placeholder="Ali Khan" />
        </Form.Item>

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
          rules={[
            { required: true, message: 'Please enter a password.' },
            { min: 6, message: 'Use at least 6 characters.' },
          ]}
        >
          <Input.Password placeholder="Choose a password" />
        </Form.Item>

        <Button
          htmlType="submit"
          type="primary"
          block
          loading={submitting}
          disabled={!isSupabaseConfigured}
        >
          Create Account
        </Button>
      </Form>

      <Typography.Text style={{ color: 'var(--text-base)' }}>
        Already registered? <Link to="/login">Sign in</Link>
      </Typography.Text>
    </AuthShell>
  )
}
