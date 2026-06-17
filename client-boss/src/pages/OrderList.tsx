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
  Rate,
  Pagination
} from 'antd';
import { EyeOutlined, MessageOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '../utils/request';

const { Text } = Typography;

interface Order {
  id: string;
  orderNo: string;
  amount: number;
  status: string;
  duration: number;
  createdAt: string;
  pro: { id: string; nickname: string; avatar: string };
  game: { name: string; icon: string };
  skill: { rank: string };
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

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchOrders();
  }, [activeTab, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (activeTab !== 'ALL') params.status = activeTab;

      const data = await request.get<{ list: Order[]; total: number }>('/orders/my', { params });
      setOrders(data.list);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    { key: 'ALL', label: '全部订单' },
    { key: 'PENDING', label: '待支付' },
    { key: 'PAID', label: '待接单' },
    { key: 'ACCEPTED', label: '已接单' },
    { key: 'IN_PROGRESS', label: '服务中' },
    { key: 'COMPLETED', label: '已完成' }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

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
                    avatar={<Avatar src={order.pro.avatar} size={64} />}
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Space>
                          <span style={{ fontSize: 16, fontWeight: 500 }}>{order.pro.nickname}</span>
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
                        {order.review && (
                          <div style={{ padding: 8, background: '#f5f7fa', borderRadius: 4 }}>
                            <div style={{ marginBottom: 4 }}>
                              <Rate disabled value={order.review.rating} />
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              我的评价：{order.review.content}
                            </Text>
                          </div>
                        )}
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
                              onClick={() => navigate(`/messages/${order.pro.id}`)}
                            >
                              联系大神
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

        {orders.length > 0 && (
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
    </div>
  );
};

export default OrderList;
