import { Card, Typography } from "antd";

interface CommentBubbleProps {
  children: React.ReactNode;
}

export function CommentBubble({ children }: CommentBubbleProps) {
  return (
    <Card
      size="small"
      style={{
        background: "var(--content-bg)",
        borderLeft: "3px solid #f97316",
        borderRadius: "0 8px 8px 8px",
      }}
    >
      <Typography.Text style={{ fontSize: 12, color: "var(--text-strong)" }}>
        {children}
      </Typography.Text>
    </Card>
  );
}
