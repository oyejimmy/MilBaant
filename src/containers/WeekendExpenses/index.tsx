import { useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import {
  Alert,
  Avatar,
  Button,
  DatePicker,
  Flex,
  Form,
  Grid,
  Image,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import {
  ExpenseFormModal,
  type ExpenseSubmission,
} from "@/components/ExpenseFormModal/index";
import { PageHeader } from "@/components/PageHeader/index";
import { QueryState } from "@/components/QueryState";
import {
  PageStack,
  SectionBlock,
  MobileCard,
  MobileRow,
  MobileLabel,
  ResponsiveGrid,
} from "@/components/Glass/index";
import { SummaryStat } from "@/components/SummaryStat";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
} from "@/hooks/useExpenses";
import { useProfiles } from "@/hooks/useProfiles";
import {
  useCreateSettlement,
  useDeleteSettlement,
  useSettlements,
} from "@/hooks/useSettlements";
import { uploadBillImage } from "@/lib/storage";
import {
  buildDebtMatrix,
  calculateWeekendExpenseShare,
  splitExpensesByType,
} from "@/lib/expense-helpers";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMonthYear,
} from "@/lib/formatters";
import type { DebtRow, DebtSettlement, Expense } from "@/lib/types";

const { useBreakpoint } = Grid;

/* ─── Styled ──────────────────────────────────────────────────────────────── */

const DebtCard = styled.div<{ $type: "owe" | "owed" | "settled" }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  flex-wrap: wrap;
  border-left: 3px solid
    ${({ $type }) =>
      $type === "owe"
        ? "#ff7875"
        : $type === "owed"
          ? "#52c41a"
          : "var(--card-border)"};
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;

  .ant-typography {
    margin: 0;
  }
