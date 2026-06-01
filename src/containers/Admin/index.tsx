import { useMemo, useState } from "react";
import {
  App,
  Button,
  Flex,
  Grid,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Empty,
  Skeleton,
  Result,
} from "antd";
import {
  SearchOutlined,
  TeamOutlined,
  DownloadOutlined,
  UserAddOutlined,
  CrownOutlined,
  CoffeeOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/PageHeader/index";
import { QueryState } from "@/components/QueryState";
import {
  PageStack,
  SectionBlock,
  ResponsiveGrid,
} from "@/components/Glass/index";
import { SummaryStat } from "@/components/SummaryStat";
import { ROLE_OPTIONS } from "@/lib/constants";
import { exportUsersToExcel } from "@/lib/export";
import { useAuth } from "@/hooks/useAuth";
import {
  useAdminCreateUser,
  useAdminDeleteUser,
  useProfiles,
  useUpdateProfilePermissions,
} from "@/hooks/useProfiles";
import {
  useMemberCountSetting,
  useUpsertMemberCount,
} from "@/hooks/useSettings";
import type { Profile, Role } from "@/lib/types";
import { UserTable } from "./components/UserTable";
import { MobileUserCard } from "./components/MobileUserCard";
import { BillDistribution } from "./components/BillDistribution";
import { DeleteUserModal } from "./components/DeleteUserModal";
import { RemoveUserModal } from "./components/RemoveUserModal";
import { AddUserModal } from "./components/AddUserModal";
import { EditUserModal } from "./components/EditUserModal";
import { ROLE_META } from "./components/constants";

const { useBreakpoint } = Grid;

export function AdminPage() {
  const { isAdmin, userId, profileLoading } = useAuth();
  const { message } = App.useApp();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "removed"
  >("all");
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Profile | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [memberCountDraft, setMemberCountDraft] = useState<number | null>(null);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const profilesQuery = useProfiles();
  const memberCountQuery = useMemberCountSetting();
  const updateProfile = useUpdateProfilePermissions();
  const createUser = useAdminCreateUser();
  const deleteUser = useAdminDeleteUser();
  const saveMemberCount = useUpsertMemberCount();

  const allProfiles = useMemo(
    () => profilesQuery.data ?? [],
    [profilesQuery.data],
  );
  const memberCount = memberCountQuery.data ?? 6;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allProfiles.filter((p) => {
      const matchSearch = !q || p.full_name.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || p.role === roleFilter;
      const isRemoved = p.is_active === false;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !isRemoved) ||
        (statusFilter === "removed" && isRemoved);
      return matchSearch && matchRole && matchStatus;
    });
  }, [allProfiles, search, roleFilter, statusFilter]);

  const adminCount = allProfiles.filter((p) => p.role === "admin").length;
  const cookCount = allProfiles.filter((p) => p.role === "cook").length;
  const removedCount = allProfiles.filter((p) => p.is_active === false).length;

  async function handleRoleChange(profile: Profile, role: Role) {
    try {
      await updateProfile.mutateAsync({ userId: profile.id, role });
      message.success(
        `Role updated to ${ROLE_META[role].label} for ${profile.full_name}.`,
      );
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Unable to update role.",
      );
    }
  }

  async function handlePermissionChange(
    profile: Profile,
    canAddExpenses: boolean,
  ) {
    try {
      await updateProfile.mutateAsync({ userId: profile.id, canAddExpenses });
      message.success(`Permission updated for ${profile.full_name}.`);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Unable to update permission.",
      );
    }
  }

  async function handleNameChange(profile: Profile, fullName: string) {
    try {
      await updateProfile.mutateAsync({ userId: profile.id, fullName });
      message.success("Name updated.");
      setEditUser(null);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Unable to update name.",
      );
    }
  }

  async function handleDeleteUser(profile: Profile) {
    try {
      await updateProfile.mutateAsync({ userId: profile.id, isActive: false });
      message.success(`${profile.full_name} has been deactivated.`);
      setDeleteTarget(null);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Unable to deactivate user.",
      );
    }
  }

  async function handleRestoreUser(profile: Profile) {
    try {
      await updateProfile.mutateAsync({ userId: profile.id, isActive: true });
      message.success(`${profile.full_name} has been reactivated.`);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Unable to reactivate user.",
      );
    }
  }

  async function handlePermanentDelete(profile: Profile) {
    try {
      await deleteUser.mutateAsync(profile.id);
      message.success(`${profile.full_name} has been permanently removed.`);
      setRemoveTarget(null);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Unable to remove user.",
      );
    }
  }

  async function handleSaveMemberCount() {
    const next = memberCountDraft ?? memberCount;
    if (next < 1) {
      message.error("Must be at least 1.");
      return;
    }
    try {
      await saveMemberCount.mutateAsync(next);
      message.success("Member count updated.");
      setMemberCountDraft(null);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Unable to update.");
    }
  }

  if (profileLoading) {
    return (
      <PageStack>
        <SectionBlock>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} active paragraph={{ rows: 1 }} />
          ))}
        </SectionBlock>
      </PageStack>
    );
  }

  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="Admin access only"
        subTitle="This section is restricted to flat admins."
      />
    );
  }

  const isLoading =
    profilesQuery.isLoading ||
    memberCountQuery.isLoading;
  const error =
    (profilesQuery.error as Error | null) ??
    (memberCountQuery.error as Error | null);

  return (
    <PageStack>
      <PageHeader
        title="Admin Panel"
        subtitle="Manage flatmates, roles, permissions, and flat settings."
        breadcrumbs={[{ title: "Home", path: "/" }, { title: "Admin Panel" }]}
        actions={
          <Space wrap>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => void exportUsersToExcel(allProfiles)}
            >
              Export
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setAddUserOpen(true)}
            >
              Add User
            </Button>
          </Space>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        <ResponsiveGrid>
          <SummaryStat
            title="Total Users"
            value={allProfiles.length}
            subtitle="All flatmates"
            icon={<TeamOutlined />}
            color="var(--primary)"
          />
          <SummaryStat
            title="Admins"
            value={adminCount}
            subtitle="Admin role"
            icon={<CrownOutlined />}
            color="#cf1322"
          />
          <SummaryStat
            title="Cooks"
            value={cookCount}
            subtitle="Cook role"
            icon={<CoffeeOutlined />}
            color="#d46b08"
          />
          <SummaryStat
            title="Deactivated"
            value={removedCount}
            subtitle="Inactive"
            icon={<StopOutlined />}
            color="#8c8c8c"
          />
        </ResponsiveGrid>

        <SectionBlock>
          <Flex
            align="center"
            justify="space-between"
            wrap
            gap={10}
            style={{ marginBottom: 14 }}
          >
            <Flex align="center" gap={6}>
              <TeamOutlined style={{ color: "var(--primary)", fontSize: 15 }} />
              <Typography.Title level={5} style={{ margin: 0 }}>
                User Management
              </Typography.Title>
              <Tag>{filtered.length}</Tag>
            </Flex>
            <Flex align="center" gap={8} wrap>
              <Input
                prefix={
                  <SearchOutlined
                    style={{ color: "var(--text-muted)", fontSize: 12 }}
                  />
                }
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
                style={{ width: 200 }}
              />
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                style={{ width: 120 }}
                options={[
                  { label: "All Roles", value: "all" },
                  ...ROLE_OPTIONS,
                ]}
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 130 }}
                options={[
                  { label: "All Status", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Deactivated", value: "removed" },
                ]}
              />
            </Flex>
          </Flex>

          {profilesQuery.isLoading ? (
            <Flex vertical gap={8}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} active avatar paragraph={{ rows: 2 }} />
              ))}
            </Flex>
          ) : filtered.length === 0 ? (
            <Empty description="No users match your filters." />
          ) : isMobile ? (
            <Flex vertical gap={10}>
              {filtered.map((p) => (
                <MobileUserCard
                  key={p.id}
                  profile={p}
                  userId={userId ?? undefined}
                  onEdit={setEditUser}
                  onRoleChange={handleRoleChange}
                  onPermissionChange={handlePermissionChange}
                  onDeactivate={setDeleteTarget}
                  onRestore={handleRestoreUser}
                  onPermanentDelete={setRemoveTarget}
                />
              ))}
            </Flex>
          ) : (
            <UserTable
              profiles={filtered}
              userId={userId ?? undefined}
              onEdit={setEditUser}
              onRoleChange={handleRoleChange}
              onPermissionChange={handlePermissionChange}
              onDeactivate={setDeleteTarget}
              onRestore={handleRestoreUser}
              onPermanentDelete={setRemoveTarget}
            />
          )}
        </SectionBlock>

        <BillDistribution
          profiles={allProfiles}
          memberCount={memberCount}
          memberCountDraft={memberCountDraft}
          isPending={saveMemberCount.isPending}
          onDraftChange={setMemberCountDraft}
          onSave={handleSaveMemberCount}
        />
      </QueryState>

      <DeleteUserModal
        profile={deleteTarget}
        open={!!deleteTarget}
        submitting={updateProfile.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDeleteUser(deleteTarget)}
      />

      <RemoveUserModal
        profile={removeTarget}
        open={!!removeTarget}
        submitting={deleteUser.isPending}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && handlePermanentDelete(removeTarget)}
      />

      <AddUserModal
        open={addUserOpen}
        submitting={createUser.isPending}
        onClose={() => setAddUserOpen(false)}
        onSubmit={async (values) => {
          try {
            await createUser.mutateAsync(values);
            message.success(`${values.fullName} added successfully.`);
            setAddUserOpen(false);
          } catch (err) {
            message.error(
              err instanceof Error ? err.message : "Unable to create user.",
            );
          }
        }}
      />

      <EditUserModal
        profile={editUser}
        open={!!editUser}
        submitting={updateProfile.isPending}
        onClose={() => setEditUser(null)}
        onSave={handleNameChange}
        onRoleChange={handleRoleChange}
        onPermissionChange={handlePermissionChange}
      />
    </PageStack>
  );
}
