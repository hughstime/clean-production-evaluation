import { useState, useEffect } from 'react';
import { App as AntApp, Form, Input } from 'antd';
import { useStore } from '../store';
import type { EnterpriseInfo } from '../types';

const Step1 = () => {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const { enterpriseInfo, setEnterpriseInfo, setStep } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (enterpriseInfo) {
      form.setFieldsValue(enterpriseInfo);
    } else {
      form.setFieldsValue({ evaluationDate: new Date().toISOString().slice(0, 10) });
    }
  }, [enterpriseInfo, form]);

  const handleNext = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const formattedValues: EnterpriseInfo = {
        ...values,
        evaluationDate: values.evaluationDate || new Date().toISOString().slice(0, 10),
      };
      setEnterpriseInfo(formattedValues);
      setStep(2);
      message.success('企业信息保存成功');
    } catch (error) {
      const validationError = error as { errorFields?: { name: (string | number)[] }[] };
      const firstError = validationError.errorFields?.[0];
      if (firstError) {
        form.scrollToField(firstError.name, { block: 'center' });
        message.warning('请先补全必填信息');
      } else {
        console.error('Failed to save enterprise info:', error);
        message.error('保存企业信息失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 图标组件
  const Ic = ({ d }: { d: string }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
      <path d={d} />
    </svg>
  );

  const Label = ({ icon, text, required = false }: { icon: React.ReactNode; text: string; required?: boolean }) => (
    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 500, color: '#0D2339' }}>
      {icon}
      {text}
      {required && <span className="field-required">*</span>}
    </span>
  );

  return (
    <div className="form-card">
      <div className="form-section">
        <h2 className="form-section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CA933E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
          </svg>
          企业基本信息
        </h2>
        <p className="form-section-desc">请填写被评价企业的基本信息，带 * 为必填项</p>
      </div>

      <Form form={form} layout="vertical" requiredMark={false}>
        {/* 企业名称 — 全宽 */}
        <Form.Item
          name="name"
          label={<Label icon={<Ic d="M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />} text="企业名称" required />}
          rules={[{ required: true, message: '请输入企业名称' }]}
        >
          <Input placeholder="请输入企业全称" size="large" />
        </Form.Item>

        {/* 企业地址 — 全宽 */}
        <Form.Item
          name="address"
          label={<Label icon={<Ic d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />} text="企业地址" required />}
          rules={[{ required: true, message: '请输入企业地址' }]}
        >
          <Input placeholder="请输入详细地址" size="large" />
        </Form.Item>

        {/* 联系人 + 联系电话 */}
        <div className="form-row">
          <div className="form-col">
            <Form.Item
              name="contactPerson"
              label={<Label icon={<Ic d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />} text="联系人" required />}
              rules={[{ required: true, message: '请输入联系人' }]}
            >
              <Input placeholder="请输入联系人姓名" size="large" />
            </Form.Item>
          </div>
          <div className="form-col">
            <Form.Item
              name="contactPhone"
              label={<Label icon={<Ic d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />} text="联系电话" required />}
              rules={[{ required: true, message: '请输入联系电话' }]}
            >
              <Input placeholder="请输入联系电话" size="large" />
            </Form.Item>
          </div>
        </div>

        {/* 统计报告期 + 焚烧处置能力 */}
        <div className="form-row">
          <div className="form-col">
            <Form.Item
              name="reportPeriod"
              label={<Label icon={<Ic d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />} text="统计报告期" required />}
              rules={[{ required: true, message: '请输入统计报告期' }]}
            >
              <Input placeholder="如：2025年1月-2025年12月" size="large" />
            </Form.Item>
          </div>
          <div className="form-col">
            <Form.Item
              name="disposalCapacity"
              label={<Label icon={<Ic d="M3 3v18h18" />} text="焚烧处置能力" />}
            >
              <Input placeholder="如：50000吨/年" size="large" />
            </Form.Item>
          </div>
        </div>

        {/* 处置废物类别 + 评价日期 */}
        <div className="form-row">
          <div className="form-col">
            <Form.Item
              name="wasteCategory"
              label={<Label icon={<Ic d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />} text="处置废物类别" />}
            >
              <Input placeholder="如：HW01、HW04、HW06等" size="large" />
            </Form.Item>
          </div>
          <div className="form-col">
            <Form.Item
              name="evaluationDate"
              label={<Label icon={<Ic d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />} text="评价日期" required />}
              rules={[{ required: true, message: '请输入评价日期' }]}
            >
              <Input type="date" size="large" />
            </Form.Item>
          </div>
        </div>
      </Form>

      <div className="nav-buttons">
        <div />
        <div className="nav-buttons-right">
          <button className="btn btn-primary btn-lg" onClick={handleNext} disabled={loading}>
            下一步：指标填报 →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step1;
