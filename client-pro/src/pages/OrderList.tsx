import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Tabs,
  List,
  Avatar,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  Empty,
  Pagination,
  message,
  Modal,
  Form,
  Input
} from 'antd';
import {
  EyeOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/utils/request';

const { Text } = Typography;
const { TextArea } = Input;

interface Order {
  id: string;
  orderNo: string;
  amount: number;
  status: string;
  duration: number;
  progress: string;
  createdAt: string;
  boss: { id: string; nickname: string; avatar: string };
  game: { name: string; icon: string };
  skill: { rank: string };
}

const statusMap: any = {
  PAID: { text: '待接单', color: 'blue' },
  ACCEPTED: { text: '已接单', color: 'cyan' },
  IN_PROGRESS: { text: '服务中', color: 'processing' },
  COMPLETED: { text: '已完成', color: 'success' },
  CANCELLED: { text: '已取消', color: 'default' },
  REFUNDED: { text: '已退款', color: 'purple' }
};

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('ALL');
  const [page, setPage] = useState(1);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCompleteMode, setIsCompleteMode] = useState(false);
  const [form] = Form.useForm();
  const pageSize = 10;

  useEffect(() => {
    fetchOrders();
  }, [activeTab, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (activeTab !== 'ALL') params.status = activeTab;

      const data = await request.get('/orders/my', { params });
      setOrders(data.list);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId: string) => {
    setActionLoading(true);
    try {
      await request.post(`/orders/${orderId}/accept`);
      message.success('接单成功');
      fetchOrders();
    } catch (error) {
      console.error('Accept order failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async (orderId: string) => {
    setActionLoading(true);
    try {
      await request.post(`/orders/${orderId}/start`);
      message.success('服务已开始');
      fetchOrders();
    } catch (error) {
      console.error('Start service failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProgress = (orderId: string) => {
    setCurrentOrderId(orderId);
    setIsCompleteMode(false);
    form.setFieldsValue({ progress: '' });
    setProgressModalOpen(true);
  };

  const handleComplete = async (orderId: string) => {
    setCurrentOrderId(orderId);
    setIsCompleteMode(true);
    form.setFieldsValue({ progress: '服务已完成' });
    setProgressModalOpen(true);
  };

  const handleModalSubmit = async (values: any) => {
    if (!currentOrderId) return;
    setActionLoading(true);
    try {
      if (isCompleteMode) {
        await request.post(`/orders/${currentOrderId}/complete`, { progress: values.progress });
        message.success('订单已完成');
      } else {
        await request.put(`/orders/${currentOrderId}/progress`, { progress: values.progress });
        message.success('进度已更新');
      }
      setProgressModalOpen(false);
      setIsCompleteMode(false);
      fetchOrders();
    } catch (error) {
      console.error('Operation failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const tabItems = [
    { key: 'ALL', label: '全部订单' },
    { key: 'PAID', label: '待接单' },
    { key: 'ACCEPTED', label: '已接单' },
    { key: 'IN_PROGRESS', label: '服务中' },
    { key: 'COMPLETED', label: '已完成' },
    { key: 'CANCELLED', label: '已取消' }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const getActions = (order: Order) => {
    const actions: React.ReactNode[] = [
      <Button
        key="view"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => navigate(`/order/${order.id}`)}
      >
        查看详情
      </Button>,
      <Button
        key="chat"
        size="small"
        icon={<MessageOutlined />}
        onClick={() => navigate(`/chat/${order.boss.id}`)}
      >
        联系老板
      </Button>
    ];

    if (order.status === 'PAID') {
      actions.push(
        <Button
          key="accept"
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          loading={actionLoading}
          onClick={() => handleAccept(order.id)}
        >
          接单
        </Button>
      );
    }

    if (order.status === 'ACCEPTED') {
      actions.push(
        <Button
          key="start"
          type="primary"
          size="small"
          icon={<PlayCircleOutlined />}
          loading={actionLoading}
          onClick={() => handleStart(order.id)}
        >
          开始服务
        </Button>
      );
    }

    if (order.status === 'IN_PROGRESS') {
      actions.push(
        <Button
          key="progress"
          size="small"
          icon={<SyncOutlined />}
          onClick={() => handleUpdateProgress(order.id)}
        >
          更新进度
        </Button>,
        <Button
          key="complete"
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => handleComplete(order.id)}
        >
          完成订单
        </Button>
      );
    }

    return actions;
  };

  return (
    <div>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />

        {orders.length === 0 ? (
          <Empty description="暂无订单" />
        ) : (
          <List
            dataSource={orders}
            renderItem={(order) => {
              const status = statusMap[order.status] || { text: order.status, color: 'default' };

              return (
                <List.Item key={order.id}>
                  <List.Item.Meta
                    avatar={<Avatar src={order.boss.avatar} size={64} />}
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Space>
                          <span style={{ fontSize: 16, fontWeight: 500 }}>{order.boss.nickname}</span>
                          <span>{order.game.icon} {order.game.name}</span>
                          <Tag color={status.color}>{status.text}</Tag>
                        </Space>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ff4d4f' }}>
                            ¥{order.amount.toFixed(2)}
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {order.duration}小时
                          </Text>
                        </div>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 8 }}>
                          <Text type="secondary">段位：</Text>
                          <Text>{order.skill.rank}</Text>
                          <Text type="secondary" style={{ marginLeft: 24 }}>
                            订单号：{order.orderNo}
                          </Text>
                        </div>
                        {order.progress && (
                          <div style={{ marginBottom: 8 }}>
                            <Text type="secondary">当前进度：</Text>
                            <Text>{order.progress}</Text>
                          </div>
                        )}
                        <div style={{ marginBottom: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            下单时间：{dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
                          </Text>
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <Space>{getActions(order)}</Space>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}

        {total > pageSize && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        )}
      </Card>

      <Modal
        title={isCompleteMode ? '完成订单' : '更新服务进度'}
        open={progressModalOpen}
        onCancel={() => {
          setProgressModalOpen(false);
          setIsCompleteMode(false);
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleModalSubmit} layout="vertical">
          <Form.Item
            name="progress"
            label="服务进度"
            rules={[{ required: true, message: '请输入服务进度' }]}
          >
            <TextArea rows={4} placeholder="请描述当前服务进度..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={actionLoading}>
                确认更新
              </Button>
              <Button onClick={() => setProgressModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderList;
