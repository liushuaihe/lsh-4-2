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
  Select,
  message,
  Upload,
  Descriptions,
  Row,
  Col
} from 'antd';
import {
  SafetyCertificateOutlined,
  PlusOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/utils/request';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Certification {
  id: string;
  type: string;
  evidence: string;
  remark: string;
  status: string;
  reviewRemark: string;
  createdAt: string;
  reviewedAt: string;
  reviewer: { id: string; nickname: string };
}

const typeMap: any = {
  SKILL: { text: '技能认证', color: 'blue', icon: '🎮' },
  VOICE: { text: '语音认证', color: 'purple', icon: '🎤' }
};

const statusMap: any = {
  PENDING: { text: '待审核', color: 'orange', icon: <ClockCircleOutlined /> },
  APPROVED: { text: '已通过', color: 'green', icon: <CheckCircleOutlined /> },
  REJECTED: { text: '已拒绝', color: 'red', icon: <CloseCircleOutlined /> }
};

const Certification: React.FC = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    setLoading(true);
    try {
      const data = await request.get('/certifications/my');
      setCertifications(data);
    } catch (error) {
      console.error('Failed to fetch certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!evidenceUrl) {
      message.error('请上传证明材料');
      return;
    }

    setActionLoading(true);
    try {
      await request.post('/certifications', {
        ...values,
        evidence: evidenceUrl
      });
      message.success('认证申请已提交');
      setModalOpen(false);
      setEvidenceUrl('');
      form.resetFields();
      fetchCertifications();
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const uploadProps = {
    name: 'file',
    action: '/api/upload',
    headers: {
      authorization: `Bearer ${localStorage.getItem('token')}`
    },
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/') || file.type.startsWith('audio/');
      if (!isImage) {
        message.error('只能上传图片或音频文件!');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件不能大于10MB!');
        return false;
      }
      return true;
    },
    onChange(info: any) {
      if (info.file.status === 'done') {
        message.success('上传成功');
        if (info.file.response?.code === 200) {
          setEvidenceUrl(info.file.response.data.url);
        }
      } else if (info.file.status === 'error') {
        message.error('上传失败');
      }
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
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              <SafetyCertificateOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              认证申请
            </Title>
            <Text type="secondary">申请技能认证和语音认证，提升您的可信度</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            提交认证
          </Button>
        </div>

        {certifications.length === 0 ? (
          <Empty description="暂无认证记录，点击上方按钮提交认证申请" />
        ) : (
          <List
            dataSource={certifications}
            renderItem={(cert) => {
              const typeInfo = typeMap[cert.type] || { text: cert.type, color: 'default' };
              const statusInfo = statusMap[cert.status] || { text: cert.status, color: 'default' };

              return (
                <List.Item key={cert.id}>
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: `${typeInfo.color}15`,
                          color: typeInfo.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 24
                        }}
                      >
                        {typeInfo.icon}
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 16, fontWeight: 500 }}>{typeInfo.text}</span>
                        <Tag icon={statusInfo.icon} color={statusInfo.color}>
                          {statusInfo.text}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <Descriptions column={2} size="small" style={{ marginTop: 8 }}>
                          <Descriptions.Item label="提交时间">
                            {dayjs(cert.createdAt).format('YYYY-MM-DD HH:mm')}
                          </Descriptions.Item>
                          {cert.reviewedAt && (
                            <Descriptions.Item label="审核时间">
                              {dayjs(cert.reviewedAt).format('YYYY-MM-DD HH:mm')}
                            </Descriptions.Item>
                          )}
                          <Descriptions.Item label="备注" span={2}>
                            {cert.remark || '-'}
                          </Descriptions.Item>
                          {cert.reviewRemark && (
                            <Descriptions.Item label="审核意见" span={2}>
                              {cert.reviewRemark}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                        {cert.evidence && (
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary">证明材料：</Text>
                            {cert.type === 'VOICE' ? (
                              <audio controls src={cert.evidence} style={{ maxWidth: 300, marginLeft: 8 }} />
                            ) : (
                              <img
                                src={cert.evidence}
                                alt="证明材料"
                                style={{ maxWidth: 200, maxHeight: 150, borderRadius: 4, marginLeft: 8 }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>

      <Card title="认证说明">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div style={{ padding: 16, background: '#e6f4ff', borderRadius: 8 }}>
              <Title level={5} style={{ color: '#1677ff', marginBottom: 12 }}>
                🎮 技能认证
              </Title>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>上传游戏段位截图</li>
                <li style={{ marginBottom: 8 }}>提供游戏账号信息</li>
                <li style={{ marginBottom: 8 }}>工作人员审核通过后生效</li>
                <li>认证后技能将显示"已认证"标识</li>
              </ul>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ padding: 16, background: '#f9f0ff', borderRadius: 8 }}>
              <Title level={5} style={{ color: '#722ed1', marginBottom: 12 }}>
                🎤 语音认证
              </Title>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>上传一段30秒以上的语音录音</li>
                <li style={{ marginBottom: 8 }}>语音内容需清晰可辨</li>
                <li style={{ marginBottom: 8 }}>工作人员审核通过后生效</li>
                <li>认证后个人主页将显示语音标识</li>
              </ul>
            </div>
          </Col>
        </Row>
      </Card>

      <Modal
        title="提交认证申请"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEvidenceUrl('');
        }}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="type"
            label="认证类型"
            rules={[{ required: true, message: '请选择认证类型' }]}
          >
            <Select placeholder="请选择认证类型">
              <Option value="SKILL">🎮 技能认证</Option>
              <Option value="VOICE">🎤 语音认证</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="证明材料"
            name="evidence"
            rules={[{ required: true, message: '请上传证明材料' }]}
          >
            <div>
              {evidenceUrl ? (
                <div style={{ marginBottom: 12 }}>
                  <img
                    src={evidenceUrl}
                    alt="预览"
                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }}
                  />
                  <Button
                    type="link"
                    danger
                    size="small"
                    onClick={() => setEvidenceUrl('')}
                    style={{ display: 'block', marginTop: 8 }}
                  >
                    重新上传
                  </Button>
                </div>
              ) : (
                <Upload {...uploadProps} showUploadList={false} maxCount={1}>
                  <Button icon={<UploadOutlined />}>点击上传证明材料</Button>
                </Upload>
              )}
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                支持图片和音频格式，大小不超过10MB
              </Text>
            </div>
          </Form.Item>
          <Form.Item
            name="remark"
            label="备注说明"
          >
            <TextArea rows={3} placeholder="请输入备注说明（选填）" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setModalOpen(false);
                setEvidenceUrl('');
              }}>取消</Button>
              <Button type="primary" htmlType="submit" loading={actionLoading}>
                提交申请
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Certification;
