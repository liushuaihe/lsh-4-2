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
  Spin,
  Form,
  Input,
  Descriptions
} from 'antd';
import {
  WalletOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusOutlined,
  RedoOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/utils/request';
import useStore from '@/store/useStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  remark: string;
  createdAt: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  account: string;
  accountName: string;
  remark: string;
  createdAt: string;
  processedAt: string;
}

const typeMap: any = {
  RECHARGE: { text: '充值', icon: <PlusOutlined />, color: 'green' },
  EARNING: { text: '收益', icon: <ArrowUpOutlined />, color: 'green' },
  WITHDRAWAL: { text: '提现', icon: <ArrowDownOutlined />, color: 'orange' },
  WITHDRAWAL_FAILED: { text: '提现失败退款', icon: <RedoOutlined />, color: 'blue' }
};

const withdrawalStatusMap: any = {
  PENDING: { text: '待处理', color: 'orange', icon: <ClockCircleOutlined /> },
  APPROVED: { text: '已打款', color: 'green', icon: <CheckCircleOutlined /> },
  REJECTED: { text: '已拒绝', color: 'red', icon: <CloseCircleOutlined /> }
};

const Wallet: React.FC = () => {
  const { user, fetchProfile } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transTotal, setTransTotal] = useState(0);
  const [withTotal, setWithTotal] = useState(0);
  const [transPage, setTransPage] = useState(1);
  const [withPage, setWithPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [activeSubTab, setActiveSubTab] = useState('transactions');
  const [form] = Form.useForm();
  const pageSize = 20;

  useEffect(() => {
    fetchData();
  }, [activeTab, transPage, withPage, activeSubTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'transactions') {
        const params: any = { page: transPage, pageSize };
        if (activeTab !== 'ALL') params.type = activeTab;

        const data = await request.get('/wallet/transactions', { params });
        setTransactions(data.list);
        setTransTotal(data.total);
      } else {
        const data = await request.get('/wallet/withdrawals', { params: { page: withPage, pageSize } });
        setWithdrawals(data.list);
        setWithTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (values: any) => {
    setActionLoading(true);
    try {
      await request.post('/wallet/withdraw', values);
      message.success('提现申请已提交');
      setWithdrawModalOpen(false);
      form.resetFields();
      fetchProfile();
      fetchData();
    } catch (error) {
      console.error('Withdraw failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const tabItems = [
    { key: 'ALL', label: '全部' },
    { key: 'RECHARGE', label: '充值' },
    { key: 'EARNING', label: '收益' },
    { key: 'WITHDRAWAL', label: '提现' }
  ];

  const subTabItems = [
    { key: 'transactions', label: '交易记录' },
    { key: 'withdrawals', label: '提现记录' }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card className="stats-card" bodyStyle={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>账户余额</Text>
                <div style={{ fontSize: 48, fontWeight: 'bold', marginTop: 8, color: '#fff' }}>
                  ¥{user?.balance?.toFixed(2) || '0.00'}
                </div>
              </div>
              <WalletOutlined style={{ fontSize: 64, opacity: 0.5, color: '#fff' }} />
            </div>
            <div style={{ marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                icon={<ArrowDownOutlined />}
                onClick={() => setWithdrawModalOpen(true)}
                disabled={!user?.balance || user.balance < 10}
                style={{ marginRight: 12 }}
              >
                申请提现
              </Button>
              <Button
                type="default"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => message.info('请前往老板端进行充值')}
              >
                前往充值
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          activeKey={activeSubTab}
          onChange={setActiveSubTab}
          items={subTabItems}
        />

        {activeSubTab === 'transactions' && (
          <>
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
                {transTotal > pageSize && (
                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Pagination
                      current={transPage}
                      pageSize={pageSize}
                      total={transTotal}
                      onChange={setTransPage}
                      showSizeChanger={false}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeSubTab === 'withdrawals' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 50 }}>
                <Spin size="large" />
              </div>
            ) : withdrawals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 50 }}>
                <Text type="secondary">暂无提现记录</Text>
              </div>
            ) : (
              <>
                <List
                  dataSource={withdrawals}
                  renderItem={(item) => {
                    const statusInfo = withdrawalStatusMap[item.status] || { text: item.status, color: 'default' };
                    return (
                      <List.Item key={item.id}>
                        <List.Item.Meta
                          avatar={
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: `${statusInfo.color}15`,
                                color: statusInfo.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 18
                              }}
                            >
                              {statusInfo.icon}
                            </div>
                          }
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 16, fontWeight: 500 }}>提现申请</span>
                              <Tag icon={statusInfo.icon} color={statusInfo.color}>
                                {statusInfo.text}
                              </Tag>
                            </div>
                          }
                          description={
                            <div>
                              <Descriptions column={2} size="small" style={{ marginTop: 8 }}>
                                <Descriptions.Item label="提现金额">
                                  <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
                                    -¥{item.amount.toFixed(2)}
                                  </span>
                                </Descriptions.Item>
                                <Descriptions.Item label="申请时间">
                                  {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                                </Descriptions.Item>
                                <Descriptions.Item label="收款账户">
                                  {item.accountName} - {item.account}
                                </Descriptions.Item>
                                {item.processedAt && (
                                  <Descriptions.Item label="处理时间">
                                    {dayjs(item.processedAt).format('YYYY-MM-DD HH:mm')}
                                  </Descriptions.Item>
                                )}
                              </Descriptions>
                              {item.remark && (
                                <div style={{ marginTop: 8 }}>
                                  <Text type="secondary">备注：{item.remark}</Text>
                                </div>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
                {withTotal > pageSize && (
                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Pagination
                      current={withPage}
                      pageSize={pageSize}
                      total={withTotal}
                      onChange={setWithPage}
                      showSizeChanger={false}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Card>

      <Modal
        title="申请提现"
        open={withdrawModalOpen}
        onCancel={() => setWithdrawModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={handleWithdraw} layout="vertical">
          <div style={{ padding: 16, background: '#f5f7fa', borderRadius: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">可提现金额</Text>
              <Text strong style={{ fontSize: 24, color: '#ff4d4f' }}>
                ¥{user?.balance?.toFixed(2) || '0.00'}
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              最低提现金额：¥10.00，最高提现金额：¥10000.00
            </Text>
          </div>
          <Form.Item
            name="amount"
            label="提现金额"
            rules={[
              { required: true, message: '请输入提现金额' },
              { type: 'number', min: 10, message: '最低提现10元' },
              { type: 'number', max: 10000, message: '最高提现10000元' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || value <= (user?.balance || 0)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('提现金额不能超过账户余额'));
                }
              })
            ]}
          >
            <InputNumber
              min={10}
              max={10000}
              placeholder="请输入提现金额"
              style={{ width: '100%' }}
              addonBefore="¥"
              precision={2}
            />
          </Form.Item>
          <Form.Item
            name="account"
            label="收款账户"
            rules={[
              { required: true, message: '请输入收款账户' },
              { min: 10, max: 30, message: '请输入有效的收款账户' }
            ]}
          >
            <Input placeholder="请输入银行卡号/支付宝账号/微信账号" />
          </Form.Item>
          <Form.Item
            name="accountName"
            label="账户姓名"
            rules={[{ required: true, message: '请输入账户姓名' }]}
          >
            <Input placeholder="请输入收款人姓名" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setWithdrawModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={actionLoading}>
                确认提现
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Wallet;