`;

/* ─── Main page ───────────────────────────────────────────────────────────── */

export function WeekendExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(
    dayjs().startOf("month"),
  );
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [settleModal, setSettleModal] = useState<DebtRow | null>(null);

  const { userId } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const expensesQuery = useExpenses(selectedMonth);
  const profilesQuery = useProfiles();
  const settlementsQuery = useSettlements();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const createSettlement = useCreateSettlement();
  const deleteSettlement = useDeleteSettlement();

  const profiles = useMemo(
    () => (profilesQuery.data ?? []).filter((p) => p.role !== "cook"),
    [profilesQuery.data],
  );
  const { weekendExpenses } = splitExpensesByType(expensesQuery.data ?? []);
  const settlements = settlementsQuery.data ?? [];

  const totalAmount = weekendExpenses.reduce((s, e) => s + e.amount, 0);
  const uniqueParticipants = new Set(
    weekendExpenses.flatMap((e) =>
      e.expense_participants.map((p) => p.user_id),
    ),
  ).size;

  const rawDebts = buildDebtMatrix(weekendExpenses, profiles);
  const debtRows = applySettlements(rawDebts, settlements);

  async function handleCreateExpense({ values, file }: ExpenseSubmission) {
    if (!userId) return;
    try {
      const billImageUrl = file ? await uploadBillImage(userId, file) : null;
      await createExpense.mutateAsync({
        createdBy: userId,
        category: "weekend_meal",
        amount: values.amount,
        date: values.date.format("YYYY-MM-DD"),
        lastDate: values.lastDate
          ? values.lastDate.format("YYYY-MM-DD")
          : undefined,
        description: values.description,
        participantIds: values.participantIds ?? [],
        billImageUrl,
      });
      message.success("Weekend expense added.");
      setAddModalOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Unable to save.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteExpense.mutateAsync({ expenseId: id, userId: userId ?? "" });
      message.success("Deleted.");
      if (viewExpense?.id === id) setViewExpense(null);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Unable to delete.",
      );
    }
  }

  async function handleSettle(debt: DebtRow, amount: number, note: string) {
    if (!userId) return;
    try {
      await createSettlement.mutateAsync({
        payerId: debt.fromId,
        payeeId: debt.toId,
        amount,
        note,
        settledAt: dayjs().format("YYYY-MM-DD"),
        createdBy: userId,
      });
      message.success("Settlement recorded.");
      setSettleModal(null);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Unable to record settlement.",
      );
    }
  }

  async function handleDeleteSettlement(id: string) {
    try {
      await deleteSettlement.mutateAsync({ id, userId: userId ?? "" });
      message.success("Settlement removed.");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Unable to remove.",
      );
    }
  }

  const columns: ColumnsType<Expense> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 100,
      render: (v: string) => formatDate(v),
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (v: string | null, record: Expense) => {
        const parts: string[] = [];
        if (v) parts.push(v);
        if (record.last_date)
          parts.push(`Last Date: ${formatDate(record.last_date)}`);
        return parts.length > 0 ? (
          parts.join(" | ")
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        );
      },
    },
    {
      title: "Paid By",
      key: "paidBy",
      width: 100,
      render: (_: unknown, record: Expense) => (
        <Tag color="purple" style={{ fontSize: 11 }}>
          {record.creator?.full_name ?? "—"}
        </Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 90,
      render: (v: number) => (
        <Typography.Text strong>{formatCurrency(v)}</Typography.Text>
      ),
    },
    {
      title: "Share",
      key: "share",
      width: 90,
      render: (_: unknown, record: Expense) =>
        formatCurrency(calculateWeekendExpenseShare(record)),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_: unknown, record: Expense) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setViewExpense(record);
            }}
          />
          {record.created_by === userId && (
            <Popconfirm
              title="Delete?"
              onConfirm={() => void handleDelete(record.id)}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const settlementColumns: ColumnsType<DebtSettlement> = [
    {
      title: "Date",
      dataIndex: "settled_at",
      key: "settled_at",
      width: 100,
      render: (v: string) => formatDate(v),
    },
    {
      title: "From",
      key: "payer",
      render: (_: unknown, r: DebtSettlement) => (
        <Tag color="blue" style={{ fontSize: 11 }}>
          {r.payer?.full_name ?? r.payer_id}
        </Tag>
      ),
    },
    {
      title: "To",
      key: "payee",
      render: (_: unknown, r: DebtSettlement) => (
        <Tag color="green" style={{ fontSize: 11 }}>
          {r.payee?.full_name ?? r.payee_id}
        </Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => (
        <Typography.Text strong>{formatCurrency(v)}</Typography.Text>
      ),
    },
    {
      title: "",
      key: "del",
      width: 44,
      render: (_: unknown, r: DebtSettlement) =>
        userId ? (
          <Popconfirm
            title="Remove?"
            onConfirm={() => void handleDeleteSettlement(r.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null,
    },
  ];

  const isLoading =
    expensesQuery.isLoading ||
    profilesQuery.isLoading ||
    settlementsQuery.isLoading;
  const error =
    (expensesQuery.error as Error | null) ??
    (profilesQuery.error as Error | null);

  return (
    <PageStack>
      <PageHeader
        title="Weekend Expenses"
        subtitle={`Weekend meal costs for ${formatMonthYear(selectedMonth)}, split among selected participants.`}
        breadcrumbs={[{ title: "Home", path: "/" }, { title: "Weekend Meals" }]}
        actions={
          <Space wrap>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(v) => v && setSelectedMonth(v.startOf("month"))}
            />
            {!!userId && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddModalOpen(true)}
              >
                Add Expense
              </Button>
            )}
          </Space>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        <ResponsiveGrid>
          <SummaryStat
            title="Total Spend"
            value={formatCurrency(totalAmount)}
            subtitle="All weekend meals this month."
            icon={<WalletOutlined />}
            color="var(--primary)"
          />
          <SummaryStat
            title="Entries"
            value={weekendExpenses.length}
            subtitle="Weekend expense records."
            icon={<CalendarOutlined />}
            color="#7c3aed"
          />
          <SummaryStat
            title="Participants"
            value={uniqueParticipants}
            subtitle="Distinct flatmates involved."
            icon={<TeamOutlined />}
            color="#059669"
          />
        </ResponsiveGrid>

        {/* Expenses */}
        <SectionBlock>
          <SectionTitle>
            <Typography.Title level={5} style={{ color: "var(--text-strong)" }}>
              All Weekend Meals
            </Typography.Title>
            <Tag color="default" style={{ fontSize: 11, marginBottom: 2 }}>
              {weekendExpenses.length} entries
            </Tag>
          </SectionTitle>
          {isMobile ? (
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              {weekendExpenses.length === 0 && (
                <Typography.Text type="secondary">
                  No weekend expenses for this month.
                </Typography.Text>
              )}
              {weekendExpenses.map((exp) => (
                <MobileCard
                  key={exp.id}
                  onClick={() => setViewExpense(exp)}
                  style={{ cursor: "pointer" }}
                >
                  <MobileRow>
                    <MobileLabel>{formatDate(exp.date)}</MobileLabel>
                    <Typography.Text
                      strong
                      style={{ color: "var(--text-strong)" }}
                    >
                      {formatCurrency(exp.amount)}
                    </Typography.Text>
                  </MobileRow>
                  <MobileRow>
                    <Typography.Text
                      style={{ fontSize: 12, color: "var(--text-muted)" }}
                    >
                      {exp.description || "Weekend meal"}
                    </Typography.Text>
                    <Tag color="purple" style={{ fontSize: 11, margin: 0 }}>
                      {exp.creator?.full_name ?? "—"}
                    </Tag>
                  </MobileRow>
                  <MobileRow>
                    <Flex wrap gap={4}>
                      {exp.expense_participants.slice(0, 3).map((p) => (
                        <Tag
                          key={p.user_id}
                          color="cyan"
                          style={{ margin: 0, fontSize: 10 }}
                        >
                          {p.profile?.full_name ?? "?"}
                        </Tag>
                      ))}
                      {exp.expense_participants.length > 3 && (
                        <Tag style={{ margin: 0, fontSize: 10 }}>
                          +{exp.expense_participants.length - 3}
                        </Tag>
                      )}
                    </Flex>
                    <Typography.Text
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCurrency(calculateWeekendExpenseShare(exp))}/person
                    </Typography.Text>
                  </MobileRow>
                  {exp.created_by === userId && (
                    <MobileRow>
                      <div />
                      <Popconfirm
                        title="Delete?"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          void handleDelete(exp.id);
                        }}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </MobileRow>
                  )}
                </MobileCard>
              ))}
            </Space>
          ) : (
            <Table<Expense>
              rowKey="id"
              columns={columns}
              dataSource={weekendExpenses}
              pagination={{
                pageSize: 10,
                hideOnSinglePage: true,
                size: "small",
              }}
              scroll={{ x: 550 }}
              size="small"
              onRow={(record) => ({
                onClick: (e) => {
                  const t = e.target as HTMLElement;
                  if (t.closest("button") || t.closest(".ant-btn")) return;
                  setViewExpense(record);
                },
                style: { cursor: "pointer" },
              })}
              locale={{ emptyText: "No weekend expenses for this month." }}
            />
          )}
        </SectionBlock>

        {/* Who owes whom */}
        <SectionBlock>
          <SectionTitle>
            <Typography.Title level={5} style={{ color: "var(--text-strong)" }}>
              Who Owes Whom
            </Typography.Title>
            <Typography.Text
              style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}
            >
              Green = owed to you · Red = you owe
            </Typography.Text>
          </SectionTitle>
          {debtRows.length === 0 ? (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="All settled up! No outstanding debts for this month."
            />
          ) : (
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              {debtRows.map((debt) => {
                const isCurrentUserDebtor = debt.fromId === userId;
                const isCurrentUserCreditor = debt.toId === userId;
                const type = isCurrentUserDebtor
                  ? "owe"
                  : isCurrentUserCreditor
                    ? "owed"
                    : "settled";
                return (
                  <DebtCard key={`${debt.fromId}-${debt.toId}`} $type={type}>
                    <Flex
                      align="center"
                      gap={6}
                      wrap
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <Avatar
                        size={22}
                        style={{
                          background: "#909ffa",
                          color: "#fff",
                          fontSize: 10,
                          flexShrink: 0,
                        }}
                        icon={<UserOutlined />}
                      />
                      <Typography.Text
                        strong
                        style={{
                          color: "var(--text-strong)",
                          fontSize: "0.82rem",
                        }}
                      >
                        {debt.fromName}
                      </Typography.Text>
                      <ArrowRightOutlined
                        style={{ color: "var(--text-muted)", fontSize: 10 }}
                      />
                      <Avatar
                        size={22}
                        style={{
                          background: "#52c41a",
                          color: "#fff",
                          fontSize: 10,
                          flexShrink: 0,
                        }}
                        icon={<UserOutlined />}
                      />
                      <Typography.Text
                        strong
                        style={{
                          color: "var(--text-strong)",
                          fontSize: "0.82rem",
                        }}
                      >
                        {debt.toName}
                      </Typography.Text>
                      {isCurrentUserDebtor && (
                        <Tag color="red" style={{ margin: 0, fontSize: 10 }}>
                          You owe
                        </Tag>
                      )}
                      {isCurrentUserCreditor && (
                        <Tag color="green" style={{ margin: 0, fontSize: 10 }}>
                          Owed to you
                        </Tag>
                      )}
                    </Flex>
                    <Flex align="center" gap={8} style={{ flexShrink: 0 }}>
                      <Typography.Text
                        strong
                        style={{
                          color: "var(--text-strong)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {formatCurrency(debt.netAmount)}
                      </Typography.Text>
                      {!!userId && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => setSettleModal(debt)}
                        >
                          Settle
                        </Button>
                      )}
                    </Flex>
                  </DebtCard>
                );
              })}
            </Space>
          )}
        </SectionBlock>

        {/* Settlement history */}
        <SectionBlock>
          <SectionTitle>
            <Typography.Title level={5} style={{ color: "var(--text-strong)" }}>
              Settlement History
            </Typography.Title>
            {settlements.length > 0 && (
              <Tag color="default" style={{ fontSize: 11, marginBottom: 2 }}>
                {settlements.length} records
              </Tag>
            )}
          </SectionTitle>
          {settlements.length === 0 ? (
            <Typography.Text style={{ color: "var(--text-muted)" }}>
              No settlements recorded yet.
            </Typography.Text>
          ) : isMobile ? (
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              {settlements.map((s) => (
                <MobileCard key={s.id}>
                  <MobileRow>
                    <MobileLabel>{formatDate(s.settled_at)}</MobileLabel>
                    <Typography.Text strong>
                      {formatCurrency(s.amount)}
                    </Typography.Text>
                  </MobileRow>
                  <MobileRow>
                    <Flex gap={4} align="center">
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                        {s.payer?.full_name ?? s.payer_id}
                      </Tag>
                      <ArrowRightOutlined
                        style={{ fontSize: 10, color: "var(--text-muted)" }}
                      />
                      <Tag color="green" style={{ margin: 0, fontSize: 11 }}>
                        {s.payee?.full_name ?? s.payee_id}
                      </Tag>
                    </Flex>
                    {!!userId && (
                      <Popconfirm
                        title="Remove?"
                        onConfirm={() => void handleDeleteSettlement(s.id)}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    )}
                  </MobileRow>
                  {s.note && (
                    <Typography.Text
                      style={{ fontSize: 11, color: "var(--text-muted)" }}
                    >
                      {s.note}
                    </Typography.Text>
                  )}
                </MobileCard>
              ))}
            </Space>
          ) : (
            <Table<DebtSettlement>
              rowKey="id"
              size="small"
              pagination={{
                pageSize: 8,
                hideOnSinglePage: true,
                size: "small",
              }}
              scroll={{ x: 450 }}
              dataSource={settlements}
              columns={settlementColumns}
            />
          )}
        </SectionBlock>
      </QueryState>

      <ExpenseFormModal
        open={addModalOpen}
        submitting={createExpense.isPending}
        profiles={profiles}
        lockedCategory="weekend_meal"
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreateExpense}
      />
      {viewExpense && (
        <ExpenseDetailModal
          expense={viewExpense}
          onClose={() => setViewExpense(null)}
          onDelete={
            viewExpense.created_by === userId ? handleDelete : undefined
          }
          deleting={deleteExpense.isPending}
        />
      )}
      {settleModal && (
        <SettleModal
          debt={settleModal}
          submitting={createSettlement.isPending}
          onClose={() => setSettleModal(null)}
          onSubmit={handleSettle}
        />
      )}
    </PageStack>
  );
}

function applySettlements(
  debts: DebtRow[],
  settlements: DebtSettlement[],
): DebtRow[] {
  const settled = new Map<string, number>();
  for (const s of settlements) {
    const key = [s.payer_id, s.payee_id].sort().join("|");
    settled.set(key, (settled.get(key) ?? 0) + s.amount);
  }
  return debts
    .map((debt) => {
      const key = [debt.fromId, debt.toId].sort().join("|");
      return {
        ...debt,
        netAmount: Math.max(0, debt.netAmount - (settled.get(key) ?? 0)),
      };
    })
    .filter((d) => d.netAmount > 0.01);
}

/* ─── Detail modal styled ─────────────────────────────────────────────────── */

const DetailBanner = styled.div`
  background: linear-gradient(
    135deg,
    rgba(144, 159, 250, 0.12) 0%,
    rgba(64, 150, 255, 0.06) 100%
  );
  border-bottom: 1px solid var(--border-light);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
