import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Typography,
  Spin,
  Tag,
  Button,
  Slider,
  Select,
  Switch,
  Space,
  Empty,
  Avatar,
  Rate,
  Pagination
} from 'antd';
import {
  StarOutlined,
  CrownOutlined,
  AudioOutlined,
  MessageOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import request from '../utils/request';

const { Title, Text } = Typography;
const { Option } = Select;

interface Pro {
  id: string;
  proId: string;
  rank: string;
  pricePerHour: number;
  description: string;
  isCertified: boolean;
  game: any;
  pro: {
    id: string;
    nickname: string;
    avatar: string;
    isOnline: boolean;
    avgRating: number;
    reviewCount: number;
    orderCount: number;
    certifications: { type: string }[];
  };
}

interface Game {
  id: string;
  name: string;
  icon: string;
  category: string;
}

const GameDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [pros, setPros] = useState<Pro[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 200,
    rank: '',
    isCertified: false,
    sortBy: '',
    page: 1,
    pageSize: 10
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gameData, prosData] = await Promise.all([
        request.get<Game[]>(`/games`),
        request.get<{ list: Pro[]; total: number }>(`/games/${id}/pros`, { params: filters })
      ]);
      const gameInfo = gameData.find(g => g.id === id);
      setGame(gameInfo || null);
      setPros(prosData.list);
      setTotal(prosData.total);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = (pro: Pro) => {
    navigate('/order/create', {
      state: {
        proId: pro.pro.id,
        gameId: id,
        skillId: pro.id,
        pricePerHour: pro.pricePerHour,
        proName: pro.pro.nickname,
        gameName: game?.name
      }
    });
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
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 48, marginRight: 16 }}>{game?.icon}</span>
        <div>
          <Title level={3} style={{ margin: 0, marginBottom: 8 }}>{game?.name}</Title>
          <Tag color="geekblue">{game?.category}</Tag>
          <Text type="secondary" style={{ marginLeft: 12 }}>
            共 {total} 位大神可约
          </Text>
        </div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Row gutter={24}>
            <Col span={8}>
              <Text strong>价格区间 (元/小时)</Text>
              <Slider
                range
                min={0}
                max={200}
                value={[filters.minPrice, filters.maxPrice]}
                onChange={(values: number[]) => setFilters({ ...filters, minPrice: values[0], maxPrice: values[1] })}
              />
              <Text type="secondary">
                ¥{filters.minPrice} - ¥{filters.maxPrice}
              </Text>
            </Col>
            <Col span={6}>
              <Text strong>段位筛选</Text>
              <Select
                placeholder="选择段位"
                allowClear
                style={{ width: '100%', marginTop: 8 }}
                value={filters.rank || undefined}
                onChange={(value) => setFilters({ ...filters, rank: value || '' })}
              >
                <Option value="王者">王者</Option>
                <Option value="荣耀">荣耀王者</Option>
                <Option value="战神">无敌战神</Option>
                <Option value="宗师">宗师</Option>
                <Option value="大师">大师</Option>
              </Select>
            </Col>
            <Col span={5}>
              <Text strong>排序方式</Text>
              <Select
                placeholder="排序"
                style={{ width: '100%', marginTop: 8 }}
                value={filters.sortBy || undefined}
                onChange={(value) => setFilters({ ...filters, sortBy: value })}
              >
                <Option value="">默认排序</Option>
                <Option value="price-asc">价格从低到高</Option>
                <Option value="price-desc">价格从高到低</Option>
                <Option value="rating">评分最高</Option>
              </Select>
            </Col>
            <Col span={5}>
              <Text strong>仅显示已认证</Text>
              <div style={{ marginTop: 12 }}>
                <Switch
                  checked={filters.isCertified}
                  onChange={(checked) => setFilters({ ...filters, isCertified: checked })}
                />
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {filters.isCertified ? '已开启' : '已关闭'}
                </Text>
              </div>
            </Col>
          </Row>
        </Space>
      </Card>

      {pros.length === 0 ? (
        <Empty description="暂无符合条件的大神" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {pros.map(pro => (
              <Col xs={24} sm={12} lg={8} key={pro.id}>
                <Card className="pro-card" hoverable>
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                    <Avatar src={pro.pro.avatar} size={64} style={{ marginRight: 12 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 16 }}>{pro.pro.nickname}</Text>
                        {pro.pro.isOnline && (
                          <Tag color="success" style={{ marginLeft: 8 }}>在线</Tag>
                        )}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <Rate disabled value={pro.pro.avgRating} />
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          {pro.pro.avgRating.toFixed(1)} ({pro.pro.reviewCount}评价)
                        </Text>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {pro.isCertified && (
                          <Tag icon={<CrownOutlined />} color="gold">已认证</Tag>
                        )}
                        {pro.pro.certifications.some(c => c.type === 'VOICE') && (
                          <Tag icon={<AudioOutlined />} color="blue">语音认证</Tag>
                        )}
                        {pro.pro.certifications.some(c => c.type === 'SKILL') && (
                          <Tag icon={<StarOutlined />} color="orange">技能认证</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12, padding: '12px 16px', background: '#f5f7fa', borderRadius: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>当前段位</Text>
                    <div style={{ fontSize: 16, fontWeight: 500, color: '#1677ff' }}>
                      {pro.rank}
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>服务介绍</Text>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                      {pro.description}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>服务价格</Text>
                      <div>
                        <span style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                          ¥{pro.pricePerHour}
                        </span>
                        <Text type="secondary"> /小时</Text>
                      </div>
                    </div>
                    <Space>
                      <Button
                        icon={<MessageOutlined />}
                        onClick={() => navigate(`/messages/${pro.pro.id}`)}
                      >
                        私信
                      </Button>
                      <Button
                        type="primary"
                        icon={<ShoppingCartOutlined />}
                        onClick={() => handleOrder(pro)}
                      >
                        下单
                      </Button>
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={filters.page}
              pageSize={filters.pageSize}
              total={total}
              onChange={(page) => setFilters({ ...filters, page })}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default GameDetail;
