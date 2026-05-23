import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  App,
  Button,
  Col,
  DatePicker,
  Divider,
  Flex,
  Form,
  Grid,
  InputNumber,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  EditOutlined,
  StopOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { PageStack, SectionBlock } from "@/components/Glass/index";
import { QueryState } from "@/components/QueryState";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import {
  useAdvanceContribution,
  usePublishPlan,
  useSavePlan,
  useUnpublishPlan,
} from "@/hooks/useAdvanceContributions";
import {
  ADVANCE_CATEGORY_KEYS,
  ADVANCE_CATEGORY_LABELS,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import type {
  AdvanceCategoryKey,
  SavePlanInput,
  UserContributionSummary,
} from "@/lib/types";

const { useBreakpoint } = Grid;

export function AdminContributionManager() {
  const [month, setMonth] = useState(() => dayjs().format("YYYY-MM"));
  const { profile } = useAuth();
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const profilesQuery = useProfiles();
  const { plan, categoryBudgets, totalBudget, breakdowns, isLoading, error } =
    useAdvanceContribution(month);
  const savePlan = useSavePlan();
  const publishPlan = usePublishPlan();
  const unpublishPlan = useUnpublishPlan();

  /* ── Active flatmates (non-cook) ──────────────────────────────────────── */
  const flatmates = useMemo(
    () =>
      (profilesQuery.data ?? []).filter(
        (p) => p.is_active !== false && p.role !== "cook",
      ),
    [profilesQuery.data],
  );

  /* ── Budget form ─────────────────────────────────────────────────────── */
  const [budgetForm] = Form.useForm<Record<AdvanceCategoryKey, number>>();
  const [liveTotal, setLiveTotal] = useState(0);

  useEffect(() => {
    const vals: Partial<Record<AdvanceCategoryKey, number>> = {};
    for (const key of ADVANCE_CATEGORY_KEYS) {
      vals[key] = categoryBudgets[key] ?? 0;
    }
    budgetForm.setFieldsValue(vals);
    setLiveTotal(totalBudget);
  }, [categoryBudgets, totalBudget, budgetForm]);

  const handleValuesChange = () => {
    const vals = budgetForm.getFieldsValue();
    const sum = ADVANCE_CATEGORY_KEYS.reduce(
      (s, k) => s + (Number(vals[k]) || 0),
      0,
    );
    setLiveTotal(sum);
  };

  const perPerson = flatmates.length > 0 ? liveTotal / flatmates.length : 0;

  /* ── Override state ──────────────────────────────────────────────────── */
  const [overrides, setOverrides] = useState<Record<string, number | null>>({});

  useEffect(() => {
    const map: Record<string, number | null> = {};
    for (const b of breakdowns) map[b.user_id] = b.override_amount;
    setOverrides(map);
  }, [breakdowns]);

  const memberSummaries: UserContributionSummary[] = useMemo(
    () =>
      flatmates.map((f) => ({
        userId: f.id,
        fullName: f.full_name,
        defaultAmount: perPerson,
        overrideAmount: overrides[f.id] ?? null,
        finalAmount: overrides[f.id] ?? perPerson,
      })),
    [flatmates, perPerson, overrides],
  );

  /* ── Save helpers ────────────────────────────────────────────────────── */
  const buildInput = (): SavePlanInput => ({
    month,
    budgets: budgetForm.getFieldsValue() as Partial<
      Record<AdvanceCategoryKey, number>
    >,
    flatmateCount: flatmates.length,
    overrides: flatmates.map((f) => ({
      userId: f.id,
      overrideAmount: overrides[f.id] ?? null,
    })),
    createdBy: profile!.id,
  });

  const handleSaveDraft = async () => {
    try {
      await budgetForm.validateFields();
      await savePlan.mutateAsync(buildInput());
      void message.success("Draft saved");
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      void message.error((e as Error)?.message ?? "Save failed");
    }
  };

  const handlePublish = async () => {
    try {
      await budgetForm.validateFields();
      const saved = await savePlan.mutateAsync(buildInput());
      await publishPlan.mutateAsync({
        planId: saved.id,
        publishedBy: profile!.id,
      });
      void message.success("Contribution plan published");
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      void message.error((e as Error)?.message ?? "Publish failed");
    }
  };

  const handleUnpublish = async () => {
    if (!plan) return;
    try {
      await unpublishPlan.mutateAsync({ planId: plan.id, userId: profile!.id });
      void message.success("Plan unpublished");
    } catch (e: unknown) {
      void message.error((e as Error)?.message ?? "Unpublish failed");
    }
  };

  const isBusy =
    savePlan.isPending || publishPlan.isPending || unpublishPlan.isPending;

  /* ── Override table columns ──────────────────────────────────────────── */
  const overrideColumns: ColumnsType<UserContributionSummary> = [
    {
      title: "Flatmate",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Default Share",
      key: "default",
      render: (_: unknown, row: UserContributionSummary) => (
        <span style={{ color: "var(--text-muted)" }}>
          {formatCurrency(row.defaultAmount)}
        </span>
      ),
    },
    {
      title: "Override",
      key: "override",
      render: (_: unknown, row: UserContributionSummary) => (
        <InputNumber
          min={0}
          step={100}
          placeholder="—"
          value={row.overrideAmount ?? undefined}
          onChange={(val) =>
            setOverrides((prev) => ({ ...prev, [row.userId]: val }))
          }
          style={{ width: isMobile ? 110 : 140 }}
          formatter={(v) =>
            v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
          }
          parser={(v) => Number(v?.replace(/,/g, "") ?? 0) as unknown as number}
        />
      ),
    },
    {
      title: "Final Amount",
      key: "final",
      render: (_: unknown, row: UserContributionSummary) => (
        <strong style={{ color: "var(--primary)" }}>
          {formatCurrency(row.finalAmount)}
        </strong>
      ),
    },
  ];

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <PageStack>
      {/* ── Month + status bar ── */}
      <SectionBlock>
        <Flex
          justify="space-between"
          align="center"
          wrap="wrap"
          gap={8}
          style={{ marginBottom: 20 }}
        >
          <DatePicker
            picker="month"
            value={dayjs(month)}
            onChange={(d) => {
              if (d) setMonth(d.format("YYYY-MM"));
            }}
            format="MMMM YYYY"
            allowClear={false}
          />
          {plan && (
            <Tag
              icon={
                plan.is_published ? <CheckCircleOutlined /> : <EditOutlined />
              }
              color={plan.is_published ? "success" : "processing"}
            >
              {plan.is_published ? "Published" : "Draft"}
            </Tag>
          )}
        </Flex>

        {/* ── Budget inputs ── */}
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
          Category Budgets
        </Typography.Title>

        <QueryState isLoading={isLoading} error={error}>
          <Form
            form={budgetForm}
            onValuesChange={handleValuesChange}
            layout="vertical"
          >
            <Row gutter={[12, 0]}>
              {ADVANCE_CATEGORY_KEYS.map((key) => (
                <Col xs={12} sm={8} md={6} key={key}>
                  <Form.Item
                    name={key}
                    label={ADVANCE_CATEGORY_LABELS[key]}
                    initialValue={0}
                    rules={[
                      {
                        type: "number",
                        min: 0,
                        message: "Must be ≥ 0",
                      },
                    ]}
                  >
                    <InputNumber<number>
                      min={0}
                      step={500}
                      style={{ width: "100%" }}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => Number(value?.replace(/,/g, "") ?? 0)}
                    />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </Form>

          <Divider style={{ margin: "8px 0 16px" }} />

          {/* ── Totals strip ── */}
          <Row gutter={16}>
            <Col xs={8}>
              <Statistic
                title="Total Budget"
                value={Math.round(liveTotal)}
                prefix="PKR"
                valueStyle={{ fontSize: isMobile ? 16 : 20 }}
              />
            </Col>
            <Col xs={8}>
              <Statistic
                title="Flatmates"
                value={flatmates.length}
                valueStyle={{ fontSize: isMobile ? 16 : 20 }}
              />
            </Col>
            <Col xs={8}>
              <Statistic
                title="Per Person"
                value={Math.round(perPerson)}
                prefix="PKR"
                valueStyle={{
                  fontSize: isMobile ? 16 : 20,
                  color: "var(--primary)",
                }}
              />
            </Col>
          </Row>
        </QueryState>
      </SectionBlock>

      {/* ── Flatmate overrides ── */}
      <SectionBlock>
        <Flex
          justify="space-between"
          align="center"
          style={{ marginBottom: 12 }}
        >
          <Typography.Title level={5} style={{ margin: 0 }}>
            Per-Flatmate Amounts
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Leave override blank to use default share
          </Typography.Text>
        </Flex>

        <Table
          dataSource={memberSummaries}
          columns={overrideColumns}
          rowKey="userId"
          pagination={false}
          size="small"
          scroll={isMobile ? { x: true } : undefined}
        />
      </SectionBlock>

      {/* ── Action buttons ── */}
      <Flex gap={8} justify="flex-end">
        <Button
          onClick={handleSaveDraft}
          loading={savePlan.isPending && !publishPlan.isPending}
          disabled={isBusy}
        >
          Save Draft
        </Button>

        {plan?.is_published ? (
          <Button
            icon={<StopOutlined />}
            danger
            onClick={handleUnpublish}
            loading={unpublishPlan.isPending}
            disabled={isBusy}
          >
            Unpublish
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handlePublish}
            loading={publishPlan.isPending || savePlan.isPending}
            disabled={isBusy}
          >
            Save &amp; Publish
          </Button>
        )}
      </Flex>
    </PageStack>
  );
}
