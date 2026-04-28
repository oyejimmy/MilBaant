import type { ReactNode } from 'react'
import { Button, Typography } from 'antd'
import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { APP_NAME } from '@/lib/constants'
import { GlassPanel } from '@/components/Glass'
import { useThemeMode } from '@/context/ThemeModeContext'

const Wrapper = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background: var(--app-bg);
`

const Orb = styled.div<{ $top?: string; $right?: string; $left?: string; $bottom?: string; $color: string; $size: string }>`
  position: absolute;
  top: ${(props) => props.$top ?? 'auto'};
  right: ${(props) => props.$right ?? 'auto'};
  bottom: ${(props) => props.$bottom ?? 'auto'};
  left: ${(props) => props.$left ?? 'auto'};
  width: ${(props) => props.$size};
  height: ${(props) => props.$size};
  border-radius: 999px;
  background: ${(props) => props.$color};
  filter: blur(36px);
  opacity: 0.65;
  pointer-events: none;
`

const ShellCard = styled(GlassPanel)`
  width: min(100%, 520px);
  padding: 18px;
  position: relative;
  overflow: hidden;
  background: var(--surface-bg);
  border: 1px solid var(--surface-border);
  box-shadow: var(--surface-shadow);
`

const FormCard = styled.div`
  padding: 30px;
  border-radius: 24px;
  display: grid;
  gap: 18px;
  background: var(--surface-bg);
  border: 1px solid var(--surface-border);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
`

const Brand = styled.div`
  display: grid;
  gap: 12px;
`

const Eyebrow = styled.span`
  display: inline-flex;
  width: fit-content;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--surface-border);
  color: var(--text-strong);
  font-size: 0.82rem;
  letter-spacing: 0.03em;
`

const HelperPanel = styled.div`
  padding: 16px 18px;
  border-radius: 18px;
  background: var(--bg-elevated);
  border: 1px solid var(--surface-border);
`

const HelperTitle = styled.div`
  margin: 0;
  color: var(--text-strong);
  font-weight: 700;
  margin-bottom: 6px;
`

const HelperText = styled.div`
  color: var(--text-muted);
  line-height: 1.6;
`

const TopActions = styled.div`
  display: flex;
  justify-content: flex-end;
`

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  const { mode, toggleMode } = useThemeMode()

  return (
    <Wrapper className="auth-shell">
      <Orb $top="10%" $left="8%" $size="180px" $color="var(--primary-soft)" />
      <Orb $bottom="12%" $right="10%" $size="220px" $color="var(--bg-elevated)" />

      <ShellCard>
        <FormCard>
          <TopActions>
            <Button
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleMode}
            >
              {mode === 'dark' ? 'Light' : 'Dark'}
            </Button>
          </TopActions>
          <Brand>
            <Eyebrow>{APP_NAME}</Eyebrow>
            <Typography.Title level={2} style={{ margin: 0, color: 'var(--text-strong)' }}>
              {title}
            </Typography.Title>
            <Typography.Paragraph
              style={{ margin: 0, color: 'var(--text-base)' }}
            >
              {subtitle}
            </Typography.Paragraph>
          </Brand>
          {children}
          <HelperPanel>
            <HelperTitle>What this app handles</HelperTitle>
            <HelperText>
              Monthly shared bills, weekend-only meal splits, announcements, and
              bed assignments for the flat in one simple workflow.
            </HelperText>
          </HelperPanel>
        </FormCard>
      </ShellCard>
    </Wrapper>
  )
}
