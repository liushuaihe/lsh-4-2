import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  List,
  Avatar,
  Input,
  Button,
  Typography,
  Badge,
  Empty,
  Spin,
  Space
} from 'antd';
import { SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '../utils/request';
import useStore from '../store/useStore';
import { getSocket } from '../utils/socket';

const { Sider, Content } = Layout;
const { Text } = Typography;

interface Conversation {
  user: { id: string; nickname: string; avatar: string; isOnline: boolean };
  lastMessage: { content: string; createdAt: string; senderId: string };
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; nickname: string; avatar: string };
}

const Chat: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, fetchUnreadCount } = useStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    setupSocket();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchMessages(userId);
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupSocket = () => {
    const socket = getSocket();
    if (socket) {
      socket.on('newMessage', (message: Message) => {
        if (message.senderId === userId || message.receiverId === userId) {
          setMessages(prev => [...prev, message]);
        }
        fetchConversations();
        fetchUnreadCount();
      });
    }
  };

  const fetchConversations = async () => {
    try {
      const data = await request.get<Conversation[]>('/messages/conversations');
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (uid: string) => {
    setChatLoading(true);
    try {
      const data = await request.get<{ messages: Message[]; otherUser: any }>(`/messages/${uid}`);
      setMessages(data.messages);
      setOtherUser(data.otherUser);
      fetchConversations();
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !userId) return;

    try {
      await request.post(`/messages/${userId}`, { content: inputValue });
      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
    <Layout style={{ height: 'calc(100vh - 112px)', background: '#fff', borderRadius: 8 }}>
      <Sider
        width={280}
        style={{ background: '#fafafa', borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
          <Text strong style={{ fontSize: 16 }}>消息</Text>
        </div>
        {conversations.length === 0 ? (
          <Empty description="暂无消息" style={{ marginTop: 100 }} />
        ) : (
          <List
            dataSource={conversations}
            renderItem={(conv) => (
              <List.Item
                key={conv.user.id}
                onClick={() => navigate(`/messages/${conv.user.id}`)}
                style={{
                  cursor: 'pointer',
                  padding: '12px 16px',
                  background: userId === conv.user.id ? '#e6f4ff' : 'transparent',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot={conv.user.isOnline} color="green" offset={[3, 40]}>
                      <Avatar src={conv.user.avatar} size={48} />
                    </Badge>
                  }
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{conv.user.nickname}</span>
                      {conv.unreadCount > 0 && (
                        <Badge count={conv.unreadCount} size="small" />
                      )}
                    </div>
                  }
                  description={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary" ellipsis style={{ maxWidth: 160 }}>
                        {conv.lastMessage?.content}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(conv.lastMessage?.createdAt).format('HH:mm')}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Sider>
      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        {!userId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="选择一个会话开始聊天" />
          </div>
        ) : (
          <>
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
              <Avatar src={otherUser?.avatar} size={40} style={{ marginRight: 12 }} />
              <div>
                <div style={{ fontWeight: 500 }}>{otherUser?.nickname}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {otherUser?.isOnline ? '在线' : '离线'}
                </Text>
              </div>
            </div>

            <div className="message-list" style={{ flex: 1 }}>
              {chatLoading ? (
                <div style={{ textAlign: 'center', padding: 50 }}>
                  <Spin size="small" />
                </div>
              ) : messages.length === 0 ? (
                <Empty description="暂无消息" style={{ marginTop: 100 }} />
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message-item ${msg.senderId === user?.id ? 'self' : ''}`}
                    >
                      {msg.senderId !== user?.id && (
                        <Avatar src={msg.sender.avatar} size={36} style={{ marginRight: 12 }} />
                      )}
                      <div>
                        <div className="message-bubble">{msg.content}</div>
                        <div style={{ textAlign: msg.senderId === user?.id ? 'right' : 'left', marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {dayjs(msg.createdAt).format('HH:mm')}
                          </Text>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input.TextArea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="输入消息..."
                  rows={2}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  style={{ height: '100%' }}
                >
                  发送
                </Button>
              </Space.Compact>
            </div>
          </>
        )}
      </Content>
    </Layout>
  );
};

export default Chat;
