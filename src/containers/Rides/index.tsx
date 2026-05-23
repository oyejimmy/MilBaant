import { useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
  Alert,
  Button,
  DatePicker,
  Flex,
  Grid,
  Space,
  Typography,
  message,
} from "antd";
import {
  AuditOutlined,
  CarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/PageHeader/index";
import { QueryState } from "@/components/QueryState";
import {
  PageStack,
  SectionBlock,
  ResponsiveGrid,
} from "@/components/Glass/index";
import { SummaryStat } from "@/components/SummaryStat";
import { useAuth } from "@/hooks/useAuth";
import { useRides, useCreateRide, useDeleteRide } from "@/hooks/useRides";
import { useProfiles } from "@/hooks/useProfiles";
import { formatCurrency, formatMonthYear } from "@/lib/formatters";
import type { CreateRideInput } from "@/lib/types";
import { buildRideDebts } from "./components/helpers";
import { RidesTable } from "./components/RidesTable";
import { MobileRidesList } from "./components/MobileRidesList";
import { RiderSummaryTable } from "./components/RiderSummaryTable";
import { MobileRiderSummaryList } from "./components/MobileRiderSummaryList";
import { DebtsList } from "./components/DebtsList";
import { AddRideModal } from "./components/AddRideModal";
import { RideDetailModal } from "./components/RideDetailModal";

const { useBreakpoint } = Grid;

export function RidesPage() {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(
    dayjs().startOf("month"),
  );
  const [addOpen, setAddOpen] = useState(false);
  const [viewRide, setViewRide] = useState<any>(null);

  const { userId } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const ridesQuery = useRides(selectedMonth);
  const profilesQuery = useProfiles();
  const createRide = useCreateRide();
  const deleteRide = useDeleteRide();

  const profiles = useMemo(
    () => (profilesQuery.data ?? []).filter((p) => p.role !== "cook"),
    [profilesQuery.data],
  );
  const rides = useMemo(() => ridesQuery.data ?? [], [ridesQuery.data]);

  const totalSpend = rides.reduce((s, r) => s + r.amount, 0);
  const totalRides = rides.length;
  const uniqueRiders = new Set(
    rides.flatMap((r) => r.ride_riders.map((rr) => rr.user_id)),
  ).size;
  const debts = useMemo(() => buildRideDebts(rides), [rides]);

  const riderSummary = useMemo(() => {
    const map = new Map<
      string,
      { name: string; totalShare: number; rideCount: number }
    >();
    for (const ride of rides) {
      const share =
        ride.ride_riders.length > 0 ? ride.amount / ride.ride_riders.length : 0;
      for (const rr of ride.ride_riders) {
        const name = rr.profile?.full_name ?? rr.user_id;
        const existing = map.get(rr.user_id) ?? {
          name,
          totalShare: 0,
          rideCount: 0,
        };
        map.set(rr.user_id, {
          name,
          totalShare: existing.totalShare + share,
          rideCount: existing.rideCount + 1,
        });
      }
    }
    return [...map.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.totalShare - a.totalShare);
  }, [rides]);

  const handleCreate = async (input: CreateRideInput) => {
    try {
      await createRide.mutateAsync(input);
      message.success("Ride added.");
      setAddOpen(false);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Unable to save ride.",
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRide.mutateAsync({ id, userId: userId ?? "" });
      message.success("Ride deleted.");
      if (viewRide?.id === id) setViewRide(null);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Unable to delete.");
    }
  };

  const isLoading = ridesQuery.isLoading || profilesQuery.isLoading;
  const error =
    (ridesQuery.error as Error | null) ?? (profilesQuery.error as Error | null);

  return (
    <PageStack>
      <PageHeader
        title="Rides"
        subtitle={`Shared taxi rides for ${formatMonthYear(selectedMonth)} — Yango, InDriver, and more. One person pays, everyone splits.`}
        breadcrumbs={[{ title: "Home", path: "/" }, { title: "Rides" }]}
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
                onClick={() => setAddOpen(true)}
              >
                Add Ride
              </Button>
            )}
          </Space>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        <ResponsiveGrid>
          <SummaryStat
            title="Total Spend"
            value={formatCurrency(totalSpend)}
            subtitle="All rides this month."
            icon={<CarOutlined />}
            color="var(--primary)"
          />
          <SummaryStat
            title="Total Rides"
            value={totalRides}
            subtitle="Number of shared rides."
            icon={<AuditOutlined />}
            color="#7c3aed"
          />
          <SummaryStat
            title="Unique Riders"
            value={uniqueRiders}
            subtitle="Distinct flatmates who rode."
            icon={<TeamOutlined />}
            color="#059669"
          />
        </ResponsiveGrid>

        <SectionBlock>
          <Typography.Title level={5} style={{ margin: "0 0 10px" }}>
            All Rides
          </Typography.Title>
          {isMobile ? (
            <MobileRidesList
              rides={rides}
              userId={userId}
              onView={setViewRide}
              onDelete={handleDelete}
            />
          ) : (
            <RidesTable
              rides={rides}
              userId={userId}
              onView={setViewRide}
              onDelete={handleDelete}
            />
          )}
        </SectionBlock>

        <SectionBlock>
          <Typography.Title level={5} style={{ margin: "0 0 10px" }}>
            Monthly Share per Rider
          </Typography.Title>
          {isMobile ? (
            <MobileRiderSummaryList summaries={riderSummary} />
          ) : (
            <RiderSummaryTable summaries={riderSummary} />
          )}
        </SectionBlock>

        <SectionBlock>
          <Flex vertical gap={4} style={{ marginBottom: 14 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Who Owes Whom
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: "0.82rem" }}>
              Net debts from ride splits. Green = owed to you · Red = you owe.
            </Typography.Text>
          </Flex>

          {debts.length === 0 ? (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="All settled up — no outstanding ride debts this month."
            />
          ) : (
            <DebtsList debts={debts} userId={userId} />
          )}
        </SectionBlock>
      </QueryState>

      <AddRideModal
        open={addOpen}
        profiles={profiles}
        userId={userId ?? ""}
        submitting={createRide.isPending}
        onClose={() => setAddOpen(false)}
        onSubmit={handleCreate}
      />
      <RideDetailModal
        ride={viewRide}
        open={!!viewRide}
        userId={userId}
        deleting={deleteRide.isPending}
        onClose={() => setViewRide(null)}
        onDelete={handleDelete}
      />
    </PageStack>
  );
}
