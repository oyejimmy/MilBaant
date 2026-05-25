import { Table, Tag, Typography, Flex } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency } from "@/lib/formatters";
import { ADVANCE_CATEGORY_KEYS, ADVANCE_CATEGORY_LABELS, ADVANCE_CATEGORY_COLORS, ADVANCE_CATEGORY_DESCRIPTIONS } from "@/lib/constants";
import { MobileCard, MobileRow } from "@/components/Glass/index";
import type { AdvanceCategoryKey } from "@/lib/types";

interface MonthlyBudgetRow {
  key: AdvanceCategoryKey;
  category: AdvanceCategoryKey;
  description: string;
  budget: number;
}

interface MonthlyBudgetTableProps {
  categoryBudgets: Partial<Record<AdvanceCategoryKey, number>>;
  totalBudget: number;
  adjustedTotalBudget: number;
  carryoverFromPrevious: number;
  isMobile: boolean;
  activeMemberCount: number;
}

export function MonthlyBudgetTable({
  categoryBudgets,
  totalBudget,
  adjustedTotalBudget,
  carryoverFromPrevious,
  isMobile,
  activeMemberCount,
}: MonthlyBudgetTableProps) {
  const estimatedPerPerson = activeMemberCount > 0 ? adjustedTotalBudget / activeMemberCount : 0;
  const rows: MonthlyBudgetRow[] = ADVANCE_CATEGORY_KEYS
    .map((key) => ({
      key,
      category: key,
      description: ADVANCE_CATEGORY_DESCRIPTIONS[key],
      budget: categoryBudgets[key] ?? 0,
    }))
    .filter((row) => row.budget > 0);

  if (rows.length === 0) {
    return (
      <Typography.Text type="secondary" style={{ display: "block", padding: "12px 0" }}>
        No budget estimates set for this month yet.
      </Typography.Text>
    );
  }

  if (isMobile) {
    return (
      <Flex vertical gap={8} style={{ width: "100%" }}>
        {rows.map((row) => (
          <MobileCard key={row.key}>
            <MobileRow>
              <Tag
                color={ADVANCE_CATEGORY_COLORS[row.category]}
                style={{ margin: 0, fontSize: 10 }}
              >
                {ADVANCE_CATEGORY_LABELS[row.category]}
              </Tag>
              <Typography.Text strong style={{ color: "var(--primary)" }}>
                {formatCurrency(row.budget)}
              </Typography.Text>
            </MobileRow>
            <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
              {row.description}
            </Typography.Text>
          </MobileCard>
        ))}
        <MobileCard style={{ background: "var(--primary-soft)", border: "1px solid var(--primary)" }}>
          <MobileRow>
            <Typography.Text strong style={{ color: "var(--text-strong)" }}>
              Total Estimated Budget
            </Typography.Text>
            <Typography.Text strong style={{ color: "var(--primary)", fontSize: 15 }}>
              {formatCurrency(totalBudget)}
            </Typography.Text>
          </MobileRow>
          {carryoverFromPrevious > 0 && (
            <MobileRow>
              <Typography.Text strong style={{ color: "var(--text-strong)" }}>
                Less: Carryover from previous month
              </Typography.Text>
              <Typography.Text strong style={{ color: "#52c41a", fontSize: 15 }}>
                - {formatCurrency(carryoverFromPrevious)}
              </Typography.Text>
            </MobileRow>
          )}
          <MobileRow>
            <Typography.Text strong style={{ color: "var(--text-strong)" }}>
              Adjusted Total
            </Typography.Text>
            <Typography.Text strong style={{ color: "#faad14", fontSize: 15 }}>
              {formatCurrency(adjustedTotalBudget)}
            </Typography.Text>
          </MobileRow>
          <MobileRow>
            <Typography.Text strong style={{ color: "var(--text-strong)" }}>
              Per-person ({activeMemberCount} people)
            </Typography.Text>
            <Typography.Text strong style={{ color: "#7c3aed", fontSize: 15 }}>
              {formatCurrency(estimatedPerPerson)}
            </Typography.Text>
          </MobileRow>
        </MobileCard>
      </Flex>
    );
  }

  const columns: ColumnsType<MonthlyBudgetRow> = [
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 160,
      render: (category: AdvanceCategoryKey) => (
        <Tag color={ADVANCE_CATEGORY_COLORS[category]}>
          {ADVANCE_CATEGORY_LABELS[category]}
        </Tag>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (desc: string) => <Typography.Text type="secondary" className="text-sm">{desc}</Typography.Text>,
    },
    {
      title: "Estimated Budget",
      dataIndex: "budget",
      key: "budget",
      width: 180,
      align: "right",
      render: (budget: number) => formatCurrency(budget),
      sorter: (a, b) => a.budget - b.budget,
    },
  ];

  return (
    <Table
      rowKey="key"
      columns={columns}
      dataSource={rows}
      pagination={false}
      size="small"
      summary={() => (
        <>
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={2}>
              <Typography.Text strong>Total Estimated Budget</Typography.Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2}>
              <Typography.Text strong style={{ color: "var(--primary)", fontSize: 14, textAlign: "right" }}>
                {formatCurrency(totalBudget)}
              </Typography.Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
          {carryoverFromPrevious > 0 && (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <Typography.Text strong>Less: Carryover from previous month</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <Typography.Text strong style={{ color: "#52c41a", fontSize: 14, textAlign: "right" }}>
                  - {formatCurrency(carryoverFromPrevious)}
                </Typography.Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={2}>
              <Typography.Text strong>Adjusted Total</Typography.Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2}>
              <Typography.Text strong style={{ color: "#faad14", fontSize: 14, textAlign: "right" }}>
                {formatCurrency(adjustedTotalBudget)}
              </Typography.Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={2}>
              <Typography.Text strong>Per-person ({activeMemberCount} people)</Typography.Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2}>
              <Typography.Text strong style={{ color: "#7c3aed", fontSize: 14, textAlign: "right" }}>
                {formatCurrency(estimatedPerPerson)}
              </Typography.Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </>
      )}
    />
  );
}
