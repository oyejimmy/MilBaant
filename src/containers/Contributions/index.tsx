import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { Button, DatePicker, Flex, Grid, Modal, App, Card } from "antd";
import { CalendarOutlined, HomeOutlined } from "@ant-design/icons";
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
import { StatsCards } from "./components/StatsCards";
import { MemberCard } from "./components/MemberCard";
import { MobileMemberRow } from "./components/MobileMemberRow";
import { PaymentSubmitModal } from "./components/PaymentSubmitModal";
import { ImagePreviewModal } from "./components/ImagePreviewModal";
import type { FilterType } from "./types";

const { useBreakpoint } = Grid;

export function ContributionsPage() {
  const { isAdmin, userId } = useAuth();
  const { message } = App.useApp();
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
        message.success("Payment deleted successfully");
      },
    });
  };

  const openPayModal = (id: string, name: string) => {
    setSelectedUser({ id, name });
    setPaymentModalOpen(true);
  };

  const isLoading = paymentsQuery.isLoading || profilesQuery.isLoading;
  const error = paymentsQuery.error as Error | null;

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

      <QueryState isLoading={isLoading} error={error}>
        <StatsCards
          paidCount={paidCount}
          totalMembers={summary.length}
          unpaidCount={unpaidCount}
          totalCollected={totalCollected}
        />

        <Card style={{ marginTop: 20 }}>
          <Flex
            justify="space-between"
            align="center"
            wrap
            gap={12}
            style={{ marginBottom: 20 }}
          >
            <DatePicker
              value={selectedMonth}
              onChange={(date) => setSelectedMonth(date ?? dayjs())}
              picker="month"
              format="MMMM YYYY"
              size="large"
              suffixIcon={<CalendarOutlined />}
              style={{ minWidth: 180 }}
            />

            <Flex gap={6}>
              {(["all", "paid", "unpaid"] as FilterType[]).map((f) => (
                <Button
                  key={f}
                  type={filter === f ? "primary" : "default"}
                  onClick={() => setFilter(f)}
                  style={{ borderRadius: 20 }}
                >
                  {f === "all" ? "All" : f === "paid" ? "✓ Paid" : "✗ Unpaid"}
                </Button>
              ))}
            </Flex>
          </Flex>

          {!isMobile && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              {filtered.map((record) => (
                <MemberCard
                  key={record.userId}
                  userId={record.userId}
                  fullName={record.fullName}
                  initials={record.initials}
                  paid={record.paid}
                  payment={record.payment}
                  isAdmin={isAdmin}
                  currentUserId={userId ?? undefined}
                  isPending={deletePayment.isPending}
                  onViewProof={(url) => {
                    setPreviewImage(url);
                    setPreviewOpen(true);
                  }}
                  onDelete={handleDelete}
                  onPay={openPayModal}
                />
              ))}
            </div>
          )}

          {isMobile && (
            <Flex vertical gap={10}>
              {filtered.map((record) => (
                <MobileMemberRow
                  key={record.userId}
                  userId={record.userId}
                  fullName={record.fullName}
                  initials={record.initials}
                  paid={record.paid}
                  payment={record.payment}
                  isAdmin={isAdmin}
                  currentUserId={userId ?? undefined}
                  isPending={deletePayment.isPending}
                  onViewProof={(url) => {
                    setPreviewImage(url);
                    setPreviewOpen(true);
                  }}
                  onDelete={handleDelete}
                  onPay={openPayModal}
                />
              ))}
            </Flex>
          )}
        </Card>
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
