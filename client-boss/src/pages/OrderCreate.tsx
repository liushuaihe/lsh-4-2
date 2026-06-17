import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Descriptions,
  Radio,
  message,
  Modal,
  Spin
} from 'antd';
import {
  PayCircleOutlined,
  WechatOutlined,
  AlipayOutlined,
  WalletOutlined
} from '@ant-design/icons';
import request from '../utils/request';
import useStore from '../store/useStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

const OrderCreate: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, fetchProfile } = useStore();
  const [loading, setLoading] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  const state: any = location.state;

  if (!state) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Text type="secondary">请先选择大神</Text>
        <Button type="primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
          返回首页
        </Button>
      </div>
    );
  }

  const { proId, gameId, skillId, pricePerHour, proName, gameName } = state;

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const data = await request.post('/orders', {
        proId,
        gameId,
        skillId,
        duration: values.duration,
        requirement: values.requirement
      });
      setOrderData(data);
      setPayModalOpen(true);
    } catch (error) {
      console.error('Create order failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!orderData) return;

    setLoading(true);
    try {
      await request.post(`/orders/${orderData.id}/pay`, { payMethod: 'balance' });
      message.success('支付成功');
      setPayModalOpen(false);
      fetchProfile();
      navigate(`/order/${orderData.id}`);
    } catch (error) {
      console.error('Pay failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async (amount: number) => {
    try {
      await request.post('/wallet/recharge', { amount, payMethod: 'mock' });
      message.success(`模拟充值 ¥${amount} 成功`);
      fetchProfile();
    } catch (error) {
      console.error('Recharge failed:', error);
    }
  };

  const [form] = Form.useForm();
  const duration = Form.useWatch('duration', form) || 1;
  const totalAmount = duration * pricePerHour;
  const balanceInsufficient = (user?.balance || 0) < totalAmount;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 24 }}>确认订单</Title>
        <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
          <Descriptions.Item label="大神">{proName}</Descriptions.Item>
          <Descriptions.Item label="游戏">{gameName}</Descriptions.Item>
          <Descriptions.Item label="单价">¥{pricePerHour}/小时</Descriptions.Item>
          <Descriptions.Item label="账户余额">
            <Text strong style={{ color: user?.balance! < totalAmount ? '#ff4d4f' : '#52c41a' }}>
              ¥{user?.balance?.toFixed(2)}
            </Text>
            {balanceInsufficient && (
              <Button type="link" size="small" onClick={() => handleRecharge(500)}>
                充值
              </Button>
            )}
          </Descriptions.Item>
        </Descriptions>

        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="duration"
            label="服务时长"
            initialValue={1}
            rules={[{ required: true, message: '请选择服务时长' }]}
          >
            <Radio.Group>
              <Radio.Button value={1}>1小时</Radio.Button>
              <Radio.Button value={2}>2小时</Radio.Button>
              <Radio.Button value={3}>3小时</Radio.Button>
              <Radio.Button value={5}>5小时</Radio.Button>
              <Radio.Button value={10}>10小时</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="requirement" label="服务要求">
            <TextArea rows={4} placeholder="请描述您的具体要求，如：需要什么位置、什么段位等..." />
          </Form.Item>

          <div style={{ padding: 24, background: '#f5f7fa', borderRadius: 8, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">订单金额</Text>
              <div>
                <span style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                  ¥{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Text type="secondary">服务时长</Text>
              <Text>{duration} 小时</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Text type="secondary">单价</Text>
              <Text>¥{pricePerHour} /小时</Text>
            </div>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              <PayCircleOutlined /> 提交订单
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="订单支付"
        open={payModalOpen}
        onCancel={() => setPayModalOpen(false)}
        footer={null}
        width={480}
      >
        {orderData && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#999', marginBottom: 8 }}>订单号：{orderData.orderNo}</div>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>支付金额</div>
              <div style={{ fontSize: 36, fontWeight: 'bold', color: '#ff4d4f' }}>
                ¥{orderData.amount.toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <Text strong>选择支付方式</Text>
              <div style={{ marginTop: 16, padding: 16, border: '2px solid #1677ff', borderRadius: 8, background: '#e6f4ff' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <WalletOutlined style={{ fontSize: 24, color: '#1677ff', marginRight: 12 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>余额支付</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      当前余额：¥{user?.balance?.toFixed(2)}
                      {balanceInsufficient && (
                        <span style={{ color: '#ff4d4f', marginLeft: 8 }}>余额不足</span>
                      )}
                    </div>
                  </div>
                  <div style={{ color: '#1677ff', fontWeight: 500 }}>推荐</div>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, padding: 12, border: '1px solid #f0f0f0', borderRadius: 8, textAlign: 'center', opacity: 0.6 }}>
                  <WechatOutlined style={{ fontSize: 24, color: '#07c160' }} />
                  <div style={{ fontSize: 12, marginTop: 4 }}>微信支付</div>
                </div>
                <div style={{ flex: 1, padding: 12, border: '1px solid #f0f0f0', borderRadius: 8, textAlign: 'center', opacity: 0.6 }}>
                  <AlipayOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                  <div style={{ fontSize: 12, marginTop: 4 }}>支付宝</div>
                </div>
              </div>
            </div>

            {balanceInsufficient && (
              <div style={{ marginBottom: 16, padding: 12, background: '#fff2f0', borderRadius: 8 }}>
                <Text type="danger">余额不足，请先充值</Text>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <Button size="small" onClick={() => handleRecharge(100)}>充值¥100</Button>
                  <Button size="small" onClick={() => handleRecharge(500)}>充值¥500</Button>
                  <Button size="small" onClick={() => handleRecharge(1000)}>充值¥1000</Button>
                </div>
              </div>
            )}

            <Button
              type="primary"
              block
              size="large"
              loading={loading}
              disabled={balanceInsufficient}
              onClick={handlePay}
            >
              立即支付 ¥{orderData.amount.toFixed(2)}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderCreate;