`;

const DetailIcon = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: linear-gradient(135deg, #909ffa 0%, #4096ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(144, 159, 250, 0.4);

  .anticon {
    color: white;
    font-size: 19px;
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px 20px 4px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const InfoLabel = styled.span`
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
`;

const InfoValue = styled.span`
  font-size: 0.88rem;
  color: var(--text-strong);
  font-weight: 500;
`;

const ParticipantList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 200px;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--card-border);
    border-radius: 3px;
  }
`;

const ParticipantRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--content-bg);
  border: 1px solid var(--card-border);
`;

/* ─── Expense detail modal ────────────────────────────────────────────────── */

function ExpenseDetailModal({
  expense,
  onClose,
  onDelete,
  deleting,
}: {
  expense: Expense;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
  deleting: boolean;
}) {
  const sharePerPerson = calculateWeekendExpenseShare(expense);
  return (
    <Modal
      centered
      open
      onCancel={onClose}
      title={null}
      style={{ top: 24 }}
      styles={{ body: { padding: 0 } }}
      footer={
        <Flex justify={onDelete ? "space-between" : "flex-end"} align="center">
          {onDelete && (
            <Popconfirm
              title="Delete this expense?"
              onConfirm={() => void onDelete(expense.id)}
            >
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                loading={deleting}
              >
                Delete
              </Button>
            </Popconfirm>
          )}
          <Button size="small" onClick={onClose}>
            Close
          </Button>
        </Flex>
      }
      width="min(500px, 96vw)"
    >
      {/* Banner */}
      <DetailBanner>
        <DetailIcon>
          <WalletOutlined />
        </DetailIcon>
        <div>
          <Typography.Title
            level={5}
            style={{
              margin: "0 0 4px",
              color: "var(--text-strong)",
              lineHeight: 1.2,
            }}
          >
            Weekend Expense
          </Typography.Title>
          <Flex gap={6} wrap>
            <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
              Read Only
            </Tag>
            {expense.creator && (
              <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>
                {expense.creator.full_name}
              </Tag>
            )}
          </Flex>
        </div>
      </DetailBanner>

      {/* Info grid */}
      <DetailGrid>
        <InfoBlock>
          <InfoRow>
            <InfoLabel>Date</InfoLabel>
            <InfoValue>{formatDate(expense.date)}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Amount</InfoLabel>
            <InfoValue
              style={{ color: "#909ffa", fontSize: "1.05rem", fontWeight: 700 }}
            >
              {formatCurrency(expense.amount)}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Share / Person</InfoLabel>
            <InfoValue>{formatCurrency(sharePerPerson)}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Description</InfoLabel>
            <InfoValue style={{ fontWeight: 400 }}>
              {expense.description || "No description"}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Recorded</InfoLabel>
            <InfoValue style={{ fontSize: "0.78rem", fontWeight: 400 }}>
              {formatDateTime(expense.created_at)}
            </InfoValue>
          </InfoRow>
          {expense.bill_image_url && (
            <InfoRow>
              <InfoLabel>Bill</InfoLabel>
              <Image
                src={expense.bill_image_url}
                alt="Bill"
                width={80}
                height={60}
                style={{
                  borderRadius: 7,
                  objectFit: "cover",
                  border: "1px solid var(--card-border)",
                }}
              />
            </InfoRow>
          )}
        </InfoBlock>

        <InfoBlock>
          <InfoRow>
            <InfoLabel>
              Participants ({expense.expense_participants.length})
            </InfoLabel>
          </InfoRow>
          {expense.expense_participants.length === 0 ? (
            <Typography.Text type="secondary" style={{ fontSize: "0.82rem" }}>
              No participants recorded.
            </Typography.Text>
          ) : (
            <ParticipantList>
              {expense.expense_participants.map((p) => (
                <ParticipantRow key={p.user_id}>
                  <Flex align="center" gap={8}>
                    <Avatar
                      size={20}
                      style={{
                        background: "#909ffa",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {(p.profile?.full_name ?? "?").charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography.Text
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-strong)",
                      }}
                    >
                      {p.profile?.full_name ?? "?"}
                    </Typography.Text>
                  </Flex>
                  <Typography.Text
                    style={{
                      fontSize: "0.8rem",
                      color: "#909ffa",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(sharePerPerson)}
                  </Typography.Text>
                </ParticipantRow>
              ))}
            </ParticipantList>
          )}
        </InfoBlock>
      </DetailGrid>
    </Modal>
  );
}

/* ─── Settle modal styled ─────────────────────────────────────────────────── */

const SettleBanner = styled.div`
  background: linear-gradient(
    135deg,
    rgba(82, 196, 26, 0.1) 0%,
    rgba(82, 196, 26, 0.04) 100%
  );
  border-bottom: 1px solid var(--border-light);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
