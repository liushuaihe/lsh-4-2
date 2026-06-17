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
  Image,
  Descriptions
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/utils/request';

interface Certification {
  id: string;
  userId: string;
  type: string;
  evidence: string;
  remark: string;
  status: string;
  createdAt: string;
  reviewedAt: string;
  user: { id: string; nickname: string; avatar: string };
  reviewer: { id: string; nickname: string };
}

const typeMap: Record<string, { text: string; color: string }> = {
  SKILL: { text: '技能认证', color: 'blue' },
  VOICE: { text: '语音认证', color: 'purple' }
};

const statusMap: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待审核', color: 'orange' },
  APPROVED: { text: '已通过', color: 'success' },
  REJECTED: { text: '已拒绝', color: 'error' }
};

const CertificationAudit: React.FC = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [reviewVisible, setReviewVisible] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [detailVisible, setDetailVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCertifications();
  }, [statusFilter, typeFilter, page]);

  const fetchCertifications = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.type = typeFilter;

      const data = await request<{ list: Certification[]; total: number }>({
        method: 'get',
        url: '/certifications',
        params
      });
      setCertifications(data.list);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchCertifications();
  };

  const openReviewModal = (cert: Certification, action: 'APPROVED' | 'REJECTED') => {
    setSelectedCert(cert);
    setReviewAction(action);
    form.resetFields();
    setReviewVisible(true);
  };

  const handleViewDetail = (cert: Certification) => {
    setSelectedCert(cert);
    setDetailVisible(true);
  };

  const handleReview = async (values: { remark: string }) => {
    if (!selectedCert) return;

    try {
      await request({
        method: 'put',
        url: `/certification/${selectedCert.id}/review`,
        data: {
          status: reviewAction,
          remark: values.remark
        }
      });
      message.success(reviewAction === 'APPROVED' ? '审核通过成功' : '审核拒绝成功');
      setReviewVisible(false);
      fetchCertifications();
    } catch (error) {
      message.error('审核失败');
    }
  };

  const columns = [
    {
      title: '用户',
      key: 'user',
      width: 150,
      render: (_: any, record: Certification) => (
        <Space>
          <Avatar src={record.user.avatar} size={40} />
          <span>{record.user.nickname}</span>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const info = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      }
    },
    {
      title: '证明材料',
      dataIndex: 'evidence',
      key: 'evidence',
      width: 120,
      render: (evidence: string) => (
        evidence ? (
          <Image
            width={60}
            height={60}
            src={evidence}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : '-'
      )
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 180,
      ellipsis: true
    },
    {
      title: '提交时间',
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
      render: (_: any, record: Certification) => record.reviewer?.nickname || '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Certification) => (
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
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 150 }}
            options={[
              { value: 'ALL', label: '全部类型' },
              { value: 'SKILL', label: '技能认证' },
              { value: 'VOICE', label: '语音认证' }
            ]}
          />
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={certifications}
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
            {reviewAction === 'APPROVED' ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CloseOutlined style={{ color: '#ff4d4f' }} />}
            {reviewAction === 'APPROVED' ? '通过认证' : '拒绝认证'}
          </Space>
        }
        open={reviewVisible}
        onCancel={() => setReviewVisible(false)}
        footer={null}
      >
        {selectedCert && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="用户">
                <Space>
                  <Avatar src={selectedCert.user.avatar} size={24} />
                  {selectedCert.user.nickname}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="认证类型">
                <Tag color={typeMap[selectedCert.type]?.color}>
                  {typeMap[selectedCert.type]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="证明材料" span={2}>
                {selectedCert.evidence && (
                  <Image
                    width={120}
                    height={120}
                    src={selectedCert.evidence}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                  />
                )}
              </Descriptions.Item>
              <Descriptions.Item label="用户备注" span={2}>
                {selectedCert.remark || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical" onFinish={handleReview}>
              <Form.Item
                name="remark"
                label="审核备注"
                rules={reviewAction === 'REJECTED' ? [{ required: true, message: '请填写拒绝原因' }] : []}
              >
                <Input.TextArea
                  rows={4}
                  placeholder={reviewAction === 'REJECTED' ? '请填写拒绝原因' : '请填写审核备注（可选）'}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setReviewVisible(false)}>
                    取消
                  </Button>
                  <Button
                    type={reviewAction === 'APPROVED' ? 'primary' : 'primary'}
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
        title="认证详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {selectedCert && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="用户" span={2}>
              <Space>
                <Avatar src={selectedCert.user.avatar} size={48} />
                <span style={{ fontSize: 16 }}>{selectedCert.user.nickname}</span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="认证类型">
              <Tag color={typeMap[selectedCert.type]?.color}>
                {typeMap[selectedCert.type]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[selectedCert.status]?.color}>
                {statusMap[selectedCert.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="证明材料" span={2}>
              {selectedCert.evidence && (
                <Image
                  width={200}
                  src={selectedCert.evidence}
                  style={{ borderRadius: 4 }}
                />
              )}
            </Descriptions.Item>
            <Descriptions.Item label="用户备注" span={2}>
              {selectedCert.remark || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="提交时间" span={2}>
              {dayjs(selectedCert.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {selectedCert.status !== 'PENDING' && (
              <>
                <Descriptions.Item label="审核人">
                  {selectedCert.reviewer?.nickname || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="审核时间">
                  {selectedCert.reviewedAt
                    ? dayjs(selectedCert.reviewedAt).format('YYYY-MM-DD HH:mm:ss')
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

export default CertificationAudit;
