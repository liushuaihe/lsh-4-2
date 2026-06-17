import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Typography,
  Descriptions,
  message,
  Modal,
  Upload,
  Switch
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SwapOutlined,
  UploadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '@/store/useStore';
import request from '@/utils/request';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { user, setUser, switchRole, fetchProfile } = useStore();
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);

  const handleEdit = () => {
    form.setFieldsValue({
      nickname: user?.nickname,
      phone: user?.phone
    });
    setEditing(true);
  };

  const handleSave = async (values: any) => {
    try {
      const data = await request.put('/auth/profile', values);
      setUser(data);
      message.success('修改成功');
      setEditing(false);
    } catch (error) {
      console.error('Update profile failed:', error);
    }
  };

  const handleSwitchRole = async () => {
    try {
      await switchRole('BOSS');
      message.success('角色切换成功');
      setSwitchConfirmOpen(false);
      window.location.href = 'http://localhost:3001';
    } catch (error) {
      console.error('Switch role failed:', error);
    }
  };

  const handleAcceptOrderToggle = async (checked: boolean) => {
    if (!user) return;
    setAcceptLoading(true);
    try {
      await request.put('/auth/profile', { acceptOrders: checked });
      setUser({ ...user, acceptOrders: checked });
      message.success(checked ? '已开启接单' : '已关闭接单');
      fetchProfile();
    } catch (error) {
      console.error('Toggle accept order failed:', error);
    } finally {
      setAcceptLoading(false);
    }
  };

  const uploadProps = {
    name: 'avatar',
    action: '/api/upload/avatar',
    headers: {
      authorization: `Bearer ${localStorage.getItem('token')}`
    },
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片!');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片不能大于2MB!');
        return false;
      }
      return true;
    },
    onChange(info: any) {
      if (info.file.status === 'done') {
        message.success('头像上传成功');
        if (info.file.response?.code === 200) {
          setUser({ ...user!, avatar: info.file.response.data.url });
        }
      } else if (info.file.status === 'error') {
        message.error('头像上传失败');
      }
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', marginRight: 24 }}>
            <Avatar src={user?.avatar} size={100} icon={<UserOutlined />} />
            <Upload {...uploadProps} showUploadList={false}>
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                background: '#1677ff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14
              }}>
                <EditOutlined />
              </div>
            </Upload>
          </div>
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
              {user?.nickname}
            </Title>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">用户名：{user?.username}</Text>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">
                当前角色：
                <span style={{ color: user?.role === 'BOSS' ? '#1677ff' : '#52c41a', marginLeft: 4 }}>
                  {user?.role === 'BOSS' ? '老板' : '大神'}
                </span>
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text type="secondary">接单状态：</Text>
              <Text strong style={{ color: user?.acceptOrders ? '#52c41a' : '#999' }}>
                {user?.acceptOrders ? '接单中' : '休息中'}
              </Text>
              <Switch
                checked={user?.acceptOrders || false}
                onChange={handleAcceptOrderToggle}
                loading={acceptLoading}
                size="small"
              />
            </div>
          </div>
          <div>
            <Button type="primary" icon={<SwapOutlined />} onClick={() => setSwitchConfirmOpen(true)}>
              切换为老板
            </Button>
          </div>
        </div>

        <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
          <Descriptions.Item label="账户余额">
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#ff4d4f' }}>
              ¥{user?.balance?.toFixed(2) || '0.00'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="手机号码">
            {user?.phone || '未设置'}
          </Descriptions.Item>
          <Descriptions.Item label="注册时间">
            {dayjs((user as any)?.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="当前状态">
            {user?.isOnline ? (
              <span style={{ color: '#52c41a' }}>在线</span>
            ) : (
              <span style={{ color: '#999' }}>离线</span>
            )}
          </Descriptions.Item>
        </Descriptions>

        {!editing ? (
          <div style={{ textAlign: 'center' }}>
            <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
              编辑资料
            </Button>
          </div>
        ) : (
          <Form form={form} onFinish={handleSave} layout="vertical">
            <Form.Item
              name="nickname"
              label="昵称"
              rules={[{ required: true, message: '请输入昵称' }]}
            >
              <Input placeholder="请输入昵称" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="手机号码"
            >
              <Input placeholder="请输入手机号码" />
            </Form.Item>
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" htmlType="submit">保存修改</Button>
              <Button style={{ marginLeft: 8 }} onClick={() => setEditing(false)}>取消</Button>
            </div>
          </Form>
        )}
      </Card>

      <Card title="角色说明">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ padding: 16, background: '#e6f4ff', borderRadius: 8 }}>
            <Title level={5} style={{ color: '#1677ff', marginBottom: 12 }}>老板角色</Title>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li style={{ marginBottom: 8 }}>浏览游戏类目</li>
              <li style={{ marginBottom: 8 }}>筛选大神</li>
              <li style={{ marginBottom: 8 }}>查看大神主页</li>
              <li style={{ marginBottom: 8 }}>下单交易</li>
              <li style={{ marginBottom: 8 }}>实时私信互动</li>
              <li>个人资产管理</li>
            </ul>
          </div>
          <div style={{ padding: 16, background: '#f6ffed', borderRadius: 8 }}>
            <Title level={5} style={{ color: '#52c41a', marginBottom: 12 }}>大神角色</Title>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li style={{ marginBottom: 8 }}>技能与语音认证</li>
              <li style={{ marginBottom: 8 }}>在线接单状态控制</li>
              <li style={{ marginBottom: 8 }}>实时订单接收</li>
              <li style={{ marginBottom: 8 }}>服务进度修改</li>
              <li style={{ marginBottom: 8 }}>收益流水查看</li>
              <li>提现申请</li>
            </ul>
          </div>
        </div>
      </Card>

      <Modal
        title="角色切换确认"
        open={switchConfirmOpen}
        onCancel={() => setSwitchConfirmOpen(false)}
        onOk={handleSwitchRole}
        okText="确认切换"
        cancelText="取消"
      >
        <div style={{ padding: 16 }}>
          <Text>
            确定要切换到 <Text strong style={{ color: '#1677ff' }}>老板角色</Text> 吗？
          </Text>
          <div style={{ marginTop: 12, padding: 12, background: '#f5f7fa', borderRadius: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              切换后将跳转到老板端，您可以：
            </Text>
            <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
              <li style={{ fontSize: 12, color: '#666' }}>浏览游戏类目，寻找心仪的大神</li>
              <li style={{ fontSize: 12, color: '#666' }}>查看大神主页和技能</li>
              <li style={{ fontSize: 12, color: '#666' }}>下单享受陪玩服务</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
