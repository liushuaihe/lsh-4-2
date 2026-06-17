import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useStore from '@/store/useStore';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const { login, register } = useStore();
  const navigate = useNavigate();

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      await register({ ...values, role: 'PRO' });
      message.success('注册成功');
      navigate('/');
    } catch (error) {
      console.error('Register failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <Form
      name="login"
      onFinish={handleLogin}
      autoComplete="off"
      size="large"
      initialValues={{ username: 'pro1', password: '123456' }}
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="用户名" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          登录
        </Button>
      </Form.Item>
      <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
        测试账号: pro1 / 123456
      </div>
    </Form>
  );

  const registerForm = (
    <Form
      name="register"
      onFinish={handleRegister}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="username"
        rules={[
          { required: true, message: '请输入用户名' },
          { min: 3, max: 20, message: '用户名长度3-20位' }
        ]}
      >
        <Input prefix={<UserOutlined />} placeholder="用户名" />
      </Form.Item>
      <Form.Item
        name="nickname"
        rules={[{ required: true, message: '请输入昵称' }]}
      >
        <Input prefix={<RocketOutlined />} placeholder="昵称" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, max: 20, message: '密码长度6-20位' }
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: '请确认密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次密码不一致'));
            }
          })
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          注册
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
          <h1 style={{ marginBottom: 8 }}>游戏陪玩平台</h1>
          <p style={{ color: '#999' }}>大神端 - 开启你的陪玩之旅</p>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            { key: 'login', label: '登录' },
            { key: 'register', label: '注册' }
          ]}
        />
        {activeTab === 'login' ? loginForm : registerForm}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button type="link" onClick={() => window.open('http://localhost:3001', '_blank')}>
            前往老板端 →
          </Button>
          <Button type="link" onClick={() => window.open('http://localhost:3003', '_blank')}>
            前往运营后台 →
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
