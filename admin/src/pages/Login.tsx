import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useStore from '@/store/useStore';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { login } = useStore();
  const navigate = useNavigate();

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/');
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
          <Title level={3} style={{ marginBottom: 8 }}>游戏陪玩平台</Title>
          <Text type="secondary">运营后台管理系统</Text>
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          size="large"
          initialValues={{ username: 'admin', password: '123456' }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: 12 }}>
            测试账号：admin / 123456
          </Text>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
