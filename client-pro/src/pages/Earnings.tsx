import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Spin,
  Statistic,
  List,
  Tag,
  Pagination,
  Tabs,
  Empty
} from 'antd';
import {
  MoneyCollectOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  ShopOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/utils/request';

const { Title, Text } = Typography;

interface Stats {
  todayEarning: number;
  weekEarning: number;
  monthEarning: number;
  totalEarning: number;
  totalOrders: number;
  balance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  remark: string;
  createdAt: string;
}

const typeMap: any = {
  RECHARGE: { text: '充值', icon: <ArrowUpOutlined />, color: 'green' },
  EARNING: { text: '收益', icon: <MoneyCollectOutlined />, color: 'green' },
  WITHDRAWAL: { text: '提现', icon: <ArrowDownOutlined />, color: 'orange' },
  WITHDRAWAL_FAILED: { text: '提现失败退款', icon: <ArrowUpOutlined />, color: 'blue' }
};

const Earnings: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    todayEarning: 0,
    weekEarning: 0,
    monthEarning: 0,
    totalEarning: 0,
    totalOrders: 0,
    balance: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('EARNING');
  const pageSize = 20;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [activeTab, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await request.get('/wallet/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params: any = { page, pageSize };
      if (activeTab !== 'ALL') params.type = activeTab;

      const data = await request.get('/wallet/transactions', { params });
      setTransactions(data.list);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const getLast7DaysEarnings = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      const earning = Math.random() * 100 + 20;
      days.push({
        date: date.format('MM-DD'),
        weekday: date.format('ddd'),
        earning: parseFloat(earning.toFixed(2))
      });
    }
    return days;
  };

  const earningsData = getLast7DaysEarnings();
  const maxEarning = Math.max(...earningsData.map(d => d.earning)) || 1;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    { key: 'ALL', label: '全部记录' },
    { key: 'EARNING', label: '收益' },
    { key: 'WITHDRAWAL', label: '提现' }
  ];

  return (
    <div>
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
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>本周收益</span>}
              value={stats.weekEarning}
              precision={2}
              prefix={<CalendarOutlined />}
              suffix="元"
              valueStyle={{ color: '#fff', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stats-card orange" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>本月收益</span>}
              value={stats.monthEarning}
              precision={2}
              prefix={<ThunderboltOutlined />}
              suffix="元"
              valueStyle={{ color: '#fff', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stats-card purple" bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>累计收益</span>}
              value={stats.totalEarning}
              precision={2}
              prefix={<TrophyOutlined />}
              suffix="元"
              valueStyle={{ color: '#fff', fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={12}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>完成订单数</div>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShopOutlined style={{ marginRight: 8 }} />
                  {stats.totalOrders}
                </div>
              </div>
              <div style={{ width: 1, height: 60, background: '#f0f0f0' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>账户余额</div>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MoneyCollectOutlined style={{ marginRight: 8 }} />
                  ¥{stats.balance.toFixed(2)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={12}>
          <Card title="近7天收益趋势">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 200, padding: '0 16px' }}>
              {earningsData.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1
                  }}
                >
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                    ¥{item.earning}
                  </div>
                  <div
                    style={{
                      width: '60%',
                      background: 'linear-gradient(180deg, #1677ff 0%, #69b1ff 100%)',
                      height: `${(item.earning / maxEarning) * 120}px`,
                      borderRadius: '4px 4px 0 0',
                      minHeight: 4
                    }}
                  />
                  <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                    {item.date}
                  </div>
                  <div style={{ fontSize: 11, color: '#bbb' }}>
                    {item.weekday}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>收益明细</Title>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />

        {transactions.length === 0 ? (
          <Empty description="暂无记录" />
        ) : (
          <>
            <List
              dataSource={transactions}
              renderItem={(item) => {
                const typeInfo = typeMap[item.type] || { text: item.type, color: 'default' };
                return (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: `${typeInfo.color}15`,
                            color: typeInfo.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18
                          }}
                        >
                          {typeInfo.icon}
                        </div>
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{typeInfo.text}</span>
                          <span style={{
                            fontSize: 16,
                            fontWeight: 500,
                            color: item.amount >= 0 ? '#52c41a' : '#ff4d4f'
                          }}>
                            {item.amount >= 0 ? '+' : ''}¥{item.amount.toFixed(2)}
                          </span>
                        </div>
                      }
                      description={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text type="secondary">{item.remark}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
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
          </>
        )}
      </Card>
    </div>
  );
};

export default Earnings;
