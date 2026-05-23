import { useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import html2canvas from "html2canvas";
import {
  Alert,
  Button,
  Col,
  Flex,
  Grid,
  Row,
  Space,
  Typography,
  message,
} from "antd";
import {
  DollarCircleOutlined,
  FileExcelOutlined,
  MinusCircleOutlined,
  PictureOutlined,
  PlusCircleOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/PageHeader/index";
import { QueryState } from "@/components/QueryState";
import { PageStack, SectionBlock } from "@/components/Glass/index";
import { SummaryStat } from "@/components/SummaryStat";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import {
  useCreateFlatFundAllocation,
  useCreateFlatFundExpense,
  useDeleteFlatFundAllocation,
  useDeleteFlatFundExpense,
  useFlatFundAllocations,
  useFlatFundExpenses,
} from "@/hooks/useFlatFund";
import { exportFlatExpensesToExcel } from "@/lib/export";
import { formatCurrency } from "@/lib/formatters";
import { AllocateModal } from "./components/AllocateModal";
import { LogExpenseModal } from "./components/LogExpenseModal";
import { MemberBalanceCardComponent } from "./components/MemberBalanceCard";
import { ExpensesTable } from "./components/ExpensesTable";
import { AllocationsTable } from "./components/AllocationsTable";
import { MobileExpensesList } from "./components/MobileExpensesList";
import { MobileAllocationsList } from "./components/MobileAllocationsList";
import { buildMemberSummaries } from "./components/helpers";
import { PrintWrapper } from "./components/styles";

const { useBreakpoint } = Grid;

export function FlatExpensesPage() {
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { userId, isAdmin } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const profilesQuery = useProfiles();
  const allocationsQuery = useFlatFundAllocations();
  const expensesQuery = useFlatFundExpenses();
  const createAllocation = useCreateFlatFundAllocation();
  const createExpense = useCreateFlatFundExpense();
  const deleteAllocation = useDeleteFlatFundAllocation();
  const deleteExpense = useDeleteFlatFundExpense();

  const profiles = useMemo(
    () => (profilesQuery.data ?? []).filter((p) => p.role !== "cook"),
    [profilesQuery.data],
  );
  const allocations = useMemo(
    () => allocationsQuery.data ?? [],
    [allocationsQuery.data],
  );
  const expenses = useMemo(
    () => expensesQuery.data ?? [],
    [expensesQuery.data],
  );

  const summaries = useMemo(
    () => buildMemberSummaries(allocations, expenses, profiles),
    [allocations, expenses, profiles],
  );

  const totalAllocated = allocations.reduce((s, a) => s + a.amount, 0);
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalBalance = totalAllocated - totalSpent;

  async function handleCreateAllocation(input: any) {
    try {
      await createAllocation.mutateAsync(input);
      message.success("Allocation recorded.");
      setAllocateOpen(false);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Unable to save.");
    }
  }

  async function handleCreateExpense(input: any) {
    try {
      await createExpense.mutateAsync(input);
      message.success("Expense logged.");
      setExpenseOpen(false);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Unable to save.");
    }
  }

  async function handleDeleteAllocation(id: string) {
    try {
      await deleteAllocation.mutateAsync({ id, userId: userId ?? "" });
      message.success("Allocation removed.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Unable to delete.");
    }
  }

  async function handleDeleteExpense(id: string) {
    try {
      await deleteExpense.mutateAsync({ id, userId: userId ?? "" });
      message.success("Expense removed.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Unable to delete.");
    }
  }

  async function handleDownloadXlsx() {
    try {
      await exportFlatExpensesToExcel(expenses, allocations);
      message.success("Excel file downloaded.");
    } catch {
      message.error("Failed to export Excel.");
    }
  }

  async function handleDownloadImage() {
    if (!printRef.current) return;
    setCapturing(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `flat-expenses-${dayjs().format("YYYY-MM-DD")}.png`;
      link.click();
      message.success("Image downloaded.");
    } catch {
      message.error("Failed to capture image.");
    } finally {
      setCapturing(false);
    }
  }

  const isLoading =
    profilesQuery.isLoading ||
    allocationsQuery.isLoading ||
    expensesQuery.isLoading;
  const error =
    (profilesQuery.error as Error | null) ??
    (allocationsQuery.error as Error | null) ??
    (expensesQuery.error as Error | null);

  return (
    <PageStack>
      <PageHeader
        title="Flat Expenses"
        subtitle="Track shared flat money — allocate funds to members and log what they spend on flat items like bulbs, bread, water bottles, and more."
        breadcrumbs={[{ title: "Home", path: "/" }, { title: "Flat Fund" }]}
        actions={
          <Space wrap>
            {!!userId && (
              <Button
                icon={<MinusCircleOutlined />}
                onClick={() => setExpenseOpen(true)}
              >
                Log Expense
              </Button>
            )}
            {isAdmin && (
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => setAllocateOpen(true)}
              >
                Allocate Funds
              </Button>
            )}
          </Space>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={8}>
            <SummaryStat
              title="Total Allocated"
              value={formatCurrency(totalAllocated)}
              subtitle="Total flat fund given to members."
              icon={<WalletOutlined />}
              color="var(--primary)"
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryStat
              title="Total Spent"
              value={formatCurrency(totalSpent)}
              subtitle="Total spent from flat fund."
              icon={<DollarCircleOutlined />}
              color="#ff4d4f"
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryStat
              title="Remaining Balance"
              value={formatCurrency(totalBalance)}
              subtitle={
                totalBalance >= 0
                  ? "Still available in flat fund."
                  : "Overspent — needs top-up."
              }
              icon={<WalletOutlined />}
              color={totalBalance >= 0 ? "#52c41a" : "#ff4d4f"}
            />
          </Col>
        </Row>

        <SectionBlock>
          <Typography.Title
            level={5}
            style={{ margin: "0 0 14px", color: "var(--text-strong)" }}
          >
            Member Balances
          </Typography.Title>
          {summaries.length === 0 ? (
            <Alert
              type="info"
              showIcon
              title="No allocations yet. Admins can allocate flat fund money to members."
            />
          ) : (
            <Row gutter={[10, 10]}>
              {summaries.map((s) => (
                <MemberBalanceCardComponent key={s.userId} member={s} />
              ))}
            </Row>
          )}
        </SectionBlock>

        <div ref={printRef}>
          <PrintWrapper>
            <SectionBlock>
              <Flex
                align="center"
                justify="space-between"
                wrap
                gap={8}
                style={{ marginBottom: 10 }}
              >
                <Typography.Title
                  level={5}
                  style={{ margin: 0, color: "var(--text-strong)" }}
                >
                  <MinusCircleOutlined
                    style={{ marginRight: 8, color: "#ff4d4f" }}
                  />
                  Flat Expenses Log
                </Typography.Title>
                <Space size={6}>
                  <Button
                    size="small"
                    icon={<PictureOutlined />}
                    loading={capturing}
                    onClick={() => void handleDownloadImage()}
                  >
                    Save as Image
                  </Button>
                  <Button
                    size="small"
                    icon={<FileExcelOutlined />}
                    onClick={() => void handleDownloadXlsx()}
                  >
                    Excel
                  </Button>
                </Space>
              </Flex>
              {isMobile ? (
                <MobileExpensesList
                  expenses={expenses}
                  userId={userId}
                  isAdmin={isAdmin}
                  onDelete={handleDeleteExpense}
                />
              ) : (
                <ExpensesTable
                  expenses={expenses}
                  userId={userId}
                  isAdmin={isAdmin}
                  onDelete={handleDeleteExpense}
                />
              )}
            </SectionBlock>

            <SectionBlock>
              <Typography.Title
                level={5}
                style={{ margin: "0 0 10px", color: "var(--text-strong)" }}
              >
                <PlusCircleOutlined
                  style={{ marginRight: 8, color: "#52c41a" }}
                />
                Fund Allocations
              </Typography.Title>
              {isMobile ? (
                <MobileAllocationsList
                  allocations={allocations}
                  isAdmin={isAdmin}
                  onDelete={handleDeleteAllocation}
                />
              ) : (
                <AllocationsTable
                  allocations={allocations}
                  isAdmin={isAdmin}
                  onDelete={handleDeleteAllocation}
                />
              )}
            </SectionBlock>
          </PrintWrapper>
        </div>
      </QueryState>

      {allocateOpen && (
        <AllocateModal
          profiles={profiles}
          userId={userId ?? ""}
          submitting={createAllocation.isPending}
          onClose={() => setAllocateOpen(false)}
          onSubmit={handleCreateAllocation}
        />
      )}

      {expenseOpen && (
        <LogExpenseModal
          profiles={profiles}
          userId={userId ?? ""}
          submitting={createExpense.isPending}
          onClose={() => setExpenseOpen(false)}
          onSubmit={handleCreateExpense}
        />
      )}
    </PageStack>
  );
}
