import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Avatar,
  Button,
  Space,
  Select,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Pagination,
  Descriptions,
  Typography
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  BankOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/utils/request';

const { Text } = Typography;

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  accountNo: string;
  accountName: string;
  bankName: string;
  status: string;
  remark: string;
  createdAt: string;
  reviewedAt: string;
  user: { id: string; nickname: string; avatar: string };
  reviewer: { id: string; nickname: string };
}

const statusMap: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待审核', color: 'orange' },
  APPROVED: { text: '已通过', color: 'success' },
  REJECTED: { text: '已拒绝', color: 'error' }
};

const WithdrawalAudit: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reviewVisible, setReviewVisible] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [detailVisible, setDetailVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter, page]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const data = await request<{ list: Withdrawal[]; total: number }>({
        method: 'get',
        url: '/admin/withdrawals',
        params
      });
      setWithdrawals(data.list);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchWithdrawals();
  };

  const openReviewModal = (withdrawal: Withdrawal, action: 'APPROVED' | 'REJECTED') => {
    setSelectedWithdrawal(withdrawal);
    setReviewAction(action);
    form.resetFields();
    setReviewVisible(true);
  };

  const handleViewDetail = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setDetailVisible(true);
  };

  const handleReview = async (values: { remark: string }) => {
    if (!selectedWithdrawal) return;

    try {
      await request({
        method: 'put',
        url: `/admin/withdrawal/${selectedWithdrawal.id}/review`,
        data: {
          status: reviewAction,
          remark: values.remark
        }
      });
      message.success(
        reviewAction === 'APPROVED'
          ? '审核通过成功'
          : '审核拒绝成功，金额已退回用户余额'
      );
      setReviewVisible(false);
      fetchWithdrawals();
    } catch (error) {
      message.error('审核失败');
    }
  };

  const columns = [
    {
      title: '用户',
      key: 'user',
      width: 150,
      render: (_: any, record: Withdrawal) => (
        <Space>
          <Avatar src={record.user.avatar} size={40} />
          <span>{record.user.nickname}</span>
        </Space>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <Text strong style={{ color: '#fa541c', fontSize: 16 }}>
          ¥{amount.toFixed(2)}
        </Text>
      )
    },
    {
      title: '收款账户',
      key: 'account',
      width: 180,
      render: (_: any, record: Withdrawal) => (
        <Space direction="vertical" size={0}>
          <Space>
            <BankOutlined />
            {record.bankName || '其他'}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.accountNo}
          </Text>
        </Space>
      )
    },
    {
      title: '账户名',
      dataIndex: 'accountName',
      key: 'accountName',
      width: 120
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      }
    },
    {
      title: '审核时间',
      dataIndex: 'reviewedAt',
      key: 'reviewedAt',
      width: 160,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '审核人',
      key: 'reviewer',
      width: 100,
      render: (_: any, record: Withdrawal) => record.reviewer?.nickname || '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Withdrawal) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button
                size="small"
                type="link"
                icon={<CheckOutlined />}
                onClick={() => openReviewModal(record, 'APPROVED')}
              >
                通过
              </Button>
              <Button
                size="small"
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => openReviewModal(record, 'REJECTED')}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            options={[
              { value: 'ALL', label: '全部状态' },
              { value: 'PENDING', label: '待审核' },
              { value: 'APPROVED', label: '已通过' },
              { value: 'REJECTED', label: '已拒绝' }
            ]}
          />
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={withdrawals}
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
        title={
          <Space>
            {reviewAction === 'APPROVED' ? (
              <CheckOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseOutlined style={{ color: '#ff4d4f' }} />
            )}
            {reviewAction === 'APPROVED' ? '通过提现' : '拒绝提现'}
          </Space>
        }
        open={reviewVisible}
        onCancel={() => setReviewVisible(false)}
        footer={null}
      >
        {selectedWithdrawal && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="用户">
                <Space>
                  <Avatar src={selectedWithdrawal.user.avatar} size={24} />
                  {selectedWithdrawal.user.nickname}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="提现金额">
                <Text strong style={{ color: '#fa541c' }}>
                  ¥{selectedWithdrawal.amount.toFixed(2)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="收款银行">
                {selectedWithdrawal.bankName || '其他'}
              </Descriptions.Item>
              <Descriptions.Item label="账户名">
                {selectedWithdrawal.accountName}
              </Descriptions.Item>
              <Descriptions.Item label="收款账户" span={2}>
                {selectedWithdrawal.accountNo}
              </Descriptions.Item>
            </Descriptions>

            {reviewAction === 'REJECTED' && (
              <div style={{ padding: 12, background: '#fff2f0', borderRadius: 4 }}>
                <Text type="danger" style={{ fontSize: 12 }}>
                  ⚠️ 拒绝后将自动将 ¥{selectedWithdrawal.amount.toFixed(2)} 退回用户余额
                </Text>
              </div>
            )}

            <Form form={form} layout="vertical" onFinish={handleReview}>
              <Form.Item
                name="remark"
                label="审核备注"
                rules={
                  reviewAction === 'REJECTED'
                    ? [{ required: true, message: '请填写拒绝原因' }]
                    : []
                }
              >
                <Input.TextArea
                  rows={4}
                  placeholder={
                    reviewAction === 'REJECTED'
                      ? '请填写拒绝原因'
                      : '请填写审核备注（可选）'
                  }
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setReviewVisible(false)}>
                    取消
                  </Button>
                  <Button
                    type="primary"
                    danger={reviewAction === 'REJECTED'}
                    htmlType="submit"
                  >
                    {reviewAction === 'APPROVED' ? '确认通过' : '确认拒绝'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      <Modal
        title="提现详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {selectedWithdrawal && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="用户" span={2}>
              <Space>
                <Avatar src={selectedWithdrawal.user.avatar} size={48} />
                <span style={{ fontSize: 16 }}>{selectedWithdrawal.user.nickname}</span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="提现金额">
              <Text strong style={{ color: '#fa541c', fontSize: 18 }}>
                ¥{selectedWithdrawal.amount.toFixed(2)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[selectedWithdrawal.status]?.color}>
                {statusMap[selectedWithdrawal.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="收款银行">
              {selectedWithdrawal.bankName || '其他'}
            </Descriptions.Item>
            <Descriptions.Item label="账户名">
              {selectedWithdrawal.accountName}
            </Descriptions.Item>
            <Descriptions.Item label="收款账户" span={2}>
              {selectedWithdrawal.accountNo}
            </Descriptions.Item>
            <Descriptions.Item label="申请时间" span={2}>
              {dayjs(selectedWithdrawal.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {selectedWithdrawal.remark && (
              <Descriptions.Item label="审核备注" span={2}>
                {selectedWithdrawal.remark}
              </Descriptions.Item>
            )}
            {selectedWithdrawal.status !== 'PENDING' && (
              <>
                <Descriptions.Item label="审核人">
                  {selectedWithdrawal.reviewer?.nickname || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="审核时间">
                  {selectedWithdrawal.reviewedAt
                    ? dayjs(selectedWithdrawal.reviewedAt).format('YYYY-MM-DD HH:mm:ss')
                    : '-'}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
};

export default WithdrawalAudit;
