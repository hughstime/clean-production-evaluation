import { useEffect } from 'react';
import { Button, Space, message, Card } from 'antd';
import { useStore } from '../store';
import { mockEnterpriseInfo, mockIndicatorInputs, fillMockData } from '../utils/mockData';
import { ArrowRightOutlined } from '@ant-design/icons';

const TestPage = () => {
  const {
    setStep,
    setEnterpriseInfo,
    updateIndicatorInput,
    calculateEvaluation,
    setEvaluationResult
  } = useStore();

  // 自动填充测试数据
  useEffect(() => {
    // 延迟一下确保组件加载完成
    const timer = setTimeout(() => {
      message.info('正在自动填充测试数据...');

      // 填充企业信息
      setEnterpriseInfo(mockEnterpriseInfo);

      // 填充指标数据
      Object.entries(mockIndicatorInputs).forEach(([indicatorId, input]) => {
        updateIndicatorInput(indicatorId, input);
      });

      message.success('测试数据填充完成！');
    }, 1000);

    return () => clearTimeout(timer);
  }, [setEnterpriseInfo, updateIndicatorInput]);

  // 快速跳转函数
  const goToStep = (step: number) => {
    setStep(step as any);
    message.info(`已跳转到第${step}步`);
  };

  // 自动评价并跳转
  const autoEvaluate = () => {
    const result = calculateEvaluation();
    if (result) {
      setEvaluationResult(result);
      setStep(3);
      message.success('评价完成，已跳转到结果页面');
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <Card title="测试工具" style={{ marginBottom: 20 }}>
        <p>此页面用于快速测试系统的各个功能。</p>
        <p>系统已自动填充了模拟数据，您可以：</p>
      </Card>

      <Space direction="vertical" style={{ width: '100%' }}>
        <Card>
          <h3>步骤导航</h3>
          <Space wrap>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => goToStep(1)}
            >
              去企业信息页
            </Button>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => goToStep(2)}
            >
              去指标填报页
            </Button>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={autoEvaluate}
            >
              自动评价并看结果
            </Button>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => goToStep(4)}
            >
              查看报告页面
            </Button>
          </Space>
        </Card>

        <Card>
          <h3>数据操作</h3>
          <Space wrap>
            <Button onClick={fillMockData}>
              重新填充测试数据
            </Button>
            <Button
              type="dashed"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              清除所有数据
            </Button>
          </Space>
        </Card>

        <Card>
          <h3>测试说明</h3>
          <ul>
            <li>模拟数据代表一个表现良好的企业，预计评价结果为Ⅰ级</li>
            <li>所有指标已填写完毕，可以直接进行评价</li>
            <li>测试完成后请删除测试文件</li>
          </ul>
        </Card>
      </Space>
    </div>
  );
};

export default TestPage;