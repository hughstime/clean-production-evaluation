import { useState } from 'react';
import { App as AntApp, Checkbox } from 'antd';
import { useStore } from '../store';
import indicatorData from '../data/indicators.json';

// Tab图标（每个类别的小图标）
const TAB_ICONS: Record<string, string> = {
  '生产工艺及装备': 'M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z',
  '能源消耗': 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  '水资源消耗': 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
  '原辅料资源消耗': 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  '污染物产生与排放': 'M8 2h8l4 10H4L8 2zM12 12v10M5 12l-3 10h20l-3-10',
  '温室气体排放': 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z',
  '清洁生产管理': 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',
  '资源循环利用': 'M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2',
};

// 定性指标
const QualitativeIndicator = ({ indicator, value, onChange, isApplicable, onApplicableChange }: {
  indicator: any; value: any; onChange: (v: number) => void; isApplicable: boolean; onApplicableChange: (c: boolean) => void;
}) => {
  const levels = [
    { key: 1, label: 'Ⅰ级', desc: typeof indicator.benchmarks.level1 === 'object' ? indicator.benchmarks.level1.description : indicator.benchmarks.level1 },
    { key: 2, label: 'Ⅱ级', desc: typeof indicator.benchmarks.level2 === 'object' ? indicator.benchmarks.level2.description : indicator.benchmarks.level2 },
    { key: 3, label: 'Ⅲ级', desc: typeof indicator.benchmarks.level3 === 'object' ? indicator.benchmarks.level3.description : indicator.benchmarks.level3 },
  ];

  return (
    <div className="indicator-card">
      <div className="indicator-card-header">
        <div>
          <div className="indicator-name">{indicator.name}
            {indicator.isRestrictive && <span style={{ color: '#ef4444', marginLeft: 6, fontSize: 12 }}>★限定性</span>}
          </div>
          <div className="indicator-meta">权重: <span className="weight-label">{indicator.weight}</span></div>
        </div>
        <label className="na-checkbox">
          <Checkbox checked={!isApplicable} onChange={(e) => onApplicableChange(!e.target.checked)} />
          不适用
        </label>
      </div>
      {isApplicable && (
        <div className="qual-options">
          {levels.map(lv => (
            <div key={lv.key} className={`qual-option ${value === lv.key ? 'selected' : ''}`} onClick={() => onChange(lv.key)}>
              <input type="radio" checked={value === lv.key} onChange={() => onChange(lv.key)} />
              <div>
                <div className="qual-option-level">{lv.label}</div>
                <div className="qual-option-desc">{lv.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 定量指标
const QuantitativeIndicator = ({ indicator, value, onChange, isApplicable, onApplicableChange }: {
  indicator: any; value: string; onChange: (v: string) => void; isApplicable: boolean; onApplicableChange: (c: boolean) => void;
}) => (
  <div className="indicator-card">
    <div className="indicator-card-header">
      <div>
        <div className="indicator-name">{indicator.name}
          {indicator.isRestrictive && <span style={{ color: '#ef4444', marginLeft: 6, fontSize: 12 }}>★限定性</span>}
        </div>
        <div className="indicator-meta">
          {indicator.unit && <>单位: {indicator.unit}&nbsp;&nbsp;</>}
          权重: <span className="weight-label">{indicator.weight}</span>
          <span className="benchmark-link" title={`Ⅰ级≤${indicator.benchmarks.level1}　Ⅱ级≤${indicator.benchmarks.level2}　Ⅲ级≤${indicator.benchmarks.level3}`}>
            ⓘ 基准值
          </span>
        </div>
      </div>
      <div className="quant-input-group">
        <label className="na-checkbox">
          <Checkbox checked={!isApplicable} onChange={(e) => onApplicableChange(!e.target.checked)} />
          不适用
        </label>
        <input
          type="number"
          className="quant-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="请输入"
          disabled={!isApplicable}
        />
      </div>
    </div>
  </div>
);

// 类别内容
const CategoryContent = ({ category }: { category: any }) => {
  const { indicatorInputs, updateIndicatorInput } = useStore();
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#0D2339', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CA933E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={TAB_ICONS[category.name] || 'M12 2L2 7l10 5 10-5-10-5z'} />
          </svg>
          {category.name}
        </h3>
        <span style={{ color: '#6b7280', fontSize: 14 }}>一级权重：<b style={{ color: '#0D2339' }}>{category.weight}</b></span>
      </div>
      {category.indicators.map((ind: any) => {
        const input = indicatorInputs[ind.id] || { value: '', isApplicable: true };
        return ind.type === 'qualitative' ? (
          <QualitativeIndicator
            key={ind.id} indicator={ind} value={input.selectedLevel || 0}
            onChange={(val) => updateIndicatorInput(ind.id, { ...input, selectedLevel: val })}
            isApplicable={input.isApplicable !== false}
            onApplicableChange={(c) => updateIndicatorInput(ind.id, { ...input, isApplicable: c })}
          />
        ) : (
          <QuantitativeIndicator
            key={ind.id} indicator={ind} value={input.value || ''}
            onChange={(val) => updateIndicatorInput(ind.id, { ...input, value: val })}
            isApplicable={input.isApplicable !== false}
            onApplicableChange={(c) => updateIndicatorInput(ind.id, { ...input, isApplicable: c })}
          />
        );
      })}
    </div>
  );
};

const Step2 = () => {
  const { indicatorInputs, setStep, calculateEvaluation } = useStore();
  const { message } = AntApp.useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [showInputWarning, setShowInputWarning] = useState(false);
  const categories = indicatorData.categories;
  const hasEvaluationInput = Object.values(indicatorInputs).some((input) =>
    input.isApplicable === false ||
    input.selectedLevel !== undefined ||
    String(input.value ?? '').trim() !== ''
  );

  const handleEvaluate = () => {
    if (!hasEvaluationInput) {
      setShowInputWarning(true);
      message.warning('请至少填写一项指标');
      requestAnimationFrame(() => {
        document.querySelector('.inline-warning')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      return;
    }

    const result = calculateEvaluation();
    if (!result) {
      setShowInputWarning(true);
      message.error('评价计算失败，请检查企业信息和指标数据');
      return;
    }

    setShowInputWarning(false);
    setStep(3);
  };

  return (
    <div className="form-card">
      {/* Pill-shaped Tab导航 */}
      <div className="indicator-tabs">
        {categories.map((cat, idx) => (
          <button
            key={idx}
            className={`indicator-tab ${activeTab === idx ? 'active' : ''}`}
            onClick={() => setActiveTab(idx)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={TAB_ICONS[cat.name] || 'M12 2L2 7l10 5 10-5-10-5z'} />
            </svg>
            {cat.name}
          </button>
        ))}
      </div>

      {showInputWarning && (
        <div className="inline-warning" role="alert">
          <strong>请先填写至少一项指标。</strong>
          <span>输入数值、选择等级，或勾选“不适用”后再开始评价。</span>
        </div>
      )}

      {/* 当前Tab内容 */}
      <CategoryContent category={categories[activeTab]} />

      {/* 底部三个按钮 */}
      <div className="nav-buttons">
        <button className="btn" onClick={() => setStep(1)}>← 上一步</button>
        <div className="nav-buttons-right">
          {activeTab < categories.length - 1 && (
            <button className="btn" onClick={() => setActiveTab(activeTab + 1)}>
              下一类别 →
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleEvaluate}
          >
            开始评价 →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step2;
