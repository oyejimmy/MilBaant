import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
  App,
  Button,
  DatePicker,
  Form,
  Grid,
  Image,
  Input,
  InputNumber,
  Modal,
  Tag,
  Typography,
  Upload,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  EyeOutlined,
  HomeOutlined,
  PictureOutlined,
  UploadOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import styled, { keyframes } from "styled-components";
import { PageStack } from "@/components/Glass/index";
import { PageHeader } from "@/components/PageHeader/index";
import { QueryState } from "@/components/QueryState";
import { useAuth } from "@/hooks/useAuth";
import {
  useContributionPayments,
  useDeleteContributionPayment,
  useCreateContributionPayment,
} from "@/hooks/useContributions";
import { useProfiles } from "@/hooks/useProfiles";
import { formatCurrency } from "@/lib/formatters";
import { uploadPaymentScreenshot } from "@/lib/storage";

const { useBreakpoint } = Grid;

/* ── Animations ─────────────────────────────────────────────────────────── */
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ══════════════════════════════════════════════════════════════════════════
   STATS STRIP  (lives OUTSIDE the card)
══════════════════════════════════════════════════════════════════════════ */

const StatsStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 400px) {
    grid-template-columns: 1fr 1fr;
    gap: 10px;

    /* Make the third tile span full width on very small screens */
    > *:nth-child(3) {
      grid-column: 1 / -1;
    }
  }
`;

const StatTile = styled.div<{ $color: string }>`
  background: var(--card-bg);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-light);
  transition:
    transform 0.15s,
    box-shadow 0.15s;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.8) inset,
      0 6px 20px rgba(0, 0, 0, 0.09);
  }

  @media (max-width: 480px) {
    padding: 12px 13px;
    border-radius: 12px;
    gap: 10px;
  }
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 11px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: ${(p) => p.$color};
  background: ${(p) => p.$color}18;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.6) inset,
    0 2px 6px ${(p) => p.$color}22;

  @media (max-width: 480px) {
    width: 34px;
    height: 34px;
    font-size: 15px;
    border-radius: 9px;
  }
`;

const StatLabel = styled.div`
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 3px;
`;

const StatValue = styled.div`
  font-size: clamp(14px, 3vw, 18px);
  font-weight: 800;
  color: var(--text-strong);
  letter-spacing: -0.3px;
  line-height: 1.1;
`;

const StatSub = styled.div`
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
`;

/* ══════════════════════════════════════════════════════════════════════════
   TOOLBAR
══════════════════════════════════════════════════════════════════════════ */

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const FilterChips = styled.div`
  display: flex;
  gap: 6px;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid
    ${(p) => (p.$active ? "var(--primary)" : "var(--border-default)")};
  background: ${(p) => (p.$active ? "var(--primary-soft)" : "var(--card-bg)")};
  color: ${(p) => (p.$active ? "var(--primary)" : "var(--text-muted)")};
  transition: all 0.15s;
  box-shadow: ${(p) =>
    p.$active
      ? "0 2px 8px rgba(64,150,255,0.2)"
      : "0 1px 3px rgba(0,0,0,0.06)"};

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
`;

/* ══════════════════════════════════════════════════════════════════════════
   DESKTOP — member grid cards
══════════════════════════════════════════════════════════════════════════ */

const MemberGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
`;

const MemberCard = styled.div<{ $paid: boolean }>`
  background: var(--card-bg);
  border-radius: 14px;
  padding: 16px;
  border: 1.5px solid
    ${(p) => (p.$paid ? "rgba(82,196,26,0.35)" : "rgba(229,57,53,0.25)")};
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 2px 8px rgba(0, 0, 0, 0.06);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  animation: ${fadeUp} 0.4s ease forwards;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.8) inset,
      0 6px 18px rgba(0, 0, 0, 0.1);
  }
`;

const MemberAvatar = styled.div<{ $paid: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 10px;
  background: ${(p) =>
    p.$paid
      ? "linear-gradient(135deg, #52c41a, #389e0d)"
      : "linear-gradient(135deg, #ff7875, #e53935)"};
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.3) inset,
    0 3px 8px
      ${(p) => (p.$paid ? "rgba(82,196,26,0.35)" : "rgba(229,57,53,0.3)")};
`;

const MemberName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MemberAmount = styled.div<{ $paid: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => (p.$paid ? "#52c41a" : "var(--text-muted)")};
  margin-bottom: 10px;
`;

