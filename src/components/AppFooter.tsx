import styled from 'styled-components'
import { Typography } from 'antd'
import { HeartFilled } from '@ant-design/icons'

const FooterWrap = styled.footer`
  background: var(--bg-card);
  border-top: 1px solid var(--border-light);
  padding: 12px 24px;
  margin: 0;
  width: 100%;

  @media (max-width: 767px) {
    padding: 12px 16px 72px; /* clear mobile bottom nav */
  }
`

const Inner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
`

const LogoMark = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: linear-gradient(135deg, #1465a3 0%, #1c8ee5 50%, #49a5ea 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const HouseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M3 12L12 3L21 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 10V20C5 20.55 5.45 21 6 21H10V15H14V21H18C18.55 21 19 20.55 19 20V10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const MadeWith = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);

  .heart {
    color: #e53935;
    font-size: 11px;
    animation: heartbeat 1.4s ease-in-out infinite;
  }

  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    14%       { transform: scale(1.25); }
    28%       { transform: scale(1); }
    42%       { transform: scale(1.15); }
    56%       { transform: scale(1); }
  }
`

export function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <FooterWrap aria-label="Application footer">
      <Inner>
        <Left>
          <LogoMark>
            <HouseIcon />
          </LogoMark>
          <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            © {year} MilBaant — Flatmate Expense Manager
          </Typography.Text>
        </Left>

        <MadeWith>
          <span>Made with</span>
          <HeartFilled className="heart" aria-label="love" />
          <span>by <strong style={{ color: 'var(--text-secondary)' }}>Jimmy</strong></span>
        </MadeWith>
      </Inner>
    </FooterWrap>
  )
}
