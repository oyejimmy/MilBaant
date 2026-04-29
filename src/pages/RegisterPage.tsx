import { useState } from 'react'
import { Alert, App, Button, Form, Input } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell, FormFooter } from '@/components/AuthShell'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface RegisterValues {
  full_name: string
  email: string
  password: string
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)

  async function handleRegister(values: RegisterValues) {
    if (!isSupabaseConfigured) {
      message.error('Supabase is not configured. Add environment variables and restart.')
      return
    }
    setSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { full_name: values.full_name } },
      })
      if (error) throw new Error(error.message)

      if (data.session) {
        message.success('Account created — welcome!')
        navigate('/', { replace: true })
      } else {
        message.success('Account created. Check your inbox if email confirmation is enabled.')
        navigate('/login', { replace: true })
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to register.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Join your flat and start tracking shared expenses together."
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
        onFinish={(values) => void handleRegister(values)}
        requiredMark={false}
      >
        <Form.Item
          label="Full name"
          name="full_name"
          rules={[{ required: true, message: 'Full name is required.' }]}
        >
          <Input
            placeholder="Enter your full name"
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
            placeholder="Enter your email"
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
            placeholder="At least 6 characters"
            size="large"
            autoComplete="new-password"
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
            Create Account
          </Button>
        </Form.Item>
      </Form>

      <FormFooter>
        Already have an account? <Link to="/login">Sign in</Link>
      </FormFooter>
    </AuthShell>
  )
}