const MemberDate = styled.div`
  font-size: 11.5px;
  color: var(--text-muted);
  margin-bottom: 10px;
`;

const CardActions = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

/* ══════════════════════════════════════════════════════════════════════════
   MOBILE — horizontal swipe list
══════════════════════════════════════════════════════════════════════════ */

const MobileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MobileRow = styled.div<{ $paid: boolean }>`
  background: var(--card-bg);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 13px;
  border: 1.5px solid
    ${(p) => (p.$paid ? "rgba(82,196,26,0.3)" : "rgba(229,57,53,0.2)")};
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 2px 6px rgba(0, 0, 0, 0.05);
  animation: ${fadeUp} 0.35s ease forwards;
`;

const MobileAvatar = styled.div<{ $paid: boolean }>`
  width: 46px;
  height: 46px;
  border-radius: 13px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  background: ${(p) =>
    p.$paid
      ? "linear-gradient(135deg, #52c41a, #389e0d)"
      : "linear-gradient(135deg, #ff7875, #e53935)"};
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.3) inset,
    0 3px 8px
      ${(p) => (p.$paid ? "rgba(82,196,26,0.3)" : "rgba(229,57,53,0.25)")};
`;

const MobileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MobileName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MobileAmountRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
`;

const MobileAmt = styled.span<{ $paid: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => (p.$paid ? "#52c41a" : "var(--text-muted)")};
`;

const MobileDate = styled.span`
  font-size: 11px;
  color: var(--text-muted);
`;

const MobileRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
`;

/* ══════════════════════════════════════════════════════════════════════════
   SECTION CARD
══════════════════════════════════════════════════════════════════════════ */

const SectionCard = styled.div`
  background: var(--card-bg);
  border-radius: 14px;
  padding: 20px 20px 24px;
  border: 1px solid var(--border-light);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 2px 8px rgba(0, 0, 0, 0.06);

  @media (min-width: 768px) {
    padding: 24px 28px 28px;
    border-radius: 16px;
  }
