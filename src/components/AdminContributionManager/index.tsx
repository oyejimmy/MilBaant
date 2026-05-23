import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { Button, DatePicker, Grid, Modal, Tag } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  EyeOutlined,
  HomeOutlined,
  PictureOutlined,
  WalletOutlined,
} from "@ant-design/icons";
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
import {
  StatsStrip,
  StatTile,
  StatIcon,
  StatLabel,
  StatValue,
  StatSub,
  Toolbar,
  FilterChips,
  FilterChip,
  MemberGrid,
  MemberCard,
  MemberAvatar,
  MemberName,
  MemberAmount,
  MemberDate,
  CardActions,
  MobileList,
  MobileRow,
  MobileAvatar,
  MobileInfo,
  MobileName,
  MobileAmountRow,
  MobileAmt,
  MobileDate,
  MobileRight,
  SectionCard,
} from "./components/styles";
import { PaymentSubmitModal } from "./components/PaymentSubmitModal";
import { ImagePreviewModal } from "./components/ImagePreviewModal";

const { useBreakpoint } = Grid;

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

      <ImagePreviewModal
        open={previewOpen}
        imageUrl={previewImage}
        onClose={() => setPreviewOpen(false)}
      />

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
