import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Spin,
  Descriptions,
  Timeline,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Popconfirm
} from 'antd';
import {
  MessageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/utils/request';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface OrderDetail {
  id: string;
  orderNo: string;
  amount: number;
  status: string;
  duration: number;
  requirement: string;
  progress: string;
  createdAt: string;
  paidAt: string;
  acceptedAt: string;
  startedAt: string;
  completedAt: string;
  cancelledAt: string;
  boss: { id: string; nickname: string; avatar: string; phone: string };
  pro: { id: string; nickname: string; avatar: string; phone: string };
  game: { name: string; icon: string };
  skill: { rank: string; pricePerHour: number; description: string };
  statusLogs: { status: string; remark: string; createdAt: string }[];
  review: any;
}

const statusMap: any = {
  PENDING: { text: '待支付', color: 'orange' },
  PAID: { text: '已支付', color: 'blue' },
  ACCEPTED: { text: '已接单', color: 'cyan' },
  IN_PROGRESS: { text: '服务中', color: 'processing' },
  COMPLETED: { text: '已完成', color: 'success' },
  CANCELLED: { text: '已取消', color: 'default' },
  REFUNDED: { text: '已退款', color: 'purple' }
};

const statusColors: any = {
  PENDING: 'orange',
  PAID: 'blue',
  ACCEPTED: 'cyan',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'gray',
  REFUNDED: 'purple'
};

const OrderDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [isCompleteMode, setIsCompleteMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const data = await request.get(`/orders/${id}`);
      setOrder(data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      await request.post(`/orders/${order.id}/accept`);
      message.success('接单成功');
      fetchOrder();
    } catch (error) {
      console.error('Accept order failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      await request.post(`/orders/${order.id}/start`);
      message.success('服务已开始');
      fetchOrder();
    } catch (error) {
      console.error('Start service failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProgress = () => {
    setIsCompleteMode(false);
    form.setFieldsValue({ progress: order?.progress || '' });
    setProgressModalOpen(true);
  };

  const handleComplete = () => {
    setIsCompleteMode(true);
    form.setFieldsValue({ progress: '服务已完成' });
    setProgressModalOpen(true);
  };

  const handleModalSubmit = async (values: any) => {
    if (!order) return;
    setActionLoading(true);
    try {
      if (isCompleteMode) {
        await request.post(`/orders/${order.id}/complete`, { progress: values.progress });
        message.success('订单已完成');
      } else {
        await request.put(`/orders/${order.id}/progress`, { progress: values.progress });
        message.success('进度已更新');
      }
      setProgressModalOpen(false);
      fetchOrder();
    } catch (error) {
      console.error('Operation failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      await request.post(`/orders/${order.id}/cancel`);
      message.success('订单已取消');
      fetchOrder();
    } catch (error) {
      console.error('Cancel failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return <div style={{ textAlign: 'center', padding: 100 }}>订单不存在</div>;
  }

  const status = statusMap[order.status] || { text: order.status, color: 'default' };
  const canAccept = order.status === 'PAID';
  const canStart = order.status === 'ACCEPTED';
  const canUpdateProgress = order.status === 'IN_PROGRESS';
  const canComplete = order.status === 'IN_PROGRESS';
  const canCancel = ['PAID', 'ACCEPTED'].includes(order.status);

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: 8 }}>订单详情</Title>
            <Text type="secondary">订单号：{order.orderNo}</Text>
          </div>
          <Tag color={status.color} style={{ fontSize: 16, padding: '4px 16px' }}>
            {status.text}
          </Tag>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div>
          <Card title="订单信息" style={{ marginBottom: 24 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="游戏">
                {order.game.icon} {order.game.name}
              </Descriptions.Item>
              <Descriptions.Item label="段位">{order.skill.rank}</Descriptions.Item>
              <Descriptions.Item label="服务时长">{order.duration}小时</Descriptions.Item>
              <Descriptions.Item label="单价">¥{order.skill.pricePerHour}/小时</Descriptions.Item>
              <Descriptions.Item label="订单金额" span={2}>
                <span style={{ fontSize: 20, fontWeight: 'bold', color: '#ff4d4f' }}>
                  ¥{order.amount.toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="服务要求" span={2}>
                {order.requirement || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="当前进度" span={2}>
                {order.progress || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="订单状态追踪" style={{ marginBottom: 24 }}>
            <Timeline
              className="order-timeline"
              items={order.statusLogs.map((log, index) => ({
                color: statusColors[log.status] || 'blue',
                dot: index === order.statusLogs.length - 1 ? <ClockCircleOutlined /> : undefined,
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {statusMap[log.status]?.text || log.status}
                    </div>
                    <div style={{ color: '#666', fontSize: 13 }}>{log.remark}</div>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                      {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                  </div>
                )
              }))}
            />
          </Card>

          {order.review && (
            <Card title="老板评价">
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ marginLeft: 12, flex: 1 }}>
                  <div style={{ color: '#666' }}>{order.review.content}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(order.review.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div>
          <Card title="老板信息" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <img src={order.boss.avatar} alt="" style={{ width: 64, height: 64, borderRadius: '50%', marginRight: 12 }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{order.boss.nickname}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  联系电话：{order.boss.phone || '未设置'}
                </Text>
              </div>
            </div>
            <Button
              block
              icon={<MessageOutlined />}
              style={{ marginTop: 12 }}
              onClick={() => navigate(`/chat/${order.boss.id}`)}
            >
              发送私信
            </Button>
          </Card>

          <Card title="订单操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              {canAccept && (
                <Button type="primary" block loading={actionLoading} onClick={handleAccept}>
                  <CheckCircleOutlined /> 立即接单
                </Button>
              )}
              {canStart && (
                <Button type="primary" block loading={actionLoading} onClick={handleStart}>
                  <PlayCircleOutlined /> 开始服务
                </Button>
              )}
              {canUpdateProgress && (
                <Button block icon={<SyncOutlined />} onClick={handleUpdateProgress}>
                  更新服务进度
                </Button>
              )}
              {canComplete && (
                <Button type="primary" block icon={<CheckCircleOutlined />} onClick={handleComplete}>
                  完成订单
                </Button>
              )}
              {canCancel && (
                <Popconfirm
                  title="确定要取消订单吗？"
                  description={order.status === 'PAID' ? '已支付的订单取消后将自动退款' : ''}
                  onConfirm={handleCancel}
                  okText="确定"
                  cancelText="再想想"
                >
                  <Button block danger loading={actionLoading}>
                    <CloseCircleOutlined /> 取消订单
                  </Button>
                </Popconfirm>
              )}
              <Button block onClick={() => navigate('/orders')}>
                返回订单列表
              </Button>
            </Space>
          </Card>
        </div>
      </div>

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
            label={isCompleteMode ? '完成说明' : '服务进度'}
            rules={[{ required: true, message: `请输入${isCompleteMode ? '完成说明' : '服务进度'}` }]}
          >
            <TextArea rows={4} placeholder={`请描述${isCompleteMode ? '完成说明' : '当前服务进度'}...`} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={actionLoading}>
                确认提交
              </Button>
              <Button onClick={() => {
                setProgressModalOpen(false);
                setIsCompleteMode(false);
              }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderDetail;
