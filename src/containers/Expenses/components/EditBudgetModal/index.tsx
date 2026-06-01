import { useMemo } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Flex,
  Typography,
  Card,
  Row,
  Col,
  Tag,
  Alert,
} from "antd";
import { formatCurrency } from "@/lib/formatters";
import {
  ADVANCE_CATEGORY_KEYS,
  ADVANCE_CATEGORY_LABELS,
  ADVANCE_CATEGORY_COLORS,
} from "@/lib/constants";
import { useProfiles } from "@/hooks/useProfiles";
import type { AdvanceCategoryKey } from "@/lib/types";

interface EditBudgetModalProps {
  open: boolean;
  onClose: () => void;
  categoryBudgets: Partial<Record<AdvanceCategoryKey, number>>;
  /** Real carryover computed from previous month's actual transactions */
  carryoverFromPrevious: number;
  onSave: (
    budgets: Partial<Record<AdvanceCategoryKey, number>>,
    flatmateCount: number
  ) => Promise<void>;
  isPending: boolean;
}

interface BudgetFormValues {
  [key: string]: number | undefined;
}

export function EditBudgetModal({
  open,
  onClose,
  categoryBudgets,
  carryoverFromPrevious,
  onSave,
  isPending,
}: EditBudgetModalProps) {
  const [form] = Form.useForm<BudgetFormValues>();
  const profilesQuery = useProfiles();
  const profiles = profilesQuery.data ?? [];
  const flatmateCount = profiles.filter((p) => p.role !== "cook").length || 1;

  const initialValues = useMemo(
    () =>
      Object.fromEntries(
        ADVANCE_CATEGORY_KEYS.map((key) => [key, categoryBudgets[key] ?? 0])
      ),
    [categoryBudgets]
  );

  // Total budget = sum of expense categories only (carryover is not a category)
  const totalBudget = useMemo(() => {
    let total = 0;
    for (const key of ADVANCE_CATEGORY_KEYS) {
      total += form.getFieldValue(key) ?? categoryBudgets[key] ?? 0;
    }
    return total;
  }, [form, categoryBudgets]);

  // Required collection = budget − real carryover from previous month
  const requiredCollection = Math.max(0, totalBudget - carryoverFromPrevious);
  const perPerson = flatmateCount > 0 ? requiredCollection / flatmateCount : 0;

  const handleOk = async () => {
    const values = await form.validateFields();
    const budgets: Partial<Record<AdvanceCategoryKey, number>> = {};
    for (const key of ADVANCE_CATEGORY_KEYS) {
      if (values[key] && values[key] > 0) {
        budgets[key] = values[key];
      }
    }
    await onSave(budgets, flatmateCount);
    onClose();
  };

  return (
    <Modal
      title="Edit Monthly Budget Estimate"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Save Budget"
      confirmLoading={isPending}
      width="min(600px, 95vw)"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        style={{ marginTop: 8 }}
      >
        {/* Summary card */}
        <Card style={{ marginBottom: 16 }}>
          <Flex justify="space-between" align="center" wrap gap={12}>
            <div>
              <Typography.Text
                style={{
                  display: "block",
                  color: "var(--text-muted)",
                  fontSize: "0.78rem",
                  marginBottom: 4,
                }}
              >
                TOTAL ESTIMATED BUDGET
              </Typography.Text>
              <Typography.Text
                strong
                style={{ fontSize: "1.5rem", color: "var(--primary)" }}
              >
                {formatCurrency(totalBudget)}
              </Typography.Text>
              {carryoverFromPrevious > 0 && (
                <Typography.Text
                  style={{
                    display: "block",
                    color: "#52c41a",
                    fontSize: "0.82rem",
                    marginTop: 2,
                  }}
                >
                  − {formatCurrency(carryoverFromPrevious)} carryover →
                  required: {formatCurrency(requiredCollection)}
                </Typography.Text>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <Typography.Text
                style={{
                  display: "block",
                  color: "var(--text-muted)",
                  fontSize: "0.78rem",
                  marginBottom: 4,
                }}
              >
                PER PERSON ({flatmateCount} members)
              </Typography.Text>
              <Typography.Text
                strong
                style={{ fontSize: "1.2rem", color: "#7c3aed" }}
              >
                {formatCurrency(perPerson)}
              </Typography.Text>
            </div>
          </Flex>
        </Card>

        {carryoverFromPrevious > 0 && (
          <Alert
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
            message={
              <>
                <strong>{formatCurrency(carryoverFromPrevious)}</strong> carryover
                from last month (collected − actual expenses) will automatically
                reduce the required collection.
              </>
            }
          />
        )}

        {/* Expense category inputs */}
        <Row gutter={[12, 12]}>
          {ADVANCE_CATEGORY_KEYS.map((key) => (
            <Col key={key} xs={12} sm={8} md={6}>
              <Form.Item
                label={
                  <Flex align="center" gap={4}>
                    <Tag
                      color={ADVANCE_CATEGORY_COLORS[key]}
                      style={{ fontSize: 10, padding: "0 6px" }}
                    >
                      {ADVANCE_CATEGORY_LABELS[key]}
                    </Tag>
                  </Flex>
                }
                name={key}
                rules={[
                  {
                    type: "number",
                    min: 0,
                    message: "Amount must be positive",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0"
                  min={0}
                  precision={2}
                  addonBefore="PKR"
                />
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Form>
    </Modal>
  );
}
