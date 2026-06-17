import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  message
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  SafetyCertificateOutlined,
  MoneyCollectOutlined,
  RocketOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import useStore from '@/store/useStore';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import UserManage from '@/pages/UserManage';
import OrderManage from '@/pages/OrderManage';
import CertificationAudit from '@/pages/CertificationAudit';
import WithdrawalAudit from '@/pages/WithdrawalAudit';
import GameManage from '@/pages/GameManage';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '数据概览' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理' },
  { key: '/orders', icon: <ShoppingOutlined />, label: '订单管理' },
  { key: '/certifications', icon: <SafetyCertificateOutlined />, label: '认证审核' },
  { key: '/withdrawals', icon: <MoneyCollectOutlined />, label: '提现审核' },
  { key: '/games', icon: <RocketOutlined />, label: '游戏管理' }
];

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useStore((state) => state.token);
  const isAdmin = useStore((state) => state.isAdmin);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    message.error('只有管理员可以访问');
    useStore.getState().logout();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const fetchProfile = useStore((state) => state.fetchProfile);

  useEffect(() => {
    if (user && !user.id) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  const getPageTitle = () => {
    const item = menuItems.find((m) => m.key === location.pathname);
    return item?.label as string || '数据概览';
  };

  const getCurrentHour = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '凌晨好';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 17) return '下午好';
    if (hour < 19) return '傍晚好';
    return '晚上好';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 16,
          fontWeight: 600,
          borderBottom: '1px solid #1f1f1f'
        }}>
          <RocketOutlined style={{ marginRight: 8 }} />
          运营后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px'
        }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 500 }}>{getPageTitle()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#666' }}>
              {getCurrentHour()}，{user?.nickname || '管理员'}
            </span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 4,
                transition: 'background 0.2s'
              }}>
                <Avatar size={32} src={user?.avatar} icon={<UserOutlined />} />
                <span style={{ marginLeft: 8, color: '#333' }}>{user?.nickname || '管理员'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content>
          <div className="page-header">
            <h2>{getPageTitle()}</h2>
            <p>欢迎使用游戏陪玩平台运营后台管理系统</p>
          </div>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UserManage />} />
            <Route path="/orders" element={<OrderManage />} />
            <Route path="/certifications" element={<CertificationAudit />} />
            <Route path="/withdrawals" element={<WithdrawalAudit />} />
            <Route path="/games" element={<GameManage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

export default App;