`;

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
══════════════════════════════════════════════════════════════════════════ */

type FilterType = "all" | "paid" | "unpaid";

export function ContributionsPage() {
  const { isAdmin, userId } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(
    dayjs().startOf("month"),
  );
  const [filter, setFilter] = useState<FilterType>("all");
  const monthStr = selectedMonth.format("YYYY-MM");

  const paymentsQuery = useContributionPayments(monthStr);
  const profilesQuery = useProfiles();
  const deletePayment = useDeleteContributionPayment();
  const createPayment = useCreateContributionPayment();

  const [previewImage, setPreviewImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const payments = paymentsQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];

  const paymentMap = new Map(payments.map((p) => [p.user_id, p]));
  const summary = profiles
    .filter((profile) => profile.role !== "cook")
    .map((profile) => {
      const payment = paymentMap.get(profile.id);
      return {
        userId: profile.id,
        fullName: profile.full_name,
        initials: profile.full_name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        paid: !!payment,
        payment: payment ?? null,
      };
    });

  const filtered = summary.filter((r) =>
    filter === "all" ? true : filter === "paid" ? r.paid : !r.paid,
  );

  const paidCount = summary.filter((s) => s.paid).length;
  const unpaidCount = summary.length - paidCount;
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleDelete = (id: string) => {
    if (!userId) return;
    Modal.confirm({
      title: "Delete Payment Record",
      content: "Are you sure you want to delete this payment record?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        await deletePayment.mutateAsync({ id, userId });
      },
    });
  };

  const openPayModal = (id: string, name: string) => {
    setSelectedUser({ id, name });
    setPaymentModalOpen(true);
  };

  return (
    <PageStack>
      <PageHeader
        title="Contribution Payments"
        subtitle="Track monthly contribution payments from all flatmates."
        breadcrumbs={[
          { title: "Home", path: "/", icon: <HomeOutlined /> },
          { title: "Contributions" },
        ]}
      />

      <QueryState
        isLoading={paymentsQuery.isLoading || profilesQuery.isLoading}
        error={paymentsQuery.error as Error | null}
      >
        {/* ── Stats strip — OUTSIDE the card ── */}
        <StatsStrip>
          <StatTile $color="var(--success)">
            <StatIcon $color="var(--success)">
              <CheckCircleOutlined />
            </StatIcon>
            <div>
              <StatLabel>Paid</StatLabel>
              <StatValue>
                {paidCount} / {summary.length}
              </StatValue>
              <StatSub>members</StatSub>
            </div>
          </StatTile>

          <StatTile $color="var(--error)">
            <StatIcon $color="var(--error)">
              <CloseCircleOutlined />
            </StatIcon>
            <div>
              <StatLabel>Unpaid</StatLabel>
              <StatValue>{unpaidCount}</StatValue>
              <StatSub>still pending</StatSub>
            </div>
          </StatTile>

          <StatTile $color="var(--primary)">
            <StatIcon $color="var(--primary)">
              <WalletOutlined />
            </StatIcon>
            <div>
              <StatLabel>Collected</StatLabel>
              <StatValue style={{ fontSize: "clamp(12px,2.5vw,16px)" }}>
                {formatCurrency(totalCollected)}
              </StatValue>
              <StatSub>this month</StatSub>
            </div>
          </StatTile>
        </StatsStrip>

        {/* ── Main card ── */}
        <SectionCard>
          <Toolbar>
            <DatePicker
              value={selectedMonth}
              onChange={(date) => setSelectedMonth(date ?? dayjs())}
              picker="month"
              format="MMMM YYYY"
              size="large"
              suffixIcon={<CalendarOutlined />}
              style={{ minWidth: 180 }}
            />

            <FilterChips>
              {(["all", "paid", "unpaid"] as FilterType[]).map((f) => (
                <FilterChip
                  key={f}
                  $active={filter === f}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : f === "paid" ? "✓ Paid" : "✗ Unpaid"}
                </FilterChip>
              ))}
            </FilterChips>
          </Toolbar>

          {/* ── Desktop: grid of member cards ── */}
          {!isMobile && (
            <MemberGrid>
              {filtered.map((record) => (
                <MemberCard key={record.userId} $paid={record.paid}>
                  <MemberAvatar $paid={record.paid}>
                    {record.initials}
                  </MemberAvatar>
                  <MemberName>{record.fullName}</MemberName>

                  <MemberAmount $paid={record.paid}>
                    {record.payment
                      ? formatCurrency(record.payment.amount)
                      : "Not paid"}
                  </MemberAmount>

                  {record.payment && (
                    <MemberDate>
                      {dayjs(record.payment.paid_at).format("DD MMM YYYY")}
                    </MemberDate>
                  )}

                  <CardActions>
                    {/* View screenshot */}
                    {record.payment?.screenshot_url && (
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setPreviewImage(record.payment!.screenshot_url!);
                          setPreviewOpen(true);
                        }}
                      >
                        Proof
                      </Button>
                    )}

                    {/* Delete */}
                    {record.payment &&
                      (isAdmin || record.payment.created_by === userId) && (
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          loading={deletePayment.isPending}
                          onClick={() => handleDelete(record.payment!.id)}
                        >
                          Delete
                        </Button>
                      )}

                    {/* Submit */}
                    {!record.payment &&
                      (record.userId === userId || isAdmin) && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<DollarOutlined />}
                          onClick={() =>
                            openPayModal(record.userId, record.fullName)
                          }
                          style={{ width: "100%" }}
                        >
                          Submit Payment
                        </Button>
                      )}

                    {/* Unpaid — no action available */}
                    {!record.payment &&
                      record.userId !== userId &&
                      !isAdmin && (
                        <Tag color="error" style={{ margin: 0 }}>
                          Unpaid
                        </Tag>
                      )}
                  </CardActions>
                </MemberCard>
              ))}
            </MemberGrid>
          )}

          {/* ── Mobile: compact row list ── */}
          {isMobile && (
            <MobileList>
              {filtered.map((record) => (
                <MobileRow key={record.userId} $paid={record.paid}>
                  <MobileAvatar $paid={record.paid}>
                    {record.initials}
                  </MobileAvatar>

                  <MobileInfo>
                    <MobileName>{record.fullName}</MobileName>
                    <MobileAmountRow>
                      <MobileAmt $paid={record.paid}>
                        {record.payment
                          ? formatCurrency(record.payment.amount)
                          : "Not paid"}
                      </MobileAmt>
                      {record.payment && (
                        <MobileDate>
                          · {dayjs(record.payment.paid_at).format("DD MMM")}
                        </MobileDate>
                      )}
                    </MobileAmountRow>
                  </MobileInfo>

                  <MobileRight>
                    {record.paid ? (
                      <Tag color="success" style={{ margin: 0 }}>
                        Paid
                      </Tag>
                    ) : (
                      <Tag color="error" style={{ margin: 0 }}>
                        Unpaid
                      </Tag>
                    )}

                    {record.payment?.screenshot_url && (
                      <Button
                        size="small"
                        icon={<PictureOutlined />}
                        onClick={() => {
                          setPreviewImage(record.payment!.screenshot_url!);
                          setPreviewOpen(true);
                        }}
                      />
                    )}

                    {record.payment &&
                      (isAdmin || record.payment.created_by === userId) && (
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          loading={deletePayment.isPending}
                          onClick={() => handleDelete(record.payment!.id)}
                        />
                      )}

                    {!record.payment &&
                      (record.userId === userId || isAdmin) && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<DollarOutlined />}
                          onClick={() =>
                            openPayModal(record.userId, record.fullName)
                          }
                        >
                          Pay
                        </Button>
                      )}
                  </MobileRight>
                </MobileRow>
              ))}
            </MobileList>
          )}
        </SectionCard>
      </QueryState>

      {/* Image preview */}
      <Modal
        centered
        open={previewOpen}
        title="Payment Screenshot"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={700}
      >
        <Image
          alt="Payment proof"
          style={{ width: "100%" }}
          src={previewImage}
          preview={false}
        />
      </Modal>

      {/* Submit payment modal */}
      {paymentModalOpen && selectedUser && userId && (
        <PaymentSubmitModal
          open={paymentModalOpen}
          userId={selectedUser.id}
          userName={selectedUser.name}
          month={monthStr}
          currentUserId={userId}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedUser(null);
          }}
          onSubmit={createPayment}
        />
      )}
    </PageStack>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAYMENT SUBMIT MODAL
══════════════════════════════════════════════════════════════════════════ */

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 0;
`;

