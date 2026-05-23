import { Table, Avatar, Tag, Flex, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency } from "@/lib/formatters";
import type { RiderSummary } from "../../types";

interface RiderSummaryTableProps {
  summaries: RiderSummary[];
}

export function RiderSummaryTable({ summaries }: RiderSummaryTableProps) {
  const columns: ColumnsType<RiderSummary> = [
    {
      title: "Flatmate",
      dataIndex: "name",
      key: "name",
      render: (v: string) => (
        <Flex align="center" gap={8}>
          <Avatar
            size={24}
            style={{ background: "#909ffa" }}
            icon={<UserOutlined />}
          />
          <Typography.Text>{v}</Typography.Text>
        </Flex>
      ),
    },
    {
      title: "Rides",
      dataIndex: "rideCount",
      key: "rideCount",
      width: 80,
      render: (v: number) => <Tag>{v}</Tag>,
    },
    {
      title: "Total Share",
      dataIndex: "totalShare",
      key: "totalShare",
      render: (v: number) => (
        <Typography.Text strong style={{ color: "#909ffa" }}>
          {formatCurrency(v)}
        </Typography.Text>
      ),
      sorter: (a, b) => a.totalShare - b.totalShare,
    },
  ];

  return (
    <Table
      rowKey="id"
      size="small"
      pagination={false}
      dataSource={summaries}
      columns={columns}
      locale={{ emptyText: "No data yet." }}
    />
  );
}
