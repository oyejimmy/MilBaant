import { useState } from "react";
import { type Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Flex,
  Grid,
  Popconfirm,
  Progress,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CoffeeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  MobileCard,
  MobileLabel,
  MobileRow,
  PageStack,
  ResponsiveGrid,
  SectionBlock,
} from "@/components/Glass";
import { SummaryStat } from "@/components/SummaryStat";
import { useAuth } from "@/hooks/useAuth";
import {
  useCookAdvances,
  useCookPurchases,
  useCreateAdvance,
  useCreatePurchase,
  useDeleteAdvance,
  useDeletePurchase,
} from "@/hooks/useCook";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import type { CookAdvance, CookPurchase, PurchaseCategory } from "./types";
import {
  BalanceAmount,
  BalanceCard,
  CategoryCard,
  SectionTitle,
} from "./styles";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  PURCHASE_CATEGORY_COLORS,
  PURCHASE_CATEGORY_OPTIONS,
} from "@/lib/constants";
import { exportCookPurchasesToExcel } from "@/lib/export";
import { GiveAdvanceModal } from "./components/GiveAdvanceModal";
import { LogCookPurchaseModal } from "./components/LogCookPurchaseModal";

const { useBreakpoint } = Grid;

export function CookPage() {
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState<Dayjs | null>(null);

  const { userId, isAdmin } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const advancesQuery = useCookAdvances();
  const purchasesQuery = useCookPurchases();

  const createAdvance = useCreateAdvance();
  const createPurchase = useCreatePurchase();
  const deleteAdvance = useDeleteAdvance();
  const deletePurchase = useDeletePurchase();

  const allAdvances = advancesQuery.data ?? [];
  const allPurchases = purchasesQuery.data ?? [];

  const advances = filterMonth
    ? allAdvances.filter((a) =>
        a.date.startsWith(filterMonth.format("YYYY-MM")),
      )
    : allAdvances;

  const purchases = filterMonth
    ? allPurchases.filter((p) =>
        p.date.startsWith(filterMonth.format("YYYY-MM")),
      )
    : allPurchases;

  const totalAdvanced = advances.reduce((s, a) => s + a.amount, 0);
  const totalSpent = purchases.reduce((s, p) => s + p.amount, 0);
  const balance = totalAdvanced - totalSpent;

  const balanceStatus =
    balance > 0.01 ? "surplus" : balance < -0.01 ? "deficit" : "zero";

  const usedPercent =
    totalAdvanced > 0 ? Math.min(100, (totalSpent / totalAdvanced) * 100) : 0;

  const categoryBreakdown = PURCHASE_CATEGORY_OPTIONS.map(
    ({ label, value }) => ({
      label,
      value,
      total: purchases
        .filter((p) => p.category === value)
        .reduce((s, p) => s + p.amount, 0),
    }),
  ).filter((c) => c.total > 0);

  /* ── Handlers ── */

  async function handleCreateAdvance(values: {
    amount: number;
    date: Dayjs;
    note: string;
  }) {
    if (!userId) return;
    try {
      await createAdvance.mutateAsync({
        ...values,
        date: values.date.format("YYYY-MM-DD"),
        givenBy: userId,
      });
      message.success("Advance saved");
      setAdvanceOpen(false);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Unable to save.");
    }
  }

  async function handleCreatePurchase(values: {
    date: Dayjs;
    item: string;
    amount: number;
    category: PurchaseCategory;
    note: string;
  }) {
    if (!userId) return;
    try {
      await createPurchase.mutateAsync({
        ...values,
        date: values.date.format("YYYY-MM-DD"),
        createdBy: userId,
      });
      message.success("Purchase saved");
      setPurchaseOpen(false);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Unable to save.");
    }
  }

  async function handleDeleteAdvance(id: string) {
    try {
      await deleteAdvance.mutateAsync({ id, userId: userId ?? "" });
      message.success("Advance removed.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Unable to delete.");
    }
  }

  async function handleDeletePurchase(id: string) {
    try {
      await deletePurchase.mutateAsync({ id, userId: userId ?? "" });
      message.success("Purchase removed.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Unable to delete.");
    }
  }

  /* ── Table columns ── */

  const purchaseColumns: ColumnsType<CookPurchase> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 110,
      render: (v: string) => formatDate(v),
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: "Item",
      dataIndex: "item",
      key: "item",
      render: (v: string) => (
        <Typography.Text strong style={{ color: "var(--text-strong)" }}>
          {v}
        </Typography.Text>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 110,
      render: (v: string) => (
        <Tag
          color={PURCHASE_CATEGORY_COLORS[v] ?? "default"}
          style={{ textTransform: "capitalize" }}
        >
          {v}
        </Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => (
        <Typography.Text strong style={{ color: "#ff4d4f" }}>
          -{formatCurrency(v)}
        </Typography.Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Logged By",
      key: "creator",
      responsive: ["md"] as "md"[],
      render: (_: unknown, r: CookPurchase) => (
        <Tag color="purple">{r.creator?.full_name ?? "—"}</Tag>
      ),
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
      responsive: ["lg"] as "lg"[],
      render: (v: string | null) =>
        v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: "",
      key: "del",
      width: 50,
      render: (_: unknown, r: CookPurchase) =>
        userId ? (
          <Popconfirm
            title="Remove this purchase?"
            onConfirm={() => void handleDeletePurchase(r.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null,
    },
  ];

  const advanceColumns: ColumnsType<CookAdvance> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 110,
      render: (v: string) => formatDate(v),
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: "Amount Given",
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => (
        <Typography.Text strong style={{ color: "#52c41a" }}>
          +{formatCurrency(v)}
        </Typography.Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Given By",
      key: "givenBy",
      render: (_: unknown, r: CookAdvance) => (
        <Tag color="blue">{r.giver?.full_name ?? "—"}</Tag>
      ),
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
      responsive: ["md"] as "md"[],
      render: (v: string | null) =>
        v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: "",
      key: "del",
      width: 50,
      render: (_: unknown, r: CookAdvance) =>
        isAdmin || !!userId ? (
          <Popconfirm
            title="Remove this advance?"
            onConfirm={() => void handleDeleteAdvance(r.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null,
    },
  ];

  const isLoading = advancesQuery.isLoading || purchasesQuery.isLoading;
  const error =
    (advancesQuery.error as Error | null) ??
    (purchasesQuery.error as Error | null);

  return (
    <PageStack>
      <PageHeader
        title="Flat Ka Khata"
        subtitle="Track advance money given to the cook and every item purchased with it."
        breadcrumbs={[{ title: "Home", path: "/" }, { title: "Flat Ka Khata" }]}
        actions={
          <Space wrap>
            <DatePicker
              picker="month"
              placeholder="Select a Month"
              value={filterMonth}
              onChange={(v) => setFilterMonth(v ? v.startOf("month") : null)}
              allowClear
            />
            {!!userId && (
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() => setPurchaseOpen(true)}
              >
                Nayi Khareedari
              </Button>
            )}
            {isAdmin && (
              <Button
                type="primary"
                icon={<WalletOutlined />}
                onClick={() => setAdvanceOpen(true)}
              >
                Give Advance
              </Button>
            )}
          </Space>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        {/* Balance card */}
        <BalanceCard $status={balanceStatus}>
          <Flex vertical={isMobile} gap={isMobile ? 8 : 0} style={{ width: "100%" }}>
            <div style={{ flex: 1, marginBottom: 0 }}>
              <Typography.Text
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.78rem",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                CURRENT BALANCE
              </Typography.Text>
              <BalanceAmount $status={balanceStatus}>
                {balance >= 0 ? "+" : ""}
                {formatCurrency(balance)}
              </BalanceAmount>
              <Typography.Text
                style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: 0 }}
              >
                {balanceStatus === "surplus"
                  ? `Cook has ${formatCurrency(balance)} remaining`
                  : balanceStatus === "deficit"
                    ? `Cook overspent by ${formatCurrency(Math.abs(balance))}`
                    : "Advance fully used"}
              </Typography.Text>
            </div>

            <div style={{ minWidth: 140, flex: "1 1 140px", maxWidth: isMobile ? "100%" : 220, marginBottom: 0 }}>
              <Flex justify="space-between" style={{ marginBottom: 6 }}>
                <Typography.Text
                  style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}
                >
                  Used {usedPercent.toFixed(0)}%
                </Typography.Text>
                <Typography.Text
                  style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}
                >
                  {formatCurrency(totalSpent)} / {formatCurrency(totalAdvanced)}
                </Typography.Text>
              </Flex>
              <Progress
                percent={usedPercent}
                showInfo={false}
                strokeColor={balanceStatus === "deficit" ? "#ff4d4f" : "#52c41a"}
                size="small"
                style={{ marginBottom: 0 }}
              />
            </div>
          </Flex>
        </BalanceCard>

        {/* Summary stats */}
        <ResponsiveGrid>
          <SummaryStat
            title="Total Advanced"
            value={formatCurrency(totalAdvanced)}
            subtitle="Money given to cook."
            icon={<WalletOutlined />}
            color="var(--primary)"
          />
          <SummaryStat
            title="Total Spent"
            value={formatCurrency(totalSpent)}
            subtitle="Items purchased."
            icon={<CoffeeOutlined />}
            color="#ff4d4f"
          />
          <SummaryStat
            title="Purchases"
            value={purchases.length}
            subtitle="Items logged."
            icon={<ShoppingCartOutlined />}
            color="#d46b08"
          />
        </ResponsiveGrid>

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <SectionBlock>
            <SectionTitle level={5} style={{ marginBottom: 14 }}>
              Spending by Category
            </SectionTitle>
            <Row gutter={[10, 10]}>
              {categoryBreakdown.map((c) => (
                <Col key={c.value} xs={12} sm={8} md={6} lg={4}>
                  <CategoryCard>
                    <Tag
                      color={PURCHASE_CATEGORY_COLORS[c.value]}
                      style={{ marginBottom: 6 }}
                    >
                      {c.label}
                    </Tag>
                    <Typography.Text
                      strong
                      style={{
                        display: "block",
                        color: "var(--text-strong)",
                        fontSize: "0.88rem",
                      }}
                    >
                      {formatCurrency(c.total)}
                    </Typography.Text>
                  </CategoryCard>
                </Col>
              ))}
            </Row>
          </SectionBlock>
        )}

        {/* Purchases section */}
        <SectionBlock>
          <Flex
            align="center"
            justify="space-between"
            style={{ marginBottom: 12 }}
            wrap
            gap={8}
          >
            <SectionTitle level={5}>
              <ShoppingCartOutlined
                style={{ marginRight: 8, color: "#ff4d4f" }}
              />
              What the Cook Bought
            </SectionTitle>
            <Flex gap={8} align="center">
              <Tag color="red">{formatCurrency(totalSpent)} total</Tag>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                disabled={purchases.length === 0}
                onClick={() =>
                  void exportCookPurchasesToExcel(
                    purchases,
                    filterMonth?.format("YYYY-MM"),
                  )
                }
              >
                Export
              </Button>
            </Flex>
          </Flex>

          {isMobile ? (
            <Flex vertical gap={8} style={{ width: "100%" }}>
              {purchases.length === 0 && (
                <Typography.Text type="secondary">
                  No purchases logged yet.
                </Typography.Text>
              )}
              {purchases.map((p) => (
                <MobileCard key={p.id}>
                  <MobileRow>
                    <Typography.Text
                      strong
                      style={{ color: "var(--text-strong)", fontSize: 13 }}
                    >
                      {p.item}
                    </Typography.Text>
                    <Typography.Text strong style={{ color: "#ff4d4f" }}>
                      -{formatCurrency(p.amount)}
                    </Typography.Text>
                  </MobileRow>
                  <MobileRow>
                    <Flex gap={6} align="center">
                      <MobileLabel>{formatDate(p.date)}</MobileLabel>
                      <Tag
                        color={
                          PURCHASE_CATEGORY_COLORS[p.category] ?? "default"
                        }
                        style={{
                          margin: 0,
                          fontSize: 10,
                          textTransform: "capitalize",
                        }}
                      >
                        {p.category}
                      </Tag>
                    </Flex>
                    {!!userId && (
                      <Popconfirm
                        title="Remove?"
                        onConfirm={() => void handleDeletePurchase(p.id)}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    )}
                  </MobileRow>
                  {p.note && (
                    <Typography.Text
                      style={{ fontSize: 11, color: "var(--text-muted)" }}
                    >
                      {p.note}
                    </Typography.Text>
                  )}
                </MobileCard>
              ))}
            </Flex>
          ) : (
            <Table<CookPurchase>
              rowKey="id"
              size="small"
              columns={purchaseColumns}
              dataSource={purchases}
              pagination={{
                pageSize: 12,
                hideOnSinglePage: true,
                size: "small",
              }}
              scroll={{ x: 500 }}
              locale={{ emptyText: "No purchases logged yet." }}
            />
          )}
        </SectionBlock>

        {/* Advances section */}
        <SectionBlock>
          <Flex
            align="center"
            justify="space-between"
            style={{ marginBottom: 12 }}
            wrap
            gap={8}
          >
            <SectionTitle level={5}>
              <WalletOutlined style={{ marginRight: 8, color: "#52c41a" }} />
              Advances Given
            </SectionTitle>
            <Tag color="green">{formatCurrency(totalAdvanced)} total</Tag>
          </Flex>

          {isMobile ? (
            <Flex vertical gap={8} style={{ width: "100%" }}>
              {advances.length === 0 && (
                <Typography.Text type="secondary">
                  No advances recorded yet.
                </Typography.Text>
              )}
              {advances.map((a) => (
                <MobileCard key={a.id}>
                  <MobileRow>
                    <MobileLabel>{formatDate(a.date)}</MobileLabel>
                    <Typography.Text strong style={{ color: "#52c41a" }}>
                      +{formatCurrency(a.amount)}
                    </Typography.Text>
                  </MobileRow>
                  <MobileRow>
                    <Flex gap={6} align="center">
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                        {a.giver?.full_name ?? "—"}
                      </Tag>
                      {a.note && (
                        <Typography.Text
                          style={{ fontSize: 11, color: "var(--text-muted)" }}
                        >
                          {a.note}
                        </Typography.Text>
                      )}
                    </Flex>
                    {(isAdmin || !!userId) && (
                      <Popconfirm
                        title="Remove?"
                        onConfirm={() => void handleDeleteAdvance(a.id)}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    )}
                  </MobileRow>
                </MobileCard>
              ))}
            </Flex>
          ) : (
            <Table<CookAdvance>
              rowKey="id"
              size="small"
              columns={advanceColumns}
              dataSource={advances}
              pagination={{
                pageSize: 8,
                hideOnSinglePage: true,
                size: "small",
              }}
              scroll={{ x: 450 }}
              locale={{ emptyText: "No advances recorded yet." }}
            />
          )}
        </SectionBlock>

        {/* Deficit warning */}
        {balanceStatus === "deficit" && (
          <Alert
            type="warning"
            showIcon
            description={`Cook overspent by ${formatCurrency(Math.abs(balance))}. Consider recording a new advance or reviewing the purchases.`}
          />
        )}
      </QueryState>

      <GiveAdvanceModal
        open={advanceOpen}
        submitting={createAdvance.isPending}
        onClose={() => setAdvanceOpen(false)}
        onSubmit={handleCreateAdvance}
      />

      <LogCookPurchaseModal
        open={purchaseOpen}
        submitting={createPurchase.isPending}
        onClose={() => setPurchaseOpen(false)}
        onSubmit={handleCreatePurchase}
      />
    </PageStack>
  );
}
