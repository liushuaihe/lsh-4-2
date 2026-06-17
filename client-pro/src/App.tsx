import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Space } from 'antd';
import {
  HomeOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  WalletOutlined,
  LogoutOutlined,
  SwapOutlined,
  TrophyOutlined,
  StarOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons';
import useStore from './store/useStore';
import { initSocket, disconnectSocket } from './utils/socket';
import Login from './pages/Login';
import Home from './pages/Home';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import SkillManage from './pages/SkillManage';
import Certification from './pages/Certification';
import Earnings from './pages/Earnings';
import Wallet from './pages/Wallet';
import Chat from './pages/Chat';
import Profile from './pages/Profile';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const { user, token, logout, fetchUnreadCount, unreadCount, switchRole } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token && user) {
      initSocket(user.id);
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => {
        clearInterval(interval);
        disconnectSocket();
      };
    }
  }, [token, user]);

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchRole = async () => {
    try {
      await switchRole('BOSS');
      window.location.href = 'http://localhost:3001';
    } catch (error) {
      console.error('Switch role failed:', error);
    }
  };

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/orders', icon: <ShoppingCartOutlined />, label: '订单管理' },
    { key: '/skills', icon: <StarOutlined />, label: '技能管理' },
    { key: '/certification', icon: <SafetyCertificateOutlined />, label: '认证申请' },
    { key: '/earnings', icon: <BarChartOutlined />, label: '收益统计' },
    { key: '/wallet', icon: <WalletOutlined />, label: '钱包' },
    { key: '/chat', icon: <MessageOutlined />, label: '消息' },
    { key: '/profile', icon: <UserOutlined />, label: '个人中心' }
  ];

  const userMenu = {
    items: [
      {
        key: '1',
        icon: <UserOutlined />,
        label: '个人中心',
        onClick: () => navigate('/profile')
      },
      {
        key: '2',
        icon: <SettingOutlined />,
        label: '账号设置',
        onClick: () => navigate('/profile')
      },
      {
        key: '3',
        icon: <SwapOutlined />,
        label: '切换到老板端',
        onClick: handleSwitchRole
      },
      {
        key: '4',
        icon: <TrophyOutlined />,
        label: '运营后台',
        onClick: () => window.open('http://localhost:3003', '_blank')
      },
      { type: 'divider' as const },
      {
        key: '5',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout
      }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#1677ff' }}>🎮 大神端</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <span style={{ fontSize: 16, color: '#666' }}>欢迎回来，</span>
            <span style={{ fontSize: 16, fontWeight: 500 }}>{user?.nickname}</span>
            <Button type="link" size="small" onClick={handleSwitchRole} style={{ marginLeft: 16 }}>
              <SwapOutlined /> 切换为老板
            </Button>
          </div>
          <Space size={24}>
            <Badge count={unreadCount} size="small">
              <Button
                type="text"
                icon={<MessageOutlined style={{ fontSize: 18 }} />}
                onClick={() => navigate('/chat')}
              />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar src={user?.avatar} size={36} />
                <span>{user?.nickname}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f5f7fa' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/order/:id" element={<OrderDetail />} />
            <Route path="/skills" element={<SkillManage />} />
            <Route path="/certification" element={<Certification />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:userId" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