`;

const SettleIcon = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.35);

  .anticon {
    color: white;
    font-size: 19px;
  }
`;

const DebtSummaryCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--content-bg);
  border: 1px solid var(--card-border);
  margin-bottom: 16px;
`;

/* ─── Settle modal ────────────────────────────────────────────────────────── */

function SettleModal({
  debt,
  submitting,
  onClose,
  onSubmit,
}: {
  debt: DebtRow;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (debt: DebtRow, amount: number, note: string) => Promise<void>;
}) {
  const [form] = Form.useForm<{ amount: number; note: string }>();

  async function handleOk() {
    const values = await form.validateFields();
    await onSubmit(debt, values.amount, values.note ?? "");
    form.resetFields();
  }

  return (
    <Modal
      centered
      open
      onCancel={onClose}
      title={null}
      okText="Confirm Payment"
      confirmLoading={submitting}
      onOk={() => void handleOk()}
      width="min(440px, 96vw)"
      style={{ top: 24 }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Banner */}
      <SettleBanner>
        <SettleIcon>
          <CheckCircleOutlined />
        </SettleIcon>
        <div>
          <Typography.Title
            level={5}
            style={{
              margin: "0 0 2px",
              color: "var(--text-strong)",
              lineHeight: 1.2,
            }}
          >
            Record Settlement
          </Typography.Title>
          <Typography.Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Mark a payment as completed
          </Typography.Text>
        </div>
      </SettleBanner>

      <div style={{ padding: "16px 20px 4px" }}>
        {/* Debt summary */}
        <DebtSummaryCard>
          <Flex align="center" gap={6} wrap>
            <Tag color="red" style={{ margin: 0, fontSize: 11 }}>
              {debt.fromName}
            </Tag>
            <ArrowRightOutlined
              style={{ color: "var(--text-muted)", fontSize: 10 }}
            />
            <Tag color="green" style={{ margin: 0, fontSize: 11 }}>
              {debt.toName}
            </Tag>
          </Flex>
          <Typography.Text
            strong
            style={{
              color: "#52c41a",
              fontSize: "0.95rem",
              whiteSpace: "nowrap",
            }}
          >
            {formatCurrency(debt.netAmount)}
          </Typography.Text>
        </DebtSummaryCard>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ amount: debt.netAmount, note: "" }}
        >
          <Form.Item
            label="Amount Paid"
            name="amount"
            rules={[{ required: true, message: "Enter amount." }]}
          >
            <InputNumber
              min={0.01}
              max={debt.netAmount}
              precision={2}
              prefix="PKR"
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item
            label="Note (optional)"
            name="note"
            style={{ marginBottom: 16 }}
          >
            <input
              placeholder="e.g. Cash handed over"
              style={{
                width: "100%",
                padding: "7px 11px",
                borderRadius: 8,
                border: "1px solid var(--card-border)",
                background: "var(--card-bg)",
                color: "var(--text-strong)",
                fontSize: "0.9rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
