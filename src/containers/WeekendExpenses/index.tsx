import { useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
  Alert,
  Button,
  DatePicker,
  Flex,
  Grid,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/PageHeader/index";
import { QueryState } from "@/components/QueryState";
import {
  PageStack,
  SectionBlock,
  ResponsiveGrid,
} from "@/components/Glass/index";
import { SummaryStat } from "@/components/SummaryStat";
import {
  ExpenseFormModal,
  type ExpenseSubmission,
} from "@/components/ExpenseFormModal/index";
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
import { buildDebtMatrix, splitExpensesByType } from "@/lib/expense-helpers";
import { formatCurrency, formatMonthYear } from "@/lib/formatters";
import { ExpensesTable } from "./components/ExpensesTable";
import { MobileExpensesList } from "./components/MobileExpensesList";
import { DebtsList } from "./components/DebtsList";
import { SettlementsTable } from "./components/SettlementsTable";
import { MobileSettlementsList } from "./components/MobileSettlementsList";
import { ExpenseDetailModal } from "./components/ExpenseDetailModal";
import { SettleModal } from "./components/SettleModal";
import { applySettlements } from "./components/helpers";

const { useBreakpoint } = Grid;

export function WeekendExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(
    dayjs().startOf("month"),
  );
  const [viewExpense, setViewExpense] = useState<any>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [settleModal, setSettleModal] = useState<any>(null);

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

  const handleCreateExpense = async ({ values, file }: ExpenseSubmission) => {
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
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense.mutateAsync({ expenseId: id, userId: userId ?? "" });
      message.success("Deleted.");
      if (viewExpense?.id === id) setViewExpense(null);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Unable to delete.",
      );
    }
  };

  const handleSettle = async (debt: any, amount: number, note: string) => {
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
  };

  const handleDeleteSettlement = async (id: string) => {
    try {
      await deleteSettlement.mutateAsync({ id, userId: userId ?? "" });
      message.success("Settlement removed.");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Unable to remove.",
      );
    }
  };

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
            {userId && (
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

        <SectionBlock>
          <Flex align="baseline" gap={8} style={{ marginBottom: 12 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              All Weekend Meals
            </Typography.Title>
            <Tag style={{ fontSize: 11 }}>{weekendExpenses.length} entries</Tag>
          </Flex>
          {isMobile ? (
            <MobileExpensesList
              expenses={weekendExpenses}
              userId={userId ?? undefined}
              onView={setViewExpense}
              onDelete={handleDelete}
            />
          ) : (
            <ExpensesTable
              expenses={weekendExpenses}
              userId={userId ?? undefined}
              onView={setViewExpense}
              onDelete={handleDelete}
            />
          )}
        </SectionBlock>

        <SectionBlock>
          <Flex align="baseline" gap={8} style={{ marginBottom: 12 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Who Owes Whom
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: "0.8rem" }}>
              Green = owed to you · Red = you owe
            </Typography.Text>
          </Flex>
          {debtRows.length === 0 ? (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="All settled up! No outstanding debts for this month."
            />
          ) : (
            <DebtsList
              debts={debtRows}
              userId={userId ?? undefined}
              onSettle={setSettleModal}
            />
          )}
        </SectionBlock>

        <SectionBlock>
          <Flex align="baseline" gap={8} style={{ marginBottom: 12 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Settlement History
            </Typography.Title>
            {settlements.length > 0 && (
              <Tag style={{ fontSize: 11 }}>{settlements.length} records</Tag>
            )}
          </Flex>
          {settlements.length === 0 ? (
            <Typography.Text type="secondary">
              No settlements recorded yet.
            </Typography.Text>
          ) : isMobile ? (
            <MobileSettlementsList
              settlements={settlements}
              userId={userId ?? undefined}
              onDelete={handleDeleteSettlement}
            />
          ) : (
            <SettlementsTable
              settlements={settlements}
              userId={userId ?? undefined}
              onDelete={handleDeleteSettlement}
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
      <ExpenseDetailModal
        expense={viewExpense}
        open={!!viewExpense}
        userId={userId ?? undefined}
        deleting={deleteExpense.isPending}
        onClose={() => setViewExpense(null)}
        onDelete={handleDelete}
      />
      <SettleModal
        debt={settleModal}
        open={!!settleModal}
        submitting={createSettlement.isPending}
        onClose={() => setSettleModal(null)}
        onSubmit={handleSettle}
      />
    </PageStack>
  );
}
