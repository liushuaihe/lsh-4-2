import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Spin,
  Switch,
  List,
  Avatar,
  Tag,
  Button,
  Space,
  message,
  Empty,
  Statistic
} from 'antd';
import {
  MoneyCollectOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  StarOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  MessageOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import request from '@/utils/request';
import useStore from '@/store/useStore';

const { Title, Text } = Typography;

interface Order {
  id: string;
  orderNo: string;
  amount: number;
  status: string;
  duration: number;
  createdAt: string;
  boss: { id: string; nickname: string; avatar: string };
  game: { name: string; icon: string };
  skill: { rank: string };
}

interface Stats {
  todayEarning: number;
  todayOrders: number;
  pendingOrders: number;
  balance: number;
}

const statusMap: any = {
  PAID: { text: '待接单', color: 'blue' },
  ACCEPTED: { text: '已接单', color: 'cyan' },
  IN_PROGRESS: { text: '服务中', color: 'processing' }
};

const Home: React.FC = () => {
  const { user, setUser, fetchProfile } = useStore();
  const [stats, setStats] = useState<Stats>({
    todayEarning: 0,
    todayOrders: 0,
    pendingOrders: 0,
    balance: 0
  });
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchLoading, setSwitchLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, ordersData] = await Promise.all([
        request.get('/wallet/stats'),
        request.get('/orders/my', { params: { status: 'PAID', pageSize: 5 } })
      ]);

      setStats({
        todayEarning: statsData.todayEarning || 0,
        todayOrders: statsData.totalOrders || 0,
        pendingOrders: ordersData.total || 0,
        balance: statsData.balance || 0
      });
      setPendingOrders(ordersData.list || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrderToggle = async (checked: boolean) => {
    if (!user) return;
    setSwitchLoading(true);
    try {
      await request.put('/auth/profile', { acceptOrders: checked });
      setUser({ ...user, acceptOrders: checked });
      message.success(checked ? '已开启接单' : '已关闭接单');
    } catch (error) {
      console.error('Toggle accept order failed:', error);
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await request.post(`/orders/${orderId}/accept`);
      message.success('接单成功');
      fetchData();
    } catch (error) {
      console.error('Accept order failed:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const quickActions = [
    { icon: <StarOutlined />, title: '我的技能', path: '/skills', color: '#1677ff' },
    { icon: <SafetyCertificateOutlined />, title: '认证申请', path: '/certification', color: '#52c41a' },
    { icon: <ShoppingOutlined />, title: '订单管理', path: '/orders', color: '#722ed1' },
    { icon: <WalletOutlined />, title: '提现', path: '/wallet', color: '#fa8c16' }
  ];

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
              接单状态
            </Title>
            <Text type="secondary">
              {user?.acceptOrders ? '当前正在接单中，新订单将实时推送' : '已关闭接单，不会收到新订单通知'}
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text strong style={{ fontSize: 16 }}>
              {user?.acceptOrders ? '接单中' : '休息中'}
            </Text>
            <Switch
              checked={user?.acceptOrders || false}
              onChange={handleAcceptOrderToggle}
              loading={switchLoading}
            />
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card className="stats-card" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>今日收益</span>}
              value={stats.todayEarning}
              precision={2}
              prefix={<MoneyCollectOutlined />}
              suffix="元"
              valueStyle={{ color: '#fff', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stats-card green" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>今日订单</span>}
              value={stats.todayOrders}
              prefix={<ShoppingOutlined />}
              suffix="单"
              valueStyle={{ color: '#fff', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stats-card orange" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>待处理订单</span>}
              value={stats.pendingOrders}
              prefix={<ClockCircleOutlined />}
              suffix="单"
              valueStyle={{ color: '#fff', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stats-card purple" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>账户余额</span>}
              value={stats.balance}
              precision={2}
              prefix={<WalletOutlined />}
              suffix="元"
              valueStyle={{ color: '#fff', fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 20 }}>快捷入口</Title>
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={12} sm={6} key={index}>
              <div
                onClick={() => navigate(action.path)}
                style={{
                  textAlign: 'center',
                  padding: 24,
                  background: `${action.color}08`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${action.color}15`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${action.color}08`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    fontSize: 32,
                    color: action.color,
                    marginBottom: 8
                  }}
                >
                  {action.icon}
                </div>
                <Text strong>{action.title}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <ClockCircleOutlined style={{ color: '#1677ff', marginRight: 8 }} />
              待接单订单
            </span>
            <Button type="link" onClick={() => navigate('/orders')}>
              查看全部 →
            </Button>
          </div>
        }
      >
        {pendingOrders.length === 0 ? (
          <Empty description="暂无待接单订单" />
        ) : (
          <List
            dataSource={pendingOrders}
            renderItem={(order) => {
              const status = statusMap[order.status] || { text: order.status, color: 'default' };

              return (
                <List.Item key={order.id}>
                  <List.Item.Meta
                    avatar={<Avatar src={order.boss.avatar} size={56} />}
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
                        <div style={{ marginBottom: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            下单时间：{dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
                          </Text>
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <Space>
                            <Button
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => navigate(`/order/${order.id}`)}
                            >
                              查看详情
                            </Button>
                            <Button
                              size="small"
                              icon={<MessageOutlined />}
                              onClick={() => navigate(`/chat/${order.boss.id}`)}
                            >
                              联系老板
                            </Button>
                            <Button
                              type="primary"
                              size="small"
                              icon={<CheckCircleOutlined />}
                              onClick={() => handleAcceptOrder(order.id)}
                            >
                              立即接单
                            </Button>
                          </Space>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default Home;
