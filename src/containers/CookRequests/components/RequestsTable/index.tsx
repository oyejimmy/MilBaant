import {
  Table,
  Tag,
  Typography,
  Button,
  Tooltip,
  Popconfirm,
  Flex,
} from "antd";
import {
  EyeOutlined,
  MessageOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { CookRequest } from "@/lib/types";
import { StatusBadge } from "../StatusBadge";
import { formatRelative } from "../helpers";

interface RequestsTableProps {
  requests: CookRequest[];
  userId?: string;
  isCook: boolean;
  isAdmin: boolean;
  onView: (request: CookRequest) => void;
  onReply: (request: CookRequest) => void;
  onDelete: (id: string) => void;
}

export function RequestsTable({
  requests,
  userId,
  isCook,
  isAdmin,
  onView,
  onReply,
  onDelete,
}: RequestsTableProps) {
  const columns: ColumnsType<CookRequest> = [
    {
      title: "Item",
      key: "item",
      render: (_: unknown, r: CookRequest) => (
        <div>
          <Typography.Text strong style={{ display: "block" }}>
            {r.item}
          </Typography.Text>
          {r.quantity && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Qty: {r.quantity}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: "Requested By",
      key: "requester",
      width: 130,
      render: (_: unknown, r: CookRequest) => (
        <Tag color="blue" style={{ fontSize: 11 }}>
          {r.requester?.full_name ?? "—"}
        </Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 130,
      render: (_: unknown, r: CookRequest) => <StatusBadge status={r.status} />,
    },
    {
      title: "Cook's Reply",
      key: "cook_comment",
      ellipsis: true,
      responsive: ["md"] as "md"[],
      render: (_: unknown, r: CookRequest) =>
        r.cook_comment ? (
          <Typography.Text
            style={{ fontSize: 12, color: "#f97316", fontStyle: "italic" }}
          >
            "{r.cook_comment}"
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            No reply yet
          </Typography.Text>
        ),
    },
    {
      title: "When",
      key: "created_at",
      width: 90,
      responsive: ["lg"] as "lg"[],
      render: (_: unknown, r: CookRequest) => (
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {formatRelative(r.created_at)}
        </Typography.Text>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 90,
      render: (_: unknown, r: CookRequest) => {
        const canDelete = (r.requested_by === userId || isAdmin) && !isCook;
        return (
          <Flex gap={4} justify="flex-end">
            <Tooltip title="View details">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onView(r)}
              />
            </Tooltip>
            {isCook && (
              <Tooltip title="Reply">
                <Button
                  size="small"
                  icon={<MessageOutlined />}
                  style={{ color: "#f97316", borderColor: "#f97316" }}
                  onClick={() => onReply(r)}
                />
              </Tooltip>
            )}
            {canDelete && (
              <Popconfirm
                title="Remove this request?"
                onConfirm={() => onDelete(r.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Flex>
        );
      },
    },
  ];

  return (
    <Table<CookRequest>
      rowKey="id"
      size="small"
      columns={columns}
      dataSource={requests}
      pagination={{
        pageSize: 12,
        hideOnSinglePage: true,
        showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
      }}
      scroll={{ x: 520 }}
    />
  );
}
