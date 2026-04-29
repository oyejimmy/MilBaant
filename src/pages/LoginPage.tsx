import { useState } from 'react'
import { Alert, App, Button, Form, Input } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell, FormFooter } from '@/components/AuthShell'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface LoginValues {
  email: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
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
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to sign in.')
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
          title="Supabase not configured"
          description="Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file."
          style={{ marginBottom: 20 }}
        />
      )}

      <Form
        layout="vertical"
        onFinish={(values) => void handleLogin(values)}
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
            placeholder="Enter your email"
            size="large"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          label={
            <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              Password
              <Link to="/forgot-password" style={{ fontSize: 13, fontWeight: 500 }}>
                Forgot password?
              </Link>
            </span>
          }
          name="password"
          rules={[{ required: true, message: 'Password is required.' }]}
          style={{ marginBottom: 24 }}
        >
          <Input.Password
            placeholder="Enter your password"
            size="large"
            autoComplete="current-password"
            styles={{ suffix: { borderInlineStart: 'none', boxShadow: 'none' } }}
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
            Sign In
          </Button>
        </Form.Item>
      </Form>

      <FormFooter>
        Don't have an account? <Link to="/register">Create one</Link>
      </FormFooter>
    </AuthShell>
  )
}
