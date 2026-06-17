import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Spin, Tag, Empty } from 'antd';
import { UserOutlined, FireOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../utils/request';

const { Title, Text } = Typography;

interface Game {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  _count: { skills: number };
}

const Home: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gamesData, categoriesData] = await Promise.all([
        request.get<Game[]>('/games'),
        request.get<string[]>('/games/categories')
      ]);
      setGames(gamesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
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
      <div style={{ marginBottom: 32 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          <FireOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          热门游戏
        </Title>
        <Text type="secondary">选择游戏，找到心仪的大神陪你畅玩</Text>
      </div>

      <div style={{ marginBottom: 24 }}>
        {categories.map(cat => (
          <Tag key={cat} color="blue" style={{ fontSize: 14, padding: '4px 12px', marginRight: 8, marginBottom: 8 }}>
            {cat}
          </Tag>
        ))}
      </div>

      {games.length === 0 ? (
        <Empty description="暂无游戏" />
      ) : (
        <Row gutter={[24, 24]}>
          {games.map(game => (
            <Col xs={24} sm={12} md={8} lg={6} key={game.id}>
              <Card
                className="game-card"
                hoverable
                onClick={() => navigate(`/game/${game.id}`)}
                bodyStyle={{ padding: 24, textAlign: 'center' }}
              >
                <div style={{ fontSize: 64, marginBottom: 16 }}>{game.icon}</div>
                <Title level={4} style={{ marginBottom: 8 }}>{game.name}</Title>
                <div style={{ marginBottom: 12 }}>
                  <Tag color="geekblue">{game.category}</Tag>
                </div>
                <Text type="secondary">
                  <UserOutlined style={{ marginRight: 4 }} />
                  {game._count.skills} 位大神可约
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default Home;
