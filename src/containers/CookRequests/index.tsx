import { useState } from "react";
import {
  App,
  Badge,
  Button,
  Flex,
  Grid,
  Select,
  Space,
  Typography,
  Empty,
  Row,
  Col,
} from "antd";
import {
  InboxOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/PageHeader/index";
import { QueryState } from "@/components/QueryState";
import { PageStack, SectionBlock } from "@/components/Glass/index";
import { SummaryStat } from "@/components/SummaryStat";
import { useAuth } from "@/hooks/useAuth";
import {
  useCookRequests,
  useCreateCookRequest,
  useDeleteCookRequest,
  useCookReply,
} from "@/hooks/useCookRequests";
import type { CookRequestStatus } from "@/lib/types";
import { AddRequestModal } from "./components/AddRequestModal";
import { CookReplyModal } from "./components/CookReplyModal";
import { ViewRequestModal } from "./components/ViewRequestModal";
import { RequestsTable } from "./components/RequestsTable";
import { MobileRequestCard } from "./components/MobileRequestCard";
import { STATUS_OPTIONS } from "./types";

const { useBreakpoint } = Grid;

export function CookRequestsPage() {
  const { userId, isCook, isAdmin } = useAuth();
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [addOpen, setAddOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<any>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<CookRequestStatus | "all">(
    "all",
  );

  const requestsQuery = useCookRequests();
  const createRequest = useCreateCookRequest();
  const cookReply = useCookReply();
  const deleteRequest = useDeleteCookRequest();

  const allRequests = requestsQuery.data ?? [];
  const filtered =
    filterStatus === "all"
      ? allRequests
      : allRequests.filter((r) => r.status === filterStatus);

  const pendingCount = allRequests.filter((r) => r.status === "pending").length;
  const acknowledgedCount = allRequests.filter(
    (r) => r.status === "acknowledged",
  ).length;
  const doneCount = allRequests.filter((r) => r.status === "done").length;
  const rejectedCount = allRequests.filter(
    (r) => r.status === "rejected",
  ).length;

  const handleCreate = async (values: any) => {
    if (!userId) return;
    try {
      await createRequest.mutateAsync({ ...values, requestedBy: userId });
      message.success("Request submitted to cook.");
      setAddOpen(false);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Unable to submit.");
    }
  };

  const handleReply = async (
    req: any,
    status: CookRequestStatus,
    comment: string,
  ) => {
    if (!userId) return;
    try {
      await cookReply.mutateAsync({
        id: req.id,
        status,
        cookComment: comment,
        userId,
      });
      message.success(`Reply saved — marked as ${status}.`);
      setReplyTarget(null);
      if (viewItem?.id === req.id) setViewItem(null);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Unable to save reply.",
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    try {
      await deleteRequest.mutateAsync({ id, userId });
      message.success("Request removed.");
      if (viewItem?.id === id) setViewItem(null);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Unable to delete.");
    }
  };

  const pageSubtitle = isCook
    ? "View requests from flatmates and reply with a status and comment."
    : "Request items or groceries from the cook. The cook will reply with a status.";

  const isLoading = requestsQuery.isLoading;
  const error = requestsQuery.error as Error | null;

  return (
    <PageStack>
      <PageHeader
        title="Cook Requests"
        subtitle={pageSubtitle}
        breadcrumbs={[{ title: "Home", path: "/" }, { title: "Cook Requests" }]}
        actions={
          <Space wrap>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 140 }}
              options={[
                { label: "All Requests", value: "all" },
                ...STATUS_OPTIONS,
              ]}
            />
            {!isCook && !!userId && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddOpen(true)}
              >
                New Request
              </Button>
            )}
          </Space>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        <Row gutter={[10, 10]}>
          <Col xs={12} sm={6}>
            <SummaryStat
              title="Pending"
              value={pendingCount}
              subtitle="Awaiting reply"
              icon={<ClockCircleOutlined />}
              color="#f9a825"
            />
          </Col>
          <Col xs={12} sm={6}>
            <SummaryStat
              title="Acknowledged"
              value={acknowledgedCount}
              subtitle="Cook is aware"
              icon={<SyncOutlined />}
              color="#1890ff"
            />
          </Col>
          <Col xs={12} sm={6}>
            <SummaryStat
              title="Done"
              value={doneCount}
              subtitle="Completed"
              icon={<CheckCircleOutlined />}
              color="#52c41a"
            />
          </Col>
          <Col xs={12} sm={6}>
            <SummaryStat
              title="Rejected"
              value={rejectedCount}
              subtitle="Not fulfilled"
              icon={<CloseCircleOutlined />}
              color="#ff4d4f"
            />
          </Col>
        </Row>

        <SectionBlock>
          <Flex
            align="center"
            justify="space-between"
            style={{ marginBottom: 14 }}
            wrap
            gap={8}
          >
            <Flex align="center" gap={8}>
              <InboxOutlined
                style={{ color: "var(--primary)", fontSize: 15 }}
              />
              <Typography.Title level={5} style={{ margin: 0 }}>
                {isCook ? "Requests from Flatmates" : "All Requests"}
              </Typography.Title>
              <Badge
                count={pendingCount}
                style={{ background: "#f9a825" }}
                showZero={false}
              />
            </Flex>
            {isCook && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Click Reply to set status and leave a comment
              </Typography.Text>
            )}
          </Flex>

          {filtered.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                filterStatus === "all"
                  ? isCook
                    ? "No requests from flatmates yet."
                    : "No requests yet. Be the first!"
                  : `No ${filterStatus} requests.`
              }
            />
          ) : isMobile ? (
            <Flex vertical gap={8}>
              {filtered.map((r) => (
                <MobileRequestCard
                  key={r.id}
                  request={r}
                  userId={userId ?? undefined}
                  isCook={isCook}
                  isAdmin={isAdmin}
                  onView={setViewItem}
                  onReply={setReplyTarget}
                  onDelete={handleDelete}
                />
              ))}
            </Flex>
          ) : (
            <RequestsTable
              requests={filtered}
              userId={userId ?? undefined}
              isCook={isCook}
              isAdmin={isAdmin}
              onView={setViewItem}
              onReply={setReplyTarget}
              onDelete={handleDelete}
            />
          )}
        </SectionBlock>
      </QueryState>

      <AddRequestModal
        open={addOpen}
        submitting={createRequest.isPending}
        onClose={() => setAddOpen(false)}
        onSubmit={handleCreate}
      />
      {replyTarget && (
        <CookReplyModal
          request={replyTarget}
          open={!!replyTarget}
          submitting={cookReply.isPending}
          onClose={() => setReplyTarget(null)}
          onSubmit={(status, comment) =>
            handleReply(replyTarget, status as CookRequestStatus, comment)
          }
        />
      )}
      {viewItem && (
        <ViewRequestModal
          request={viewItem}
          open={!!viewItem}
          isCook={isCook}
          canDelete={(viewItem.requested_by === userId || isAdmin) && !isCook}
          deleting={deleteRequest.isPending}
          onClose={() => setViewItem(null)}
          onReply={() => {
            setViewItem(null);
            setReplyTarget(viewItem);
          }}
          onDelete={() => handleDelete(viewItem.id)}
        />
      )}
    </PageStack>
  );
}
