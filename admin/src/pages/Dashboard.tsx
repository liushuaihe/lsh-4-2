import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Space, Button, Spin } from 'antd';
import {
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  MoneyCollectOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/charts';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import request from '@/utils/request';

interface StatsData {
  totalUsers: number;
  totalOrders: number;
  totalEarning: number;
  pendingOrders: number;
  pendingCertifications: number;
  pendingWithdrawals: number;
  todayOrders: number;
  todayRevenue: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await request<StatsData>({
        method: 'get',
        url: '/admin/stats'
      });
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const orderTrendData = Array.from({ length: 7 }, (_, i) => {
    const date = dayjs().subtract(6 - i, 'day');
    return {
      date: date.format('MM-DD'),
      orders: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 5000) + 1000
    };
  });

  const roleDistributionData = [
    { type: '老板', value: 450 },
    { type: '大神', value: 320 },
    { type: '管理员', value: 5 }
  ];

  const gameDistributionData = [
    { type: '王者荣耀', value: 180 },
    { type: '和平精英', value: 150 },
    { type: '英雄联盟', value: 120 },
    { type: '原神', value: 90 },
    { type: '其他', value: 60 }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const orderTrendConfig = {
    data: orderTrendData,
    xField: 'date',
    yField: 'orders',
    smooth: true,
    point: { size: 5, shape: 'circle' },
    color: '#1890ff',
    height: 280
  };

  const revenueTrendConfig = {
    data: orderTrendData,
    xField: 'date',
    yField: 'revenue',
    color: '#52c41a',
    height: 280,
    label: {
      position: 'middle',
      style: { fill: '#fff', opacity: 0.8 }
    }
  };

  const rolePieConfig = {
    data: roleDistributionData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: { type: 'outer', content: '{name} {percentage}' },
    height: 280,
    color: ['#1890ff', '#52c41a', '#faad14']
  };

  const gamePieConfig = {
    data: gameDistributionData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: { type: 'outer', content: '{name} {percentage}' },
    height: 280
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable onClick={() => navigate('/users')}>
            <Statistic
              title="总用户数"
              value={stats?.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable onClick={() => navigate('/orders')}>
            <Statistic
              title="总订单数"
              value={stats?.totalOrders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable>
            <Statistic
              title="总营收"
              value={stats?.totalEarning || 0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable onClick={() => navigate('/orders')}>
            <Statistic
              title="待处理订单"
              value={stats?.pendingOrders || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable onClick={() => navigate('/certifications')}>
            <Statistic
              title="待审核认证"
              value={stats?.pendingCertifications || 0}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable onClick={() => navigate('/withdrawals')}>
            <Statistic
              title="待审核提现"
              value={stats?.pendingWithdrawals || 0}
              prefix={<MoneyCollectOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近7天订单趋势" extra={<Button type="link" onClick={() => navigate('/orders')}>查看更多 <ArrowRightOutlined /></Button>}>
            <Line {...orderTrendConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近7天营收趋势" extra={<Button type="link">查看更多 <ArrowRightOutlined /></Button>}>
            <Column {...revenueTrendConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="用户角色分布" extra={<Button type="link" onClick={() => navigate('/users')}>查看更多 <ArrowRightOutlined /></Button>}>
            <Pie {...rolePieConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="游戏订单分布" extra={<Button type="link" onClick={() => navigate('/games')}>查看更多 <ArrowRightOutlined /></Button>}>
            <Pie {...gamePieConfig} />
          </Card>
        </Col>
      </Row>

      <Card title="快捷操作">
        <Space wrap>
          <Button type="primary" size="large" onClick={() => navigate('/users')}>
            用户管理
          </Button>
          <Button type="primary" size="large" onClick={() => navigate('/orders')}>
            订单管理
          </Button>
          <Button type="primary" size="large" onClick={() => navigate('/certifications')}>
            认证审核
          </Button>
          <Button type="primary" size="large" onClick={() => navigate('/withdrawals')}>
            提现审核
          </Button>
          <Button type="primary" size="large" onClick={() => navigate('/games')}>
            游戏管理
          </Button>
        </Space>
      </Card>
    </Space>
  );
};

export default Dashboard;
