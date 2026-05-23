import React, { useMemo, useRef, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import html2canvas from "html2canvas";
import {
  Button,
  DatePicker,
  Flex,
  Grid,
  Space,
  Typography,
  message,
} from "antd";
import {
  DownloadOutlined,
  PlusOutlined,
  PrinterOutlined,
  ShareAltOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/PageHeader/index";
import { QueryState } from "@/components/QueryState";
import { SummaryStat } from "@/components/SummaryStat";
import {
  PageStack,
  SectionBlock,
  ResponsiveGrid,
} from "@/components/Glass/index";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useUpdateExpense,
} from "@/hooks/useExpenses";
import { useProfiles } from "@/hooks/useProfiles";
import {
  useMemberCountSetting,
  useUpsertMemberCount,
} from "@/hooks/useSettings";
import {
  useContributionPayments,
  useDeleteContributionPayment,
} from "@/hooks/useContributions";
import {
  buildMonthlyUserSummary,
  calculateFixedTotal,
  calculatePerMemberShare,
  splitExpensesByType,
} from "@/lib/expense-helpers";
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/formatters";
import { uploadBillImage } from "@/lib/storage";
import { exportExpensesToExcel } from "@/lib/export";
import { CATEGORY_LABELS } from "@/lib/constants";
import { AddExpenseModal } from "./components/AddExpenseModal";
import { EditExpenseModal } from "./components/EditExpenseModal";
import { DistributeModal } from "./components/DistributeModal";
import { PrintModal } from "./components/PrintModal";
import { FixedExpensesTable } from "./components/FixedExpensesTable";
import { WeekendExpensesTable } from "./components/WeekendExpensesTable";
import { UserSummaryTable } from "./components/UserSummaryTable";
import { MobileExpensesList } from "./components/MobileExpensesList";
import { MobileWeekendExpensesList } from "./components/MobileWeekendExpensesList";
import { MobileUserSummaryList } from "./components/MobileUserSummaryList";
import { BillDistribution } from "./components/BillDistribution";
import {
  PrintWrapper,
  PrintContent,
  PrintHeader,
  PrintTitle,
  PrintSubtitle,
  PrintSummary,
  PrintSummaryCard,
  PrintLabel,
  PrintValue,
  PrintFooter,
  CategoryBadge,
} from "./components/styles";

const { useBreakpoint } = Grid;

export function ExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(
    dayjs().startOf("month"),
  );
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [printImageUrl, setPrintImageUrl] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [draftMemberCount, setDraftMemberCount] = useState<number | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set(),
  );

  const { userId, canManageExpenses, isAdmin } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const expensesQuery = useExpenses(selectedMonth);
  const profilesQuery = useProfiles();
  const memberCountQuery = useMemberCountSetting();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const updateExpense = useUpdateExpense();
  const saveMemberCount = useUpsertMemberCount();
  const paymentsQuery = useContributionPayments(
    selectedMonth.format("YYYY-MM"),
  );
  const deletePayment = useDeleteContributionPayment();

  const expenses = expensesQuery.data ?? [];
  const profiles = useMemo(
    () => (profilesQuery.data ?? []).filter((p) => p.role !== "cook"),
    [profilesQuery.data],
  );
  const memberCount = memberCountQuery.data ?? 10;
  const payments = paymentsQuery.data ?? [];

  const paymentsByUser = new Map();
  for (const p of payments) {
    const existing = paymentsByUser.get(p.user_id) ?? [];
    paymentsByUser.set(p.user_id, [...existing, p]);
  }

  const { fixedExpenses, weekendExpenses } = splitExpensesByType(expenses);
  const fixedTotal = calculateFixedTotal(fixedExpenses);
  const perMemberShare = calculatePerMemberShare(fixedTotal, memberCount);
  const userSummary = buildMonthlyUserSummary(
    profiles,
    perMemberShare,
    weekendExpenses,
  );

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenPrint = async () => {
    setPrintOpen(true);
    setTimeout(async () => {
      if (!printRef.current) return;
      setCapturing(true);
      try {
        const canvas = await html2canvas(printRef.current, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
        });
        setPrintImageUrl(canvas.toDataURL("image/png"));
      } catch {
        message.error("Failed to generate image.");
      } finally {
        setCapturing(false);
      }
    }, 300);
  };

  const handleSavePrintImage = () => {
    if (!printImageUrl) return;
    const link = document.createElement("a");
    link.href = printImageUrl;
    link.download = `expenses-${selectedMonth.format("YYYY-MM")}.png`;
    link.click();
  };

  const handleEditExpense = async (values: any) => {
    if (!editingExpense) return;
    try {
      await updateExpense.mutateAsync({
        id: editingExpense.id,
        amount: values.amount,
        description: values.description ?? null,
        userId: userId ?? "",
      });
      message.success("Expense updated.");
      setEditingExpense(null);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Unable to update expense.",
      );
    }
  };

  const handleCreateExpense = async (values: any, file?: File) => {
    if (!userId) {
      message.error("You need to be signed in to add an expense.");
      return;
    }
    try {
      const billImageUrl = file ? await uploadBillImage(userId, file) : null;
      await createExpense.mutateAsync({
        createdBy: userId,
        category: values.category,
        amount: values.amount,
        date: values.date.format("YYYY-MM-DD"),
        lastDate: values.last_date
          ? values.last_date.format("YYYY-MM-DD")
          : undefined,
        description: values.description,
        participantIds:
          values.category === "weekend_meal"
            ? (values.participantIds ?? [])
            : profiles.map((profile) => profile.id),
        billImageUrl,
      });
      message.success("Expense saved successfully.");
      setAddModalOpen(false);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Unable to save the expense.",
      );
    }
  };

  const handleDeleteExpense = async (expenseId: string, label?: string) => {
    try {
      await deleteExpense.mutateAsync({
        expenseId,
        userId: userId ?? "",
        label,
      });
      message.success("Expense deleted.");
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Unable to delete the expense.",
      );
    }
  };

  const handleSaveMemberCount = async () => {
    const count = draftMemberCount ?? memberCount;
    if (!count || count < 1) {
      message.error("Please enter a valid member count.");
      return;
    }
    try {
      await saveMemberCount.mutateAsync(count);
      message.success("Member count updated.");
      setDraftMemberCount(null);
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Unable to update the member count.",
      );
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      await deletePayment.mutateAsync({ id, userId: userId ?? "" });
      message.success("Payment record removed.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Unable to delete.");
    }
  };

  const isLoading =
    expensesQuery.isLoading ||
    profilesQuery.isLoading ||
    memberCountQuery.isLoading;
  const error =
    (expensesQuery.error as Error | null) ??
    (profilesQuery.error as Error | null) ??
    (memberCountQuery.error as Error | null);

  const pTh: React.CSSProperties = {
    padding: "8px 12px",
    textAlign: "left",
    borderBottom: "2px solid #e8e8e8",
    fontWeight: 700,
  };
  const pTd: React.CSSProperties = {
    padding: "7px 12px",
    borderBottom: "1px solid #f0f0f0",
  };

  return (
    <PageStack>
      <PageHeader
        title="Expenses"
        subtitle="Track monthly expenses, record weekend meal splits, and calculate what each flatmate owes."
        breadcrumbs={[{ title: "Home", path: "/" }, { title: "Expenses" }]}
        actions={
          <Space wrap>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(value) =>
                value && setSelectedMonth(value.startOf("month"))
              }
            />
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                exportExpensesToExcel(expenses, selectedMonth.format("YYYY-MM"))
              }
            >
              Download Excel
            </Button>
            {canManageExpenses && (
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
            title="Total Expenses"
            value={formatCurrency(fixedTotal)}
            subtitle={formatMonthYear(selectedMonth)}
            icon={<WalletOutlined />}
            color="var(--primary)"
          />
          <SummaryStat
            title="Per-person Share"
            value={formatCurrency(perMemberShare)}
            subtitle="Each member owes"
            icon={<UserOutlined />}
            color="#7c3aed"
          />
          <SummaryStat
            title="Member Count"
            value={memberCount}
            subtitle="Active flatmates"
            icon={<TeamOutlined />}
            color="#059669"
          />
        </ResponsiveGrid>

        <SectionBlock>
          <Flex
            justify="space-between"
            align="center"
            wrap
            gap={8}
            style={{ marginBottom: 4 }}
          >
            <Typography.Title
              level={4}
              style={{ margin: 0, color: "var(--text-strong)" }}
            >
              Shared Expenses
            </Typography.Title>
            <Flex wrap gap={8}>
              <Button icon={<PrinterOutlined />} onClick={handleOpenPrint}>
                Print
              </Button>
              <Button
                icon={<ShareAltOutlined />}
                onClick={() => setDistributeOpen(true)}
              >
                Distribute
              </Button>
            </Flex>
          </Flex>
          <Typography.Text style={{ color: "var(--text-muted)" }}>
            Total amount for {formatMonthYear(selectedMonth)} divided by member
            count.
          </Typography.Text>
          <div style={{ marginTop: 16 }}>
            {isMobile ? (
              <MobileExpensesList
                expenses={fixedExpenses}
                isAdmin={isAdmin}
                fixedTotal={fixedTotal}
                perMemberShare={perMemberShare}
                onEdit={setEditingExpense}
                onDelete={handleDeleteExpense}
              />
            ) : (
              <FixedExpensesTable
                expenses={fixedExpenses}
                isAdmin={isAdmin}
                expandedDescriptions={expandedDescriptions}
                onToggleDescription={toggleDescription}
                onEdit={setEditingExpense}
                onDelete={handleDeleteExpense}
              />
            )}
          </div>
        </SectionBlock>

        <SectionBlock>
          <Typography.Title
            level={4}
            style={{ marginTop: 0, color: "var(--text-strong)" }}
          >
            Weekend Expenses
          </Typography.Title>
          <Typography.Text style={{ color: "var(--text-muted)" }}>
            Meals recorded on Saturdays and Sundays are divided only among
            selected participants.
          </Typography.Text>
          <div style={{ marginTop: 16 }}>
            {isMobile ? (
              <MobileWeekendExpensesList
                expenses={weekendExpenses}
                isAdmin={isAdmin}
                onDelete={handleDeleteExpense}
              />
            ) : (
              <WeekendExpensesTable
                expenses={weekendExpenses}
                isAdmin={isAdmin}
                onDelete={handleDeleteExpense}
              />
            )}
          </div>
        </SectionBlock>

        <SectionBlock>
          <Flex
            justify="space-between"
            align="center"
            wrap
            gap={8}
            style={{ marginBottom: 4 }}
          >
            <div>
              <Typography.Title
                level={4}
                style={{
                  marginTop: 0,
                  marginBottom: 0,
                  color: "var(--text-strong)",
                }}
              >
                Monthly Owed Per User
              </Typography.Title>
              <Typography.Text
                style={{ color: "var(--text-muted)", fontSize: 12 }}
              >
                Share plus weekend participation. Submit payment proof on
                Dashboard.
              </Typography.Text>
            </div>
          </Flex>
          <div style={{ marginTop: 12 }}>
            {isMobile ? (
              <MobileUserSummaryList
                summaries={userSummary}
                paymentsByUser={paymentsByUser}
                selectedMonth={selectedMonth}
                userId={userId}
                isAdmin={isAdmin}
                onDeletePayment={handleDeletePayment}
              />
            ) : (
              <UserSummaryTable
                summaries={userSummary}
                paymentsByUser={paymentsByUser}
                selectedMonth={selectedMonth}
                userId={userId}
                isAdmin={isAdmin}
                onDeletePayment={handleDeletePayment}
              />
            )}
          </div>
        </SectionBlock>

        {isAdmin && (
          <SectionBlock>
            <BillDistribution
              profiles={profiles}
              memberCount={memberCount}
              draftMemberCount={draftMemberCount}
              isPending={saveMemberCount.isPending}
              onDraftChange={setDraftMemberCount}
              onSave={handleSaveMemberCount}
            />
          </SectionBlock>
        )}
      </QueryState>

      <AddExpenseModal
        open={addModalOpen}
        submitting={createExpense.isPending}
        profiles={profiles}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreateExpense}
      />
      <EditExpenseModal
        open={editingExpense !== null}
        submitting={updateExpense.isPending}
        editingExpense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSubmit={handleEditExpense}
      />
      <DistributeModal
        open={distributeOpen}
        fixedTotal={fixedTotal}
        perMemberShare={perMemberShare}
        memberCount={memberCount}
        isAdmin={isAdmin}
        onClose={() => setDistributeOpen(false)}
        onSaveMemberCount={saveMemberCount.mutateAsync}
      />
      <PrintModal
        open={printOpen}
        capturing={capturing}
        printImageUrl={printImageUrl}
        onClose={() => setPrintOpen(false)}
        onSave={handleSavePrintImage}
      />

      <PrintWrapper>
        <div ref={printRef}>
          <PrintContent>
            <PrintHeader>
              <PrintTitle>Shared Expenses</PrintTitle>
              <PrintSubtitle>{selectedMonth.format("MMMM YYYY")}</PrintSubtitle>
            </PrintHeader>
            <PrintSummary>
              <PrintSummaryCard $color="var(--primary)">
                <PrintLabel>Total Expenses</PrintLabel>
                <PrintValue $color="var(--primary)">
                  {formatCurrency(fixedTotal)}
                </PrintValue>
              </PrintSummaryCard>
              <PrintSummaryCard $color="var(--blue-700)">
                <PrintLabel>Per-person Share</PrintLabel>
                <PrintValue $color="var(--blue-700)">
                  {formatCurrency(perMemberShare)}
                </PrintValue>
              </PrintSummaryCard>
              <PrintSummaryCard $color="var(--info)">
                <PrintLabel>Members</PrintLabel>
                <PrintValue $color="var(--info)">{memberCount}</PrintValue>
              </PrintSummaryCard>
            </PrintSummary>
            <div style={{ padding: "0 0 20px" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ background: "#f0f5ff" }}>
                    <th style={pTh}>Date</th>
                    <th style={pTh}>Category</th>
                    <th style={pTh}>Paid Amount</th>
                    <th style={pTh}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {fixedExpenses.map((exp, i) => (
                    <tr
                      key={exp.id}
                      style={{ background: i % 2 === 0 ? "#fff" : "#f8faff" }}
                    >
                      <td style={pTd}>{formatDate(exp.date)}</td>
                      <td style={pTd}>
                        <CategoryBadge $color="var(--primary)">
                          {CATEGORY_LABELS[exp.category]}
                        </CategoryBadge>
                      </td>
                      <td style={{ ...pTd, fontWeight: 600, color: "#111" }}>
                        {formatCurrency(exp.amount)}
                      </td>
                      <td style={{ ...pTd, color: "#555" }}>
                        {exp.description || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr
                    style={{
                      background:
                        "linear-gradient(90deg, var(--primary-soft), var(--bg-elevated))",
                    }}
                  >
                    <td
                      style={{
                        ...pTd,
                        fontWeight: 700,
                        color: "var(--primary)",
                      }}
                      colSpan={2}
                    >
                      Total
                    </td>
                    <td
                      style={{
                        ...pTd,
                        fontWeight: 700,
                        color: "var(--primary)",
                        fontSize: 14,
                      }}
                    >
                      {formatCurrency(fixedTotal)}
                    </td>
                    <td
                      style={{
                        ...pTd,
                        fontWeight: 700,
                        color: "var(--blue-700)",
                      }}
                    >
                      Per-person: {formatCurrency(perMemberShare)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <PrintFooter>
              Generated by MilBaant · {dayjs().format("DD MMM YYYY")}
            </PrintFooter>
          </PrintContent>
        </div>
      </PrintWrapper>
    </PageStack>
  );
}
