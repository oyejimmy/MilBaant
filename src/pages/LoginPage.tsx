import { useState } from 'react'
import { Alert, App, Button, Form, Input } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { AuthShell, FormFooter } from '@/components/AuthShell'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

/* Skeuomorphic primary button */
const SubmitBtn = styled(Button)`
  && {
    height: 50px;
    font-size: 15px;
    font-weight: 700;
    border-radius: 12px;
    border: none;
    letter-spacing: 0.2px;

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
        0 -1px 0 rgba(0,0,0,0.2) inset,
        0 6px 18px rgba(18,96,232,0.5),
        0 2px 6px rgba(0,0,0,0.15) !important;
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
      box-shadow:
        0 1px 0 rgba(255,255,255,0.15) inset,
        0 2px 6px rgba(18,96,232,0.3) !important;
    }
  }
`

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
          message="Supabase not configured"
          description="Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file."
          style={{ marginBottom: 22 }}
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
            prefix={<MailOutlined style={{ color: 'var(--text-muted)', marginRight: 2 }} />}
            placeholder="you@example.com"
            size="large"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          label={
            <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              Password
              <Link to="/forgot-password" style={{ fontSize: 12.5, fontWeight: 600 }}>
                Forgot password?
              </Link>
            </span>
          }
          name="password"
          rules={[{ required: true, message: 'Password is required.' }]}
          style={{ marginBottom: 26 }}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: 'var(--text-muted)', marginRight: 2 }} />}
            placeholder="Enter your password"
            size="large"
            autoComplete="current-password"
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
            Sign In
          </SubmitBtn>
        </Form.Item>
      </Form>

      <FormFooter>
        Don't have an account?{' '}
        <Link to="/register">Create one</Link>
      </FormFooter>
    </AuthShell>
  )
}
