import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  List,
  Tag,
  Modal,
  InputNumber,
  Space,
  Tabs,
  Pagination,
  message,
  Spin
} from 'antd';
import {
  PlusOutlined,
  WalletOutlined,
  RedoOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '../utils/request';
import useStore from '../store/useStore';

const { Title, Text } = Typography;

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  remark: string;
  createdAt: string;
}

const typeMap: any = {
  RECHARGE: { text: '充值', icon: <PlusOutlined />, color: 'green' },
  ORDER_PAY: { text: '订单支付', icon: <ArrowDownOutlined />, color: 'red' },
  ORDER_REFUND: { text: '订单退款', icon: <RedoOutlined />, color: 'blue' },
  EARNING: { text: '收益', icon: <ArrowUpOutlined />, color: 'green' },
  WITHDRAWAL: { text: '提现', icon: <ArrowDownOutlined />, color: 'orange' },
  WITHDRAWAL_FAILED: { text: '提现失败退款', icon: <RedoOutlined />, color: 'blue' }
};

const Wallet: React.FC = () => {
  const { user, fetchProfile } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const pageSize = 20;

  useEffect(() => {
    fetchTransactions();
  }, [activeTab, page]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (activeTab !== 'ALL') params.type = activeTab;

      const data = await request.get<{ list: Transaction[]; total: number }>('/wallet/transactions', { params });
      setTransactions(data.list);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    try {
      await request.post('/wallet/recharge', { amount: rechargeAmount, payMethod: 'mock' });
      message.success(`充值 ¥${rechargeAmount} 成功`);
      setRechargeModalOpen(false);
      fetchProfile();
      fetchTransactions();
    } catch (error) {
      console.error('Recharge failed:', error);
    }
  };

  const tabItems = [
    { key: 'ALL', label: '全部' },
    { key: 'RECHARGE', label: '充值' },
    { key: 'ORDER_PAY', label: '消费' },
    { key: 'ORDER_REFUND', label: '退款' }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card className="stats-card" bodyStyle={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>账户余额</Text>
                <div style={{ fontSize: 32, fontWeight: 'bold', marginTop: 8 }}>
                  ¥{user?.balance?.toFixed(2) || '0.00'}
                </div>
              </div>
              <WalletOutlined style={{ fontSize: 48, opacity: 0.5 }} />
            </div>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" block icon={<PlusOutlined />} onClick={() => setRechargeModalOpen(true)}>
                立即充值
              </Button>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stats-card green" bodyStyle={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>累计充值</Text>
                <div style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8 }}>
                  ¥{transactions.filter(t => t.type === 'RECHARGE').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                </div>
              </div>
              <PlusOutlined style={{ fontSize: 48, opacity: 0.5 }} />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stats-card orange" bodyStyle={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>累计消费</Text>
                <div style={{ fontSize: 28, fontWeight: 'bold', marginTop: 8 }}>
                  ¥{Math.abs(transactions.filter(t => t.type === 'ORDER_PAY').reduce((sum, t) => sum + t.amount, 0)).toFixed(2)}
                </div>
              </div>
              <ArrowDownOutlined style={{ fontSize: 48, opacity: 0.5 }} />
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Text type="secondary">暂无交易记录</Text>
          </div>
        ) : (
          <>
            <List
              dataSource={transactions}
              renderItem={(item) => {
                const typeInfo = typeMap[item.type] || { text: item.type, color: 'default' };
                return (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: `${typeInfo.color}15`,
                            color: typeInfo.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18
                          }}
                        >
                          {typeInfo.icon}
                        </div>
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{typeInfo.text}</span>
                          <span style={{
                            fontSize: 16,
                            fontWeight: 500,
                            color: item.amount >= 0 ? '#52c41a' : '#ff4d4f'
                          }}>
                            {item.amount >= 0 ? '+' : ''}¥{item.amount.toFixed(2)}
                          </span>
                        </div>
                      }
                      description={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text type="secondary">{item.remark}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
            {total > pageSize && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={setPage}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </Card>

      <Modal
        title="账户充值"
        open={rechargeModalOpen}
        onCancel={() => setRechargeModalOpen(false)}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Text type="secondary">充值金额</Text>
          <div style={{ fontSize: 36, fontWeight: 'bold', margin: '16px 0' }}>
            ¥
            <InputNumber
              min={1}
              max={10000}
              value={rechargeAmount}
              onChange={(value) => setRechargeAmount(value || 0)}
              style={{ fontSize: 36, width: 150, textAlign: 'center' }}
              bordered={false}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
            {[100, 500, 1000, 2000, 5000].map(amount => (
              <Button
                key={amount}
                type={rechargeAmount === amount ? 'primary' : 'default'}
                onClick={() => setRechargeAmount(amount)}
              >
                ¥{amount}
              </Button>
            ))}
          </div>
          <div style={{ padding: 12, background: '#f5f7fa', borderRadius: 8, marginBottom: 24 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              温馨提示：此为模拟充值，金额将直接添加到账户余额
            </Text>
          </div>
          <Space>
            <Button onClick={() => setRechargeModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleRecharge} size="large">
              确认充值
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default Wallet;
