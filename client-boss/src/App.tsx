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
  TrophyOutlined
} from '@ant-design/icons';
import useStore from './store/useStore';
import { initSocket, disconnectSocket } from './utils/socket';
import Login from './pages/Login';
import Home from './pages/Home';
import GameDetail from './pages/GameDetail';
import ProDetail from './pages/ProDetail';
import OrderCreate from './pages/OrderCreate';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';

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
      await switchRole('PRO');
      window.location.href = 'http://localhost:3002';
    } catch (error) {
      console.error('Switch role failed:', error);
    }
  };

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/orders', icon: <ShoppingCartOutlined />, label: '我的订单' },
    { key: '/messages', icon: <MessageOutlined />, label: '消息' },
    { key: '/wallet', icon: <WalletOutlined />, label: '我的钱包' },
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
        icon: <SwapOutlined />,
        label: '切换到大神端',
        onClick: handleSwitchRole
      },
      {
        key: '3',
        icon: <TrophyOutlined />,
        label: '运营后台',
        onClick: () => window.open('http://localhost:3003', '_blank')
      },
      { type: 'divider' as const },
      {
        key: '4',
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
          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#1677ff' }}>🎮 陪玩平台</span>
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
              <SwapOutlined /> 切换为大神
            </Button>
          </div>
          <Space size={24}>
            <Badge count={unreadCount} size="small">
              <Button
                type="text"
                icon={<MessageOutlined style={{ fontSize: 18 }} />}
                onClick={() => navigate('/messages')}
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
            <Route path="/game/:id" element={<GameDetail />} />
            <Route path="/pro/:id" element={<ProDetail />} />
            <Route path="/order/create" element={<OrderCreate />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/order/:id" element={<OrderDetail />} />
            <Route path="/messages" element={<Chat />} />
            <Route path="/messages/:userId" element={<Chat />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
