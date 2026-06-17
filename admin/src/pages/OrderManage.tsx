import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Avatar,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Descriptions,
  message,
  Spin,
  Pagination,
  Timeline,
  Typography
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/utils/request';

const { Text } = Typography;

interface Order {
  id: string;
  orderNo: string;
  amount: number;
  duration: number;
  status: string;
  requirement: string;
  createdAt: string;
  paidAt: string;
  acceptedAt: string;
  startedAt: string;
  completedAt: string;
  cancelledAt: string;
  progress: string;
  boss: { id: string; nickname: string; avatar: string };
  pro: { id: string; nickname: string; avatar: string };
  game: { id: string; name: string; icon: string };
  skill: { id: string; rank: string; pricePerHour: number };
  statusLogs: Array<{
    id: string;
    status: string;
    remark: string;
    createdAt: string;
  }>;
}

const statusMap: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待支付', color: 'orange' },
  PAID: { text: '已支付', color: 'blue' },
  ACCEPTED: { text: '已接单', color: 'cyan' },
  IN_PROGRESS: { text: '服务中', color: 'processing' },
  COMPLETED: { text: '已完成', color: 'success' },
  CANCELLED: { text: '已取消', color: 'default' },
  REFUNDED: { text: '已退款', color: 'purple' }
};

const timelineStatusMap: Record<string, string> = {
  PENDING: '#faad14',
  PAID: '#1890ff',
  ACCEPTED: '#13c2c2',
  IN_PROGRESS: '#722ed1',
  COMPLETED: '#52c41a',
  CANCELLED: '#8c8c8c',
  REFUNDED: '#eb2f96'
};

const OrderManage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, keyword, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (keyword) params.keyword = keyword;

      const data = await request<{ list: Order[]; total: number }>({
        method: 'get',
        url: '/admin/orders',
        params
      });
      setOrders(data.list);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleViewDetail = async (order: Order) => {
    try {
      const detail = await request<Order>({
        method: 'get',
        url: `/orders/${order.id}`
      });
      setSelectedOrder(detail);
      setDetailVisible(true);
    } catch (error) {
      message.error('获取订单详情失败');
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (text: string) => (
        <Text copyable={{ tooltips: ['复制', '已复制'] }}>{text}</Text>
      )
    },
    {
      title: '老板',
      key: 'boss',
      width: 120,
      render: (_: any, record: Order) => (
        <Space>
          <Avatar src={record.boss.avatar} size={32} />
          <span>{record.boss.nickname}</span>
        </Space>
      )
    },
    {
      title: '大神',
      key: 'pro',
      width: 120,
      render: (_: any, record: Order) => (
        <Space>
          <Avatar src={record.pro.avatar} size={32} />
          <span>{record.pro.nickname}</span>
        </Space>
      )
    },
    {
      title: '游戏',
      key: 'game',
      width: 120,
      render: (_: any, record: Order) => (
        <Space>
          <span style={{ fontSize: 20 }}>{record.game.icon}</span>
          <span>{record.game.name}</span>
        </Space>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number) => (
        <Text strong style={{ color: '#fa541c' }}>¥{amount.toFixed(2)}</Text>
      )
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration: number) => `${duration}小时`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: Order) => (
        <Button
          size="small"
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      )
    }
  ];

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            options={[
              { value: 'ALL', label: '全部状态' },
              { value: 'PENDING', label: '待支付' },
              { value: 'PAID', label: '已支付' },
              { value: 'ACCEPTED', label: '已接单' },
              { value: 'IN_PROGRESS', label: '服务中' },
              { value: 'COMPLETED', label: '已完成' },
              { value: 'CANCELLED', label: '已取消' },
              { value: 'REFUNDED', label: '已退款' }
            ]}
          />
          <Input
            placeholder="搜索订单号"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
            suffix={
              <SearchOutlined
                style={{ cursor: 'pointer', color: '#1890ff' }}
                onClick={handleSearch}
              />
            }
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1100 }}
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        </Spin>
      </Space>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="订单号" span={2}>
                <Text copyable>{selectedOrder.orderNo}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="老板">
                <Space>
                  <Avatar src={selectedOrder.boss.avatar} size={24} />
                  {selectedOrder.boss.nickname}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="大神">
                <Space>
                  <Avatar src={selectedOrder.pro.avatar} size={24} />
                  {selectedOrder.pro.nickname}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="游戏">
                <Space>
                  <span style={{ fontSize: 18 }}>{selectedOrder.game.icon}</span>
                  {selectedOrder.game.name}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="段位">
                {selectedOrder.skill.rank}
              </Descriptions.Item>
              <Descriptions.Item label="时长">
                {selectedOrder.duration}小时
              </Descriptions.Item>
              <Descriptions.Item label="金额">
                <Text strong style={{ color: '#fa541c' }}>
                  ¥{selectedOrder.amount.toFixed(2)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="单价">
                ¥{selectedOrder.skill.pricePerHour}/小时
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[selectedOrder.status]?.color}>
                  {statusMap[selectedOrder.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="服务进度">
                {selectedOrder.progress || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="订单要求" span={2}>
                {selectedOrder.requirement || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="支付时间">
                {selectedOrder.paidAt
                  ? dayjs(selectedOrder.paidAt).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="接单时间">
                {selectedOrder.acceptedAt
                  ? dayjs(selectedOrder.acceptedAt).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {selectedOrder.startedAt
                  ? dayjs(selectedOrder.startedAt).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {selectedOrder.completedAt
                  ? dayjs(selectedOrder.completedAt).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="取消时间">
                {selectedOrder.cancelledAt
                  ? dayjs(selectedOrder.cancelledAt).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Card title="状态时间线" size="small">
              <Timeline
                items={selectedOrder.statusLogs.map((log) => ({
                  color: timelineStatusMap[log.status] || 'blue',
                  children: (
                    <Space direction="vertical" size={0}>
                      <Text strong>
                        {statusMap[log.status]?.text || log.status}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {log.remark}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                      </Text>
                    </Space>
                  )
                }))}
              />
            </Card>
          </Space>
        )}
      </Modal>
    </Card>
  );
};

export default OrderManage;
