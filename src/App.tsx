import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { App as AntApp } from 'antd';
import Step1 from './pages/Step1';
import Step2 from './pages/Step2';
import Step3 from './pages/Step3';
import Step4 from './pages/Step4';
import { useStore } from './store';
import indicatorData from './data/indicators.json';
import './App.css';

// Lucide风格SVG图标
const IconBuilding = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
  </svg>
);
const IconClipboard = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
  </svg>
);
const IconBarChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>
  </svg>
);
const IconFileText = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
  </svg>
);
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const STEPS = [
  { key: 1, title: '企业信息', subtitle: '填写基本信息', icon: <IconBuilding /> },
  { key: 2, title: '指标填报', subtitle: '录入评价数据', icon: <IconClipboard /> },
  { key: 3, title: '评价分析', subtitle: '计算评价指数', icon: <IconBarChart /> },
  { key: 4, title: '结果报告', subtitle: '查看评价结果', icon: <IconFileText /> },
];

const indicatorCount = indicatorData.categories.reduce((total, category) => total + category.indicators.length, 0);

function AppContent() {
  const { currentStep } = useStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1 />;
      case 2: return <Step2 />;
      case 3: return <Step3 />;
      case 4: return <Step4 />;
      default: return <Step1 />;
    }
  };

  return (
    <div className="app-container">
      {/* 头部 Header - 深海军蓝 */}
      <header className="app-header">
        <div className="header-bg-pattern" />
        <div className="header-content">
          <div className="header-left">
            <div className="header-badge">
              <IconShield /> T/ZAEPI XXX—XXXX
            </div>
            <h1 className="header-main-title">危险废物焚烧处置行业</h1>
            <h2 className="header-sub-title">清洁生产评价系统</h2>
            <p className="header-desc">依据团体标准，对危险废物焚烧处置企业清洁生产水平进行定量评价与分级判定</p>
          </div>
          <div className="header-feature-cards">
            <div className="feature-card">
              <IconClipboard />
              <div className="feature-card-title">指标录入</div>
              <div className="feature-card-sub">{indicatorCount}项指标</div>
            </div>
            <div className="feature-card">
              <IconBarChart />
              <div className="feature-card-title">智能分析</div>
              <div className="feature-card-sub">三级评价</div>
            </div>
            <div className="feature-card">
              <IconFileText />
              <div className="feature-card-title">报告输出</div>
              <div className="feature-card-sub">一键打印</div>
            </div>
          </div>
        </div>
      </header>

      {/* 4步进度条 */}
      <div className="stepper-container">
        <div className="stepper">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === step.key;
            const isCompleted = currentStep > step.key;
            return (
              <div key={step.key} className="stepper-item-wrapper">
                <div className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                  <div className="stepper-icon">
                    {isCompleted ? <IconCheck /> : step.icon}
                  </div>
                  <div className="stepper-text">
                    <div className="stepper-title">{step.title}</div>
                    <div className="stepper-subtitle">{step.subtitle}</div>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`stepper-connector ${currentStep > step.key ? 'completed' : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 主内容 */}
      <main className="app-content">
        {renderStep()}
      </main>

      {/* 页脚 */}
      <footer className="app-footer">
        <p>浙江省环保产业协会 · 危险废物焚烧处置行业清洁生产评价指标体系</p>
        <p>依据 GB/T 43329—2023《清洁生产评价指标体系编制通则》编制</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#0D2339',
          borderRadius: 6,
          fontFamily: "'Noto Sans SC', 'Microsoft YaHei', -apple-system, sans-serif",
        },
      }}
    >
      <AntApp>
        <AppContent />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
