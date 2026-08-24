import { useState } from 'react';
import { App as AntApp, Checkbox } from 'antd';
import { useStore } from '../store';
import { CategoryDefinition, IndicatorDefinition, IndicatorInput } from '../types';
import indicatorData from '../data/indicators.json';
import { calcEnergyAndCarbon, computedValueFor, ENERGY_INPUT_FIELDS, SubValues } from '../utils/energy';

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
  indicator: IndicatorDefinition; value: number; onChange: (v: number) => void; isApplicable: boolean; onApplicableChange: (c: boolean) => void;
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
  indicator: IndicatorDefinition; value: string; onChange: (v: string) => void; isApplicable: boolean; onApplicableChange: (c: boolean) => void;
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
          <span className="benchmark-link" title={`Ⅰ级 ${indicator.benchmarks.level1} | Ⅱ级 ${indicator.benchmarks.level2} | Ⅲ级 ${indicator.benchmarks.level3}`}>
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

// 计算型指标（能源消耗/温室气体排放：实物量填报 + 系统自动折算）
const ENERGY_SOURCE_ID = 'waste_specific_energy';

const ComputedIndicator = ({ indicator }: { indicator: IndicatorDefinition }) => {
  const { indicatorInputs, updateIndicatorInput } = useStore();
  const isEnergy = indicator.computation === 'energy';
  const sourceInput = indicatorInputs[ENERGY_SOURCE_ID];
  const subValues = (sourceInput?.subValues ?? {}) as SubValues;
  const result = calcEnergyAndCarbon(subValues);
  const input: IndicatorInput = indicatorInputs[indicator.id] ?? { id: indicator.id, value: '', isApplicable: true };
  const isApplicable = input.isApplicable !== false;

  const handleSubChange = (key: string, v: string) => {
    updateIndicatorInput(ENERGY_SOURCE_ID, {
      ...(sourceInput ?? { id: ENERGY_SOURCE_ID, value: '', isApplicable: true }),
      subValues: { ...subValues, [key]: v },
    });
  };

  const fmt = (n: number) => n.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  const fmt3 = (n: number) => n.toLocaleString('zh-CN', { maximumFractionDigits: 3 });

  const label = ENERGY_INPUT_FIELDS.find((f) => f.key === 'annual_waste')!.label;

  return (
    <div className="indicator-card">
      <div className="indicator-card-header">
        <div>
          <div className="indicator-name">{indicator.name}
            <span style={{ color: '#CA933E', marginLeft: 6, fontSize: 12 }}>⚙ 系统自动计算</span>
          </div>
          <div className="indicator-meta">
            {indicator.unit && <>单位: <span className="weight-label">{indicator.unit}</span>&nbsp;&nbsp;</>}
            权重: <span className="weight-label">{indicator.weight}</span>
            {isEnergy && (
              <span className="benchmark-link" title="按一般烟煤0.6373、天然气1.2143 kgce/Nm³、柴油1.4571、电力等价2.8498 tce/万kWh、热力0.0341 tce/百万kJ折标">
                ⓘ 折标系数
              </span>
            )}
          </div>
        </div>
        <label className="na-checkbox">
          <Checkbox
            checked={!isApplicable}
            onChange={(e) => updateIndicatorInput(indicator.id, { ...input, isApplicable: !e.target.checked })}
          />
          不适用
        </label>
      </div>

      {isApplicable && (
        <>
          {isEnergy && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12, marginTop: 12 }}>
              {ENERGY_INPUT_FIELDS.map((f) => (
                <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#374151' }}>
                  <span>{f.label}（{f.unit}）</span>
                  <input
                    type="number"
                    className="quant-input"
                    style={{ width: '100%' }}
                    value={subValues[f.key] ?? ''}
                    onChange={(e) => handleSubChange(f.key, e.target.value)}
                    placeholder="请输入"
                    min="0"
                  />
                </label>
              ))}
            </div>
          )}

          {!isEnergy && (
            <div style={{ marginTop: 10, fontSize: 13, color: '#6b7280' }}>
              依据「能源消耗」中填报的实物量自动折算，无需重复填写。
            </div>
          )}

          <div style={{ marginTop: 14, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#374151' }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: '#0D2339' }}>自动计算结果</div>

            {isEnergy ? (
              <>
                <div>等价综合能耗：<b>{result.hasAnyEnergyInput ? `${fmt(result.totalEnergyTce)} 吨标准煤` : '—'}</b></div>
                <div style={{ marginTop: 4 }}>
                  吨入厂危废综合能耗：
                  <b style={{ color: result.energyPerWaste !== null && result.energyPerWaste <= 30 ? '#059669' : '#b45309' }}>
                    {result.energyPerWaste !== null ? `${result.energyPerWaste.toFixed(2)} kgce/t` : '—'}
                  </b>
                  {result.energyPerWaste === null && result.hasAnyEnergyInput && (
                    <span style={{ color: '#9ca3af' }}>（请在上方填写「{label}」）</span>
                  )}
                </div>
                <div style={{ marginTop: 4, color: '#6b7280', fontSize: 12 }}>
                  基准值：Ⅰ级 ≤30 · Ⅱ级 ≤40 · Ⅲ级 ≤50（kgce/t）
                </div>
              </>
            ) : (
              <>
                {result.hasAnyEnergyInput && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginBottom: 8 }}>
                    <thead>
                      <tr style={{ background: '#eef2f7' }}>
                        <th style={{ border: '1px solid #e5e7eb', padding: '4px 8px', textAlign: 'left' }}>能源品种</th>
                        <th style={{ border: '1px solid #e5e7eb', padding: '4px 8px', textAlign: 'right' }}>折标能耗（tce）</th>
                        <th style={{ border: '1px solid #e5e7eb', padding: '4px 8px', textAlign: 'right' }}>碳排放（tCO₂）</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.filter((it) => it.input > 0).map((it) => (
                        <tr key={it.key}>
                          <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px' }}>{it.label}</td>
                          <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px', textAlign: 'right' }}>{fmt(it.energyTce)}</td>
                          <td style={{ border: '1px solid #e5e7eb', padding: '4px 8px', textAlign: 'right' }}>{fmt3(it.carbonTco2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div>二氧化碳排放总量：<b>{result.hasAnyEnergyInput ? `${fmt3(result.totalCarbonTco2)} 吨CO₂` : '—'}</b></div>
                <div style={{ marginTop: 4 }}>
                  吨危废二氧化碳排放量：
                  <b>{result.carbonPerWaste !== null ? `${result.carbonPerWaste.toFixed(3)} tCO₂/t` : '—'}</b>
                  {result.carbonPerWaste === null && (
                    <span style={{ color: '#9ca3af' }}>（需在「能源消耗」中填写年入厂危废及至少一项能源实物量）</span>
                  )}
                </div>
                <div style={{ marginTop: 4, color: '#6b7280', fontSize: 12 }}>
                  排放因子（tCO₂/tce）：原煤 2.7324 · 天然气 1.6743 · 柴油 2.1680 · 电力 1.8561 · 热力 2.8939
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// 类别内容
const CategoryContent = ({ category }: { category: CategoryDefinition }) => {
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
      {category.indicators.map((ind) => {
        const input: IndicatorInput = indicatorInputs[ind.id] ?? { id: ind.id, value: '', isApplicable: true };
        if (ind.computed) {
          return <ComputedIndicator key={ind.id} indicator={ind} />;
        }
        return ind.type === 'qualitative' ? (
          <QualitativeIndicator
            key={ind.id} indicator={ind} value={input.selectedLevel || 0}
            onChange={(val) => updateIndicatorInput(ind.id, { ...input, selectedLevel: val })}
            isApplicable={input.isApplicable !== false}
            onApplicableChange={(c) => updateIndicatorInput(ind.id, { ...input, isApplicable: c })}
          />
        ) : (
          <QuantitativeIndicator
            key={ind.id} indicator={ind} value={String(input.value ?? '')}
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
  const { indicatorInputs, setStep, calculateEvaluation, updateIndicatorInput } = useStore();
  const { message } = AntApp.useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [showInputWarning, setShowInputWarning] = useState(false);
  const categories = indicatorData.categories as unknown as CategoryDefinition[];
  const hasEvaluationInput = Object.values(indicatorInputs).some((input) =>
    input.isApplicable === false ||
    input.selectedLevel !== undefined ||
    String(input.value ?? '').trim() !== '' ||
    Object.values(input.subValues ?? {}).some((v) => String(v ?? '').trim() !== '')
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

    // 同步计算型指标的实物量计算结果（能源消耗 → 温室气体排放）
    const energySubs = (indicatorInputs[ENERGY_SOURCE_ID]?.subValues ?? {}) as SubValues;
    categories.forEach((cat) =>
      cat.indicators.forEach((ind) => {
        if (!ind.computed || !ind.computation) return;
        const target = computedValueFor(ind.computation, energySubs);
        const current = indicatorInputs[ind.id];
        if (String(current?.value ?? '') !== target) {
          updateIndicatorInput(ind.id, {
            ...(current ?? { id: ind.id, value: '', isApplicable: true }),
            value: target,
          });
        }
      })
    );

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
