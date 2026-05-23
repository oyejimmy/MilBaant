import {
  Modal,
  Flex,
  Button,
  Popconfirm,
  Typography,
  Row,
  Col,
  Card,
  Space,
} from "antd";
import {
  InboxOutlined,
  DeleteOutlined,
  MessageOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import type { CookRequest } from "@/lib/types";
import { StatusBadge } from "../StatusBadge";
import { CommentBubble } from "../CommentBubble";
import { formatRelative } from "../helpers";

interface ViewRequestModalProps {
  request: CookRequest;
  open: boolean;
  isCook: boolean;
  canDelete: boolean;
  deleting: boolean;
  onClose: () => void;
  onReply: () => void;
  onDelete: () => void;
}

export function ViewRequestModal({
  request,
  open,
  isCook,
  canDelete,
  deleting,
  onClose,
  onReply,
  onDelete,
}: ViewRequestModalProps) {
  return (
    <Modal
      open={open}
      title={
        <Flex align="center" gap={8}>
          <InboxOutlined style={{ color: "var(--primary)" }} />
          <span>Request Details</span>
        </Flex>
      }
      footer={
        <Flex justify="space-between" align="center">
          <Flex gap={8}>
            {canDelete && (
              <Popconfirm title="Delete this request?" onConfirm={onDelete}>
                <Button danger icon={<DeleteOutlined />} loading={deleting}>
                  Delete
                </Button>
              </Popconfirm>
            )}
            {isCook && (
              <Button
                icon={<MessageOutlined />}
                style={{ color: "#f97316", borderColor: "#f97316" }}
                onClick={onReply}
              >
                Reply
              </Button>
            )}
          </Flex>
          <Button onClick={onClose}>Close</Button>
        </Flex>
      }
      onCancel={onClose}
      width="min(460px, 95vw)"
    >
      <Space
        direction="vertical"
        size={12}
        style={{ width: "100%", paddingTop: 8 }}
      >
        <div>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 11, textTransform: "uppercase" }}
          >
            Item
          </Typography.Text>
          <Typography.Title level={4} style={{ margin: "4px 0 0" }}>
            {request.item}
          </Typography.Title>
        </div>

        <Row gutter={[10, 10]}>
          {request.quantity && (
            <Col xs={12}>
              <Card size="small">
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Quantity
                </Typography.Text>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {request.quantity}
                </div>
              </Card>
            </Col>
          )}
          <Col xs={request.quantity ? 12 : 24}>
            <Card size="small">
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                Requested By
              </Typography.Text>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {request.requester?.full_name ?? "—"}
              </div>
            </Card>
          </Col>
          <Col xs={12}>
            <Card size="small">
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                Submitted
              </Typography.Text>
              <div style={{ fontSize: 13 }}>
                {formatRelative(request.created_at)}
              </div>
            </Card>
          </Col>
          <Col xs={12}>
            <Card size="small">
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                Status
              </Typography.Text>
              <StatusBadge status={request.status} />
            </Card>
          </Col>
        </Row>

        {request.note && (
          <Card size="small">
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Note from requester
            </Typography.Text>
            <Typography.Text style={{ display: "block", marginTop: 4 }}>
              {request.note}
            </Typography.Text>
          </Card>
        )}

        <div>
          <Flex align="center" gap={6} style={{ marginBottom: 6 }}>
            <CommentOutlined style={{ color: "#f97316", fontSize: 13 }} />
            <Typography.Text
              type="secondary"
              style={{ fontSize: 12, textTransform: "uppercase" }}
            >
              Cook's Reply
            </Typography.Text>
          </Flex>
          {request.cook_comment ? (
            <CommentBubble>{request.cook_comment}</CommentBubble>
          ) : (
            <Typography.Text
              type="secondary"
              style={{ fontSize: 12, fontStyle: "italic" }}
            >
              No reply yet — the cook hasn't responded to this request.
            </Typography.Text>
          )}
        </div>
      </Space>
    </Modal>
  );
}
