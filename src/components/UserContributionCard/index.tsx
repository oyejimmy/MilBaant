import dayjs from 'dayjs'
import { Collapse, Empty, Flex, Skeleton, Tag, Typography } from 'antd'
import { SectionBlock } from '@/components/Glass/index'
import { useAdvanceContribution } from '@/hooks/useAdvanceContributions'
import {
  ADVANCE_CATEGORY_COLORS,
  ADVANCE_CATEGORY_KEYS,
  ADVANCE_CATEGORY_LABELS,
} from '@/lib/constants'
import { formatCurrency } from '@/lib/formatters'

interface UserContributionCardProps {
  month: string  // 'YYYY-MM'
  userId: string
}

export function UserContributionCard({ month, userId }: UserContributionCardProps) {
  const { plan, categoryBudgets, breakdowns, isLoading } = useAdvanceContribution(month)

  if (isLoading) {
    return (
      <SectionBlock>
        <Skeleton active paragraph={{ rows: 4 }} />
      </SectionBlock>
    )
  }

  if (!plan?.is_published) {
    return (
      <SectionBlock>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Typography.Text type="secondary">
              Contribution for <strong>{dayjs(month).format('MMMM YYYY')}</strong> has not been
              published yet.
            </Typography.Text>
          }
        />
      </SectionBlock>
    )
  }

  const userBreakdown   = breakdowns.find((b) => b.user_id === userId)
  const isOverridden    = userBreakdown?.override_amount !== null && userBreakdown?.override_amount !== undefined
  const finalAmount     = isOverridden ? userBreakdown!.override_amount! : plan.per_person_default
  const flatmateCount   = plan.flatmate_count > 0 ? plan.flatmate_count : 1

  /* ── Per-category proportional breakdown ────────────────────────────── */
  const categoryRows = ADVANCE_CATEGORY_KEYS.map((key) => {
    const budget    = categoryBudgets[key] ?? 0
    const userShare = budget / flatmateCount
    return { key, budget, userShare }
  })

  /* ── Collapse items ──────────────────────────────────────────────────── */
  const breakdownContent = (
    <>
      {categoryRows.map((row) => (
        <Flex
          key={row.key}
          justify="space-between"
          align="center"
          style={{
            padding:      '10px 0',
            borderBottom: '1px solid var(--card-border)',
          }}
        >
          <Tag
            color={ADVANCE_CATEGORY_COLORS[row.key]}
            style={{ margin: 0, fontSize: 12 }}
          >
            {ADVANCE_CATEGORY_LABELS[row.key]}
          </Tag>
          <Flex vertical align="flex-end" gap={0}>
            <Typography.Text strong style={{ fontSize: 14 }}>
              {formatCurrency(row.userShare)}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              of {formatCurrency(row.budget)}
            </Typography.Text>
          </Flex>
        </Flex>
      ))}

      <Flex
        justify="space-between"
        align="center"
        style={{
          marginTop:  12,
          paddingTop: 10,
          borderTop:  '2px solid var(--card-border)',
        }}
      >
        <Typography.Text strong>Standard Share</Typography.Text>
        <Typography.Text strong style={{ color: 'var(--primary)', fontSize: 15 }}>
          {formatCurrency(plan.per_person_default)}
        </Typography.Text>
      </Flex>

      {isOverridden && (
        <Flex
          justify="space-between"
          align="center"
          style={{ marginTop: 6 }}
        >
          <Typography.Text type="warning">Your adjusted amount</Typography.Text>
          <Typography.Text style={{ color: '#d48806', fontWeight: 600, fontSize: 15 }}>
            {formatCurrency(finalAmount)}
          </Typography.Text>
        </Flex>
      )}
    </>
  )

  return (
    <SectionBlock>
      {/* ── Total amount ── */}
      <Flex vertical align="center" style={{ padding: '12px 0 20px' }} gap={4}>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Your contribution for
        </Typography.Text>
        <Typography.Text strong style={{ fontSize: 15 }}>
          {dayjs(month).format('MMMM YYYY')}
        </Typography.Text>
        <Typography.Title
          level={2}
          style={{ margin: '4px 0 0', color: 'var(--primary)', letterSpacing: '-0.5px' }}
        >
          {formatCurrency(finalAmount)}
        </Typography.Title>
        {isOverridden && (
          <Tag color="warning" style={{ marginTop: 4 }}>
            Admin-adjusted amount
          </Tag>
        )}
      </Flex>

      {/* ── Category breakdown ── */}
      <Collapse
        size="small"
        items={[
          {
            key:      'breakdown',
            label:    'Category Breakdown',
            children: breakdownContent,
          },
        ]}
      />
    </SectionBlock>
  )
}
