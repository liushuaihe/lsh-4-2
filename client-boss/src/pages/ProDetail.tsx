import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Spin,
  Tag,
  Button,
  Avatar,
  Rate,
  Row,
  Col,
  Descriptions,
  List,
  Empty,
  Space,
  Divider,
  Modal
} from 'antd';
import {
  StarOutlined,
  CrownOutlined,
  AudioOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '../utils/request';

const { Title, Text } = Typography;

interface ProDetail {
  id: string;
  nickname: string;
  avatar: string;
  isOnline: boolean;
  acceptOrders: boolean;
  avgRating: number;
  reviewCount: number;
  completedOrderCount: number;
  skills: any[];
  certifications: any[];
  reviews: any[];
  createdAt: string;
}

const ProDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pro, setPro] = useState<ProDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await request.get<ProDetail>(`/games/pro/${id}`);
      setPro(data);
    } catch (error) {
      console.error('Failed to fetch pro detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = (skill: any) => {
    setSelectedSkill(skill);
    navigate('/order/create', {
      state: {
        proId: id,
        gameId: skill.gameId,
        skillId: skill.id,
        pricePerHour: skill.pricePerHour,
        proName: pro?.nickname,
        gameName: skill.game.name
      }
    });
  };

  const playVoiceSample = (cert: any) => {
    setVoiceModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!pro) {
    return <Empty description="大神不存在" />;
  }

  const hasVoiceCert = pro.certifications.some(c => c.type === 'VOICE');
  const hasSkillCert = pro.certifications.some(c => c.type === 'SKILL');

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={pro.avatar} size={100} style={{ marginRight: 24 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <Title level={3} style={{ margin: 0, marginRight: 12 }}>{pro.nickname}</Title>
              {pro.isOnline ? (
                <Tag color="success">在线</Tag>
              ) : (
                <Tag color="default">离线</Tag>
              )}
              {pro.acceptOrders ? (
                <Tag color="green">接单中</Tag>
              ) : (
                <Tag color="orange">暂不接单</Tag>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <Rate disabled value={pro.avgRating} />
              <Text strong style={{ marginLeft: 8, fontSize: 16 }}>
                {pro.avgRating.toFixed(1)}
              </Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                ({pro.reviewCount}条评价)
              </Text>
              <Text type="secondary" style={{ marginLeft: 24 }}>
                已完成 {pro.completedOrderCount} 单
              </Text>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {hasSkillCert && (
                <Tag icon={<CrownOutlined />} color="gold" style={{ fontSize: 14, padding: '4px 12px' }}>
                  技能认证
                </Tag>
              )}
              {hasVoiceCert && (
                <Tag icon={<AudioOutlined />} color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                  语音认证
                </Tag>
              )}
            </div>
          </div>
          <Space>
            <Button
              size="large"
              icon={<MessageOutlined />}
              onClick={() => navigate(`/messages/${pro.id}`)}
            >
              发私信
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              disabled={!pro.acceptOrders || pro.skills.length === 0}
              onClick={() => pro.skills.length > 0 && handleOrder(pro.skills[0])}
            >
              立即下单
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={24}>
        <Col span={16}>
          <Card title="服务项目" style={{ marginBottom: 24 }}>
            {pro.skills.length === 0 ? (
              <Empty description="暂无服务项目" />
            ) : (
              <Row gutter={[16, 16]}>
                {pro.skills.map(skill => (
                  <Col span={12} key={skill.id}>
                    <Card hoverable>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 32, marginRight: 12 }}>{skill.game.icon}</span>
                        <div>
                          <Text strong style={{ fontSize: 16 }}>{skill.game.name}</Text>
                          <div>
                            {skill.isCertified && (
                              <Tag icon={<CheckCircleOutlined />} color="green">已认证</Tag>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <Text type="secondary">当前段位：</Text>
                        <Text strong style={{ color: '#1677ff' }}>{skill.rank}</Text>
                      </div>
                      <div style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
                        {skill.description}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                            ¥{skill.pricePerHour}
                          </span>
                          <Text type="secondary"> /小时</Text>
                        </div>
                        <Button
                          type="primary"
                          onClick={() => handleOrder(skill)}
                          disabled={!pro.acceptOrders}
                        >
                          下单
                        </Button>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>

          <Card title={`用户评价 (${pro.reviews.length})`}>
            {pro.reviews.length === 0 ? (
              <Empty description="暂无评价" />
            ) : (
              <List
                dataSource={pro.reviews}
                renderItem={(review: any) => (
                  <List.Item key={review.id}>
                    <List.Item.Meta
                      avatar={<Avatar src={review.reviewer.avatar} />}
                      title={
                        <Space>
                          <span>{review.reviewer.nickname}</span>
                          <Rate disabled value={review.rating} />
                          <Tag>{review.order.game.name}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ color: '#666', marginBottom: 4 }}>{review.content}</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(review.createdAt).format('YYYY-MM-DD HH:mm')}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="资质认证" style={{ marginBottom: 24 }}>
            {pro.certifications.length === 0 ? (
              <Empty description="暂无认证" />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {pro.certifications.map((cert: any) => (
                  <div key={cert.id} style={{ display: 'flex', alignItems: 'center', padding: 12, background: '#f5f7fa', borderRadius: 8 }}>
                    {cert.type === 'SKILL' ? (
                      <StarOutlined style={{ fontSize: 24, color: '#faad14', marginRight: 12 }} />
                    ) : (
                      <AudioOutlined style={{ fontSize: 24, color: '#1677ff', marginRight: 12 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>
                        {cert.type === 'SKILL' ? '技能认证' : '语音认证'}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {cert.remark}
                      </Text>
                    </div>
                    {cert.type === 'VOICE' && (
                      <Button
                        type="link"
                        icon={<PlayCircleOutlined />}
                        onClick={() => playVoiceSample(cert)}
                      >
                        试听
                      </Button>
                    )}
                  </div>
                ))}
              </Space>
            )}
          </Card>

          <Card title="个人简介">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="注册时间">
                {dayjs(pro.createdAt).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="累计接单">
                {pro.completedOrderCount} 单
              </Descriptions.Item>
              <Descriptions.Item label="好评率">
                {pro.reviewCount > 0 ? ((pro.avgRating / 5) * 100).toFixed(1) : 0}%
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                {pro.acceptOrders ? '接单中' : '休息中'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Modal
        title="语音样试听"
        open={voiceModalOpen}
        onCancel={() => setVoiceModalOpen(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: 40 }}>
          <PlayCircleOutlined style={{ fontSize: 64, color: '#1677ff' }} />
          <div style={{ marginTop: 16, color: '#666' }}>
            语音样片播放中...
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
            （模拟播放）该大神已通过语音认证，声音优质
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProDetail;
