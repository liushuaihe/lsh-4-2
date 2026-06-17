import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  Pagination,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/utils/request';

interface Game {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    skills: number;
  };
}

const categoryOptions = [
  { value: 'MOBA', label: 'MOBA' },
  { value: 'FPS', label: 'FPS' },
  { value: 'RPG', label: 'RPG' },
  { value: '卡牌', label: '卡牌' },
  { value: '休闲', label: '休闲' },
  { value: '其他', label: '其他' }
];

const GameManage: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [addVisible, setAddVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchGames();
  }, [page]);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const data = await request<Game[]>({
        method: 'get',
        url: '/games'
      });
      setGames(data);
      setTotal(data.length);
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    addForm.resetFields();
    setAddVisible(true);
  };

  const openEditModal = (game: Game) => {
    setSelectedGame(game);
    editForm.setFieldsValue({
      name: game.name,
      icon: game.icon,
      category: game.category,
      description: game.description
    });
    setEditVisible(true);
  };

  const handleAdd = async (values: { name: string; icon: string; category: string; description: string }) => {
    try {
      await request({
        method: 'post',
        url: '/admin/game',
        data: values
      });
      message.success('添加成功');
      setAddVisible(false);
      fetchGames();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleEdit = async (values: { name: string; icon: string; category: string; description: string }) => {
    if (!selectedGame) return;

    try {
      await request({
        method: 'put',
        url: `/admin/game/${selectedGame.id}`,
        data: values
      });
      message.success('更新成功');
      setEditVisible(false);
      fetchGames();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleToggleStatus = async (game: Game, isActive: boolean) => {
    Modal.confirm({
      title: isActive ? '启用游戏' : '禁用游戏',
      content: `确定要${isActive ? '启用' : '禁用'}游戏「${game.name}」吗？`,
      onOk: async () => {
        try {
          await request({
            method: 'put',
            url: `/admin/game/${game.id}`,
            data: { isActive }
          });
          message.success(`${isActive ? '启用' : '禁用'}成功`);
          fetchGames();
        } catch (error) {
          message.error(`${isActive ? '启用' : '禁用'}失败`);
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
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 80,
      render: (icon: string) => (
        <span style={{ fontSize: 32 }}>{icon}</span>
      )
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => <Tag color="blue">{category}</Tag>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '关联技能数',
      key: 'skillCount',
      width: 120,
      render: (_: any, record: Game) => record._count?.skills || 0
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: Game) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          {record.isActive ? (
            <Button
              size="small"
              type="link"
              danger
              icon={<StopOutlined />}
              onClick={() => handleToggleStatus(record, false)}
            >
              禁用
            </Button>
          ) : (
            <Button
              size="small"
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleToggleStatus(record, true)}
            >
              启用
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <span></span>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            添加游戏
          </Button>
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={games}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1100 }}
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
        title="添加游戏"
        open={addVisible}
        onCancel={() => setAddVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={addForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item
            name="name"
            label="游戏名称"
            rules={[{ required: true, message: '请输入游戏名称' }]}
          >
            <Input placeholder="请输入游戏名称" />
          </Form.Item>
          <Form.Item
            name="icon"
            label="游戏图标"
            rules={[{ required: true, message: '请输入游戏图标（Emoji）' }]}
          >
            <Input placeholder="例如：🎮 🏆 ⚔️" maxLength={10} />
          </Form.Item>
          <Form.Item
            name="category"
            label="游戏分类"
            rules={[{ required: true, message: '请选择游戏分类' }]}
          >
            <Select options={categoryOptions} placeholder="请选择游戏分类" />
          </Form.Item>
          <Form.Item
            name="description"
            label="游戏描述"
          >
            <Input.TextArea rows={3} placeholder="请输入游戏描述" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setAddVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑游戏"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item
            name="name"
            label="游戏名称"
            rules={[{ required: true, message: '请输入游戏名称' }]}
          >
            <Input placeholder="请输入游戏名称" />
          </Form.Item>
          <Form.Item
            name="icon"
            label="游戏图标"
            rules={[{ required: true, message: '请输入游戏图标（Emoji）' }]}
          >
            <Input placeholder="例如：🎮 🏆 ⚔️" maxLength={10} />
          </Form.Item>
          <Form.Item
            name="category"
            label="游戏分类"
            rules={[{ required: true, message: '请选择游戏分类' }]}
          >
            <Select options={categoryOptions} placeholder="请选择游戏分类" />
          </Form.Item>
          <Form.Item
            name="description"
            label="游戏描述"
          >
            <Input.TextArea rows={3} placeholder="请输入游戏描述" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default GameManage;