const ModalIconBadge = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #52c41a, #389e0d);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.3) inset,
    0 4px 12px rgba(82, 196, 26, 0.35);
  .anticon {
    color: #fff;
    font-size: 18px;
  }
`;

const ModalBody = styled.div`
  padding: 16px 24px 0;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  .anticon {
    color: var(--primary);
    font-size: 13px;
  }
`;

const ModalDivider = styled.div`
  height: 1px;
  background: var(--border-light);
  margin: 14px 0;
`;

const MonthBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(82, 196, 26, 0.1);
  border: 1px solid rgba(82, 196, 26, 0.25);
  color: #52c41a;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const UploadZone = styled.div<{ $hasFile: boolean }>`
  border: 1.5px dashed
    ${(p) => (p.$hasFile ? "#52c41a" : "var(--border-default)")};
  border-radius: 12px;
  padding: 14px 16px;
  background: ${(p) =>
    p.$hasFile ? "rgba(82,196,26,0.05)" : "var(--bg-elevated)"};
  cursor: pointer;
  transition: all 0.18s;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: var(--primary);
    background: var(--primary-soft);
  }
`;

const UploadIconBox = styled.div<{ $hasFile: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${(p) =>
    p.$hasFile ? "rgba(82,196,26,0.12)" : "rgba(64,150,255,0.10)"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  .anticon {
    font-size: 16px;
    color: ${(p) => (p.$hasFile ? "#52c41a" : "var(--primary)")};
  }
`;

interface PaymentSubmitModalProps {
  open: boolean;
  userId: string;
  userName: string;
  month: string;
  currentUserId: string;
  onClose: () => void;
  onSubmit: ReturnType<typeof useCreateContributionPayment>;
}

