import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Avatar,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Descriptions,
  message,
  Spin,
  Pagination,
  Switch
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/utils/request';

interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  role: string;
  balance: number;
  isOnline: boolean;
  acceptOrders: boolean;
  phone: string;
  createdAt: string;
  _count: {
    bossOrders: number;
    proOrders: number;
  };
}

const roleMap: Record<string, { text: string; color: string }> = {
  BOSS: { text: '老板', color: 'blue' },
  PRO: { text: '大神', color: 'green' },
  ADMIN: { text: '管理员', color: 'purple' }
};

const UserManage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, keyword, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (keyword) params.keyword = keyword;

      const data = await request<{ list: User[]; total: number }>({
        method: 'get',
        url: '/admin/users',
        params
      });
      setUsers(data.list);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setDetailVisible(true);
  };

  const handleToggleStatus = async (user: User, enabled: boolean) => {
    Modal.confirm({
      title: enabled ? '启用用户' : '禁用用户',
      content: `确定要${enabled ? '启用' : '禁用'}用户「${user.nickname}」吗？`,
      onOk: async () => {
        try {
          await request({
            method: 'put',
            url: `/admin/user/${user.id}/status`,
            data: { isActive: enabled }
          });
          message.success(`${enabled ? '启用' : '禁用'}成功`);
          fetchUsers();
        } catch (error) {
          message.error(`${enabled ? '启用' : '禁用'}失败`);
        }
      }
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: string) => text.slice(0, 8) + '...'
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 120
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar: string) => <Avatar src={avatar} size={40} />
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => {
        const info = roleMap[role] || { text: role, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      }
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      render: (balance: number) => `¥${balance.toFixed(2)}`
    },
    {
      title: '在线状态',
      dataIndex: 'isOnline',
      key: 'isOnline',
      width: 100,
      render: (isOnline: boolean) => (
        <Tag color={isOnline ? 'success' : 'default'}>
          {isOnline ? '在线' : '离线'}
        </Tag>
      )
    },
    {
      title: '接单状态',
      dataIndex: 'acceptOrders',
      key: 'acceptOrders',
      width: 100,
      render: (acceptOrders: boolean, record: User) => (
        record.role === 'PRO' ? (
          <Tag color={acceptOrders ? 'green' : 'orange'}>
            {acceptOrders ? '接单中' : '休息中'}
          </Tag>
        ) : '-'
      )
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '订单数',
      key: 'orderCount',
      width: 100,
      render: (_: any, record: User) => (
        record.role === 'BOSS' ? record._count.bossOrders : record._count.proOrders
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: User) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            size="small"
            type="link"
            danger
            icon={<StopOutlined />}
            onClick={() => handleToggleStatus(record, false)}
          >
            禁用
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap>
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ width: 150 }}
            options={[
              { value: 'ALL', label: '全部角色' },
              { value: 'BOSS', label: '老板' },
              { value: 'PRO', label: '大神' },
              { value: 'ADMIN', label: '管理员' }
            ]}
          />
          <Input
            placeholder="搜索用户名/昵称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
            suffix={
              <SearchOutlined
                style={{ cursor: 'pointer', color: '#1890ff' }}
                onClick={handleSearch}
              />
            }
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1200 }}
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        </Spin>
      </Space>

      <Modal
        title="用户详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {selectedUser && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="用户ID" span={2}>
              {selectedUser.id}
            </Descriptions.Item>
            <Descriptions.Item label="用户名">
              {selectedUser.username}
            </Descriptions.Item>
            <Descriptions.Item label="昵称">
              {selectedUser.nickname}
            </Descriptions.Item>
            <Descriptions.Item label="头像">
              <Avatar src={selectedUser.avatar} size={48} />
            </Descriptions.Item>
            <Descriptions.Item label="角色">
              <Tag color={roleMap[selectedUser.role]?.color}>
                {roleMap[selectedUser.role]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="余额">
              ¥{selectedUser.balance.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="手机号">
              {selectedUser.phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="在线状态">
              <Tag color={selectedUser.isOnline ? 'success' : 'default'}>
                {selectedUser.isOnline ? '在线' : '离线'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="接单状态">
              {selectedUser.role === 'PRO' ? (
                <Tag color={selectedUser.acceptOrders ? 'green' : 'orange'}>
                  {selectedUser.acceptOrders ? '接单中' : '休息中'}
                </Tag>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="注册时间" span={2}>
              {dayjs(selectedUser.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="订单数" span={2}>
              {selectedUser.role === 'BOSS'
                ? `作为老板下单：${selectedUser._count.bossOrders} 单`
                : `作为大神接单：${selectedUser._count.proOrders} 单`}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
};

export default UserManage;
