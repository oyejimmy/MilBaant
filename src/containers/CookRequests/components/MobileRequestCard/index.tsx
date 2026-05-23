import { Card, Flex, Typography, Tag, Button, Popconfirm, Space } from "antd";
import {
  EyeOutlined,
  MessageOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { CookRequest } from "@/lib/types";
import { StatusBadge } from "../StatusBadge";
import { CommentBubble } from "../CommentBubble";
import { formatRelative } from "../helpers";

interface MobileRequestCardProps {
  request: CookRequest;
  userId?: string;
  isCook: boolean;
  isAdmin: boolean;
  onView: (request: CookRequest) => void;
  onReply: (request: CookRequest) => void;
  onDelete: (id: string) => void;
}

export function MobileRequestCard({
  request,
  userId,
  isCook,
  isAdmin,
  onView,
  onReply,
  onDelete,
}: MobileRequestCardProps) {
  const canDelete = (request.requested_by === userId || isAdmin) && !isCook;

  return (
    <Card>
      <Flex vertical gap={8}>
        <Flex justify="space-between" align="center">
          <Typography.Text strong style={{ fontSize: 13 }}>
            {request.item}
          </Typography.Text>
          <StatusBadge status={request.status} />
        </Flex>

        {request.quantity && (
          <Flex justify="space-between">
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Quantity
            </Typography.Text>
            <Typography.Text style={{ fontSize: 12 }}>
              {request.quantity}
            </Typography.Text>
          </Flex>
        )}

        <Flex justify="space-between" align="center">
          <Flex gap={6} align="center">
            <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
              {request.requester?.full_name ?? "—"}
            </Tag>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {formatRelative(request.created_at)}
            </Typography.Text>
          </Flex>
          <Space size={4}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(request)}
            />
            {isCook && (
              <Button
                size="small"
                icon={<MessageOutlined />}
                style={{ color: "#f97316", borderColor: "#f97316" }}
                onClick={() => onReply(request)}
              />
            )}
            {canDelete && (
              <Popconfirm
                title="Remove?"
                onConfirm={() => onDelete(request.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        </Flex>

        {request.cook_comment && (
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Cook's Reply
            </Typography.Text>
            <CommentBubble>{request.cook_comment}</CommentBubble>
          </div>
        )}

        {request.note && (
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            Note: {request.note}
          </Typography.Text>
        )}
      </Flex>
    </Card>
  );
}