function PaymentSubmitModal({
  open,
  userId,
  userName,
  month,
  currentUserId,
  onClose,
  onSubmit,
}: PaymentSubmitModalProps) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setUploading(true);

      let screenshotUrl: string | null = null;
      if (fileList.length > 0 && fileList[0].originFileObj) {
        screenshotUrl = await uploadPaymentScreenshot(
          userId,
          fileList[0].originFileObj,
        );
      }

      await onSubmit.mutateAsync({
        userId,
        month,
        amount: values.amount,
        paidAt: values.paidAt.format("YYYY-MM-DD"),
        screenshotUrl,
        note: values.note?.trim() || undefined,
        createdBy: currentUserId,
      });

      message.success("Payment submitted successfully!");
      form.resetFields();
      setFileList([]);
      onClose();
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Failed to submit payment",
      );
    } finally {
      setUploading(false);
    }
  };

  const hasFile = fileList.length > 0;

  return (
    <Modal
      centered
      open={open}
      title={null}
      okText="Submit Payment"
      confirmLoading={uploading || onSubmit.isPending}
      onCancel={onClose}
      onOk={() => void handleSubmit()}
      width="min(500px, 95vw)"
      style={{ top: 24 }}
      styles={{
        body: {
          padding: 0,
          maxHeight: "calc(100vh - 140px)",
          overflowY: "auto",
        },
        footer: {
          padding: "12px 24px 20px",
          borderTop: "1px solid var(--border-light)",
          margin: 0,
        },
      }}
      okButtonProps={{ size: "large" }}
      cancelButtonProps={{ size: "large" }}
    >
      <ModalHeader>
        <ModalIconBadge>
          <DollarOutlined />
        </ModalIconBadge>
        <div>
          <Typography.Title
            level={5}
            style={{ margin: 0, color: "var(--text-strong)", lineHeight: 1.3 }}
          >
            Submit Payment
          </Typography.Title>
          <Typography.Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {userName}
          </Typography.Text>
        </div>
      </ModalHeader>

      <ModalBody>
        <MonthBadge>
          <CalendarOutlined style={{ fontSize: 12 }} />
          {dayjs(month, "YYYY-MM").format("MMMM YYYY")}
        </MonthBadge>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ paidAt: dayjs() }}
        >
          <SectionLabel>
            <DollarOutlined />
            <Typography.Text
              strong
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Payment Details
            </Typography.Text>
          </SectionLabel>

          <TwoCol>
            <Form.Item
              label="Amount (PKR)"
              name="amount"
              rules={[{ required: true, message: "Please enter the amount" }]}
              style={{ marginBottom: 12 }}
            >
              <InputNumber
                min={1}
                precision={2}
                style={{ width: "100%" }}
                placeholder="e.g. 5000"
                prefix={
                  <DollarOutlined style={{ color: "var(--text-muted)" }} />
                }
              />
            </Form.Item>

            <Form.Item
              label="Payment Date"
              name="paidAt"
              rules={[
                { required: true, message: "Please select payment date" },
              ]}
              style={{ marginBottom: 12 }}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                suffixIcon={
                  <CalendarOutlined style={{ color: "var(--text-muted)" }} />
                }
              />
            </Form.Item>
          </TwoCol>

          <ModalDivider />

          <SectionLabel>
            <PictureOutlined />
            <Typography.Text
              strong
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Screenshot
              <Typography.Text
                style={{ fontSize: 11, fontWeight: 400, marginLeft: 4 }}
              >
                (optional)
              </Typography.Text>
            </Typography.Text>
          </SectionLabel>

          <Form.Item name="screenshot" style={{ marginBottom: 12 }}>
            <Upload
              listType="text"
              fileList={fileList}
              showUploadList={false}
              beforeUpload={(file) => {
                if (!file.type.startsWith("image/")) {
                  message.error("Only image files allowed!");
                  return false;
                }
                if (file.size / 1024 / 1024 > 5) {
                  message.error("Image must be under 5MB!");
                  return false;
                }
                setFileList([file]);
                return false;
              }}
              onRemove={() => setFileList([])}
              maxCount={1}
            >
              <UploadZone $hasFile={hasFile}>
                <UploadIconBox $hasFile={hasFile}>
                  {hasFile ? <CheckCircleOutlined /> : <UploadOutlined />}
                </UploadIconBox>
                <div>
                  <Typography.Text
                    strong
                    style={{
                      fontSize: 13,
                      color: "var(--text-strong)",
                      display: "block",
                    }}
                  >
                    {hasFile ? fileList[0].name : "Upload screenshot"}
                  </Typography.Text>
                  <Typography.Text
                    style={{ fontSize: 12, color: "var(--text-muted)" }}
                  >
                    {hasFile
                      ? `${((fileList[0].size ?? 0) / 1024).toFixed(0)} KB — click to change`
                      : "PNG, JPG, WEBP — click to browse"}
                  </Typography.Text>
                </div>
                {hasFile && (
                  <Button
                    size="small"
                    danger
                    type="text"
                    icon={<CloseCircleOutlined />}
                    style={{ marginLeft: "auto", flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileList([]);
                    }}
                  />
                )}
              </UploadZone>
            </Upload>
          </Form.Item>

          <ModalDivider />

          <Form.Item
            label="Note (optional)"
            name="note"
            style={{ marginBottom: 16 }}
          >
            <Input.TextArea
              rows={2}
              placeholder="e.g. Paid via Easypaisa"
              maxLength={200}
              style={{ resize: "none" }}
            />
          </Form.Item>
        </Form>
      </ModalBody>
    </Modal>
  );
}
