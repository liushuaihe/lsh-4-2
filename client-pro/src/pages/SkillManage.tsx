import React, { useEffect, useState } from 'react';
import {
  Card,
  List,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  Empty,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message
} from 'antd';
import {
  StarOutlined,
  PlusOutlined,
  EditOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import request from '@/utils/request';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Skill {
  id: string;
  gameId: string;
  rank: string;
  pricePerHour: number;
  description: string;
  isCertified: boolean;
  createdAt: string;
  game: { id: string; name: string; icon: string };
}

interface Game {
  id: string;
  name: string;
  icon: string;
}

const SkillManage: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [skillsData, gamesData] = await Promise.all([
        request.get('/games/my/skills'),
        request.get('/games')
      ]);
      setSkills(skillsData);
      setGames(gamesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSkill(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    form.setFieldsValue({
      gameId: skill.gameId,
      rank: skill.rank,
      pricePerHour: skill.pricePerHour,
      description: skill.description
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    setActionLoading(true);
    try {
      if (editingSkill) {
        await request.put(`/games/skill/${editingSkill.id}`, values);
        message.success('技能更新成功');
      } else {
        await request.post('/games/skill', values);
        message.success('技能添加成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              <StarOutlined style={{ color: '#faad14', marginRight: 8 }} />
              我的技能
            </Title>
            <Text type="secondary">管理您的游戏技能，设置价格和段位</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加技能
          </Button>
        </div>

        {skills.length === 0 ? (
          <Empty description="暂无技能，点击上方按钮添加您的第一个技能" />
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }}
            dataSource={skills}
            renderItem={(skill) => (
              <List.Item>
                <Card
                  hoverable
                  actions={[
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(skill)}
                    >
                      编辑
                    </Button>
                  ]}
                >
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>{skill.game.icon}</div>
                    <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
                      {skill.game.name}
                    </Title>
                    <Space>
                      {skill.isCertified && (
                        <Tag color="green" icon={<SafetyCertificateOutlined />}>
                          已认证
                        </Tag>
                      )}
                      <Tag color="blue">{skill.rank}</Tag>
                    </Space>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">单价：</Text>
                    <Text strong style={{ color: '#ff4d4f', fontSize: 18 }}>
                      ¥{skill.pricePerHour}
                    </Text>
                    <Text type="secondary">/小时</Text>
                  </div>
                  {skill.description && (
                    <div>
                      <Text type="secondary">描述：</Text>
                      <Text>{skill.description}</Text>
                    </div>
                  )}
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title={editingSkill ? '编辑技能' : '添加技能'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="gameId"
            label="选择游戏"
            rules={[{ required: true, message: '请选择游戏' }]}
          >
            <Select placeholder="请选择游戏" disabled={!!editingSkill}>
              {games.map((game) => (
                <Option key={game.id} value={game.id}>
                  <span style={{ marginRight: 8 }}>{game.icon}</span>
                  {game.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="rank"
            label="段位/等级"
            rules={[{ required: true, message: '请输入段位或等级' }]}
          >
            <Input placeholder="如：王者、钻石、大师等" />
          </Form.Item>
          <Form.Item
            name="pricePerHour"
            label="单价（元/小时）"
            rules={[
              { required: true, message: '请输入单价' },
              { type: 'number', min: 1, message: '单价不能小于1元' }
            ]}
          >
            <InputNumber
              min={1}
              max={9999}
              placeholder="请输入单价"
              style={{ width: '100%' }}
              addonAfter="元/小时"
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="技能描述"
          >
            <TextArea rows={4} placeholder="请描述您的技能优势、服务特色等" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={actionLoading}>
                {editingSkill ? '保存修改' : '添加技能'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SkillManage;
