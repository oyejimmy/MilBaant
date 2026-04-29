import styled from 'styled-components'
import { Typography } from 'antd'
import {
  HomeOutlined,
  DollarCircleOutlined,
  CarOutlined,
  CoffeeOutlined,
  TeamOutlined,
  HeartFilled,
} from '@ant-design/icons'

const FooterWrap = styled.footer`
  background: var(--bg-card);
  border-top: 1px solid var(--border-light);
  padding: 32px 24px 24px;
  /* flush to left, right, and bottom — no margin */
  margin: 0;
  width: 100%;

  @media (max-width: 767px) {
    padding: 24px 16px 80px; /* extra bottom padding for mobile bottom nav */
  }
`

const Inner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 32px;
  margin-bottom: 28px;

  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`

const BrandCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const LogoMark = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, #1465a3 0%, #1c8ee5 50%, #49a5ea 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(28, 142, 229, 0.35);
`

const HouseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12L12 3L21 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 10V20C5 20.55 5.45 21 6 21H10V15H14V21H18C18.55 21 19 20.55 19 20V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--text-secondary);

  .anticon {
    color: var(--primary);
    font-size: 13px;
    flex-shrink: 0;
  }
`

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--border-light);
  margin: 0 0 16px;
`

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
`

const MadeWith = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-muted);

  .heart {
    color: #e53935;
    font-size: 12px;
    animation: heartbeat 1.4s ease-in-out infinite;
  }

  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    14%       { transform: scale(1.2); }
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
        <Grid>
          {/* Brand column */}
          <BrandCol>
            <LogoRow>
              <LogoMark aria-hidden="true">
                <HouseIcon />
              </LogoMark>
              <Typography.Text strong style={{ fontSize: 16, color: 'var(--text-strong)' }}>
                MilBaant
              </Typography.Text>
            </LogoRow>

            <Typography.Text style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 300 }}>
              A smart flatmate management app for shared living. Track expenses, rides, cook
              advances, and contributions — all in one place.
            </Typography.Text>

            <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Designed for flatmates who value clarity and fairness.
            </Typography.Text>
          </BrandCol>

          {/* Features column */}
          <div>
            <Typography.Text strong style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>
              Features
            </Typography.Text>
            <FeatureList>
              <FeatureItem>
                <DollarCircleOutlined />
                Expense tracking
              </FeatureItem>
              <FeatureItem>
                <CarOutlined />
                Ride cost splitting
              </FeatureItem>
              <FeatureItem>
                <CoffeeOutlined />
                Cook ledger
              </FeatureItem>
              <FeatureItem>
                <HomeOutlined />
                Flat view &amp; rooms
              </FeatureItem>
              <FeatureItem>
                <TeamOutlined />
                Contributions
              </FeatureItem>
            </FeatureList>
          </div>

          {/* About column */}
          <div>
            <Typography.Text strong style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>
              About
            </Typography.Text>
            <FeatureList>
              <FeatureItem style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>MilBaant</span>
                <span style={{ fontSize: 12 }}>Flatmate Expense Manager</span>
              </FeatureItem>
              <FeatureItem style={{ marginTop: 4 }}>
                <span>Built for shared living</span>
              </FeatureItem>
              <FeatureItem>
                <span>Works offline (PWA)</span>
              </FeatureItem>
              <FeatureItem>
                <span>Dark &amp; light mode</span>
              </FeatureItem>
            </FeatureList>
          </div>
        </Grid>

        <Divider />

        <BottomRow>
          <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            © {year} MilBaant. All rights reserved.
          </Typography.Text>

          <MadeWith>
            <span>Made with</span>
            <HeartFilled className="heart" aria-label="love" />
            <span>by <strong style={{ color: 'var(--text-secondary)' }}>Jimmy</strong></span>
          </MadeWith>
        </BottomRow>
      </Inner>
    </FooterWrap>
  )
}
