import { useStore } from '../store';
import ReactECharts from 'echarts-for-react';

const NAMES = ['生产工艺及装备', '能源消耗', '水资源消耗', '原辅料资源消耗', '污染物产生与排放', '温室气体排放', '清洁生产管理', '资源循环利用'];
const WEIGHTS = [0.22, 0.12, 0.06, 0.10, 0.30, 0.05, 0.15, 0.10];
const KEYS = ['production_process', 'energy_consumption', 'water_consumption', 'raw_material_consumption', 'pollutant_emission', 'greenhouse_gas', 'clean_production_management', 'resource_recycling'];

const Step3 = () => {
  const { enterpriseInfo, evaluationResult: result, setStep } = useStore();

  const levelColor = (l: string) => l === 'Ⅰ级' ? '#22c55e' : l === 'Ⅱ级' ? '#3b82f6' : l === 'Ⅲ级' ? '#f59e0b' : '#ef4444';

  const radarOpt = () => {
    if (!result) return {};
    const scores = KEYS.map(k => { const s = result.categoryScores[k]; return s ? Math.max(s.scoreL1, s.scoreL2, s.scoreL3) : 0; });
    return {
      tooltip: {},
      radar: {
        indicator: NAMES.map(n => ({ name: n.length > 6 ? n.slice(0, 6) + '..' : n, max: 100 })),
        radius: '65%', shape: 'polygon',
        splitArea: { areaStyle: { color: ['rgba(13,35,57,0.02)', 'rgba(13,35,57,0.05)'] } },
        axisLine: { lineStyle: { color: '#d1d5db' } },
        splitLine: { lineStyle: { color: '#e5e7eb' } },
      },
      series: [{
        type: 'radar',
        data: [{
          value: scores, name: '评价得分',
          areaStyle: { color: 'rgba(13,35,57,0.15)' },
          lineStyle: { color: '#0D2339', width: 2 },
          itemStyle: { color: '#0D2339' },
        }]
      }]
    };
  };

  // 柱状图
  const barOpt = () => {
    if (!result) return {};
    const scores = KEYS.map(k => { const s = result.categoryScores[k]; return s ? Math.max(s.scoreL1, s.scoreL2, s.scoreL3) : 0; });
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: NAMES.map(n => n.length > 5 ? n.slice(0, 5) + '..' : n), axisLabel: { fontSize: 11, color: '#6b7280' } },
      yAxis: { type: 'value', max: 100, axisLabel: { color: '#9ca3af' } },
      series: [{ type: 'bar', data: scores, barWidth: 28, itemStyle: { color: 'rgba(13,35,57,0.7)', borderRadius: [3, 3, 0, 0] } }],
      grid: { left: 40, right: 20, top: 20, bottom: 40 },
    };
  };

  if (!result || !enterpriseInfo) {
    return (
      <div className="form-card" style={{ textAlign: 'center', padding: 80 }}>
        <p style={{ color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>无法计算评价结果</p>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>请返回指标填报页，至少填写一项有效指标后再开始评价。</p>
        <button className="btn btn-primary" onClick={() => setStep(2)}>返回指标填报</button>
      </div>
    );
  }

  const isPassed = result.level !== '未达标';

  return (
    <div>
      {/* 顶部结果Banner */}
      <div className="result-card" style={{ marginBottom: 20, border: isPassed ? '2px solid #22c55e' : '2px solid #ef4444' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isPassed ? '#f0fdf4' : '#fef2f2', border: `2px solid ${isPassed ? '#22c55e' : '#ef4444'}`, flexShrink: 0 }}>
            {isPassed ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: levelColor(result.level), marginBottom: 4 }}>
              清洁生产评价等级：{result.level}
            </div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>
              {isPassed ? `综合评价指数达到${result.level}标准` : '未达到清洁生产标准要求'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 14, color: '#6b7280' }}>综合评价指数</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#0D2339' }}>{result.levelScore.toFixed(1)}<span style={{ fontSize: 14, color: '#9ca3af', marginLeft: 4 }}>分</span></div>
          </div>
        </div>
      </div>

      {/* 三个指数卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Ⅰ级综合指数', score: result.levelScore, threshold: 85, pass: result.isRestrictivePassL1 && result.levelScore >= 85, color: '#22c55e' },
          { label: 'Ⅱ级综合指数', score: result.levelScore, threshold: 85, pass: result.isRestrictivePassL2 && result.levelScore >= 85, color: '#3b82f6' },
          { label: 'Ⅲ级综合指数', score: result.levelScore, threshold: 100, pass: result.isRestrictivePassL3, color: '#f59e0b' },
        ].map((c, i) => (
          <div key={i} className="result-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: c.color, marginBottom: 12 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#0D2339', marginBottom: 8 }}>{c.score.toFixed(1)}</div>
            <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${Math.min(c.score, 100)}%`, background: c.color, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 12, color: c.pass ? '#22c55e' : '#ef4444' }}>
              {c.pass ? '✓ 达标' : `✗ 未达阈值(≥${c.threshold})`}
            </div>
          </div>
        ))}
      </div>

      {/* 图表区 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="result-card">
          <h4 style={{ margin: '0 0 8px', color: '#0D2339', fontSize: 15 }}>雷达图</h4>
          <ReactECharts option={radarOpt()} style={{ height: 300 }} opts={{ renderer: 'canvas' }} />
        </div>
        <div className="result-card">
          <h4 style={{ margin: '0 0 8px', color: '#0D2339', fontSize: 15 }}>柱状图</h4>
          <ReactECharts option={barOpt()} style={{ height: 300 }} opts={{ renderer: 'canvas' }} />
        </div>
      </div>

      {/* 分项得分表格 */}
      <div className="result-card" style={{ marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 16px', color: '#CA933E', fontSize: 16 }}>各一级指标评价详情</h4>
        <table className="score-table">
          <thead>
            <tr><th style={{ textAlign: 'left' }}>一级指标</th><th>权重</th><th>Ⅰ级得分</th><th>Ⅱ级得分</th><th>Ⅲ级得分</th><th>类型</th></tr>
          </thead>
          <tbody>
            {KEYS.map((k, i) => {
              const s = result.categoryScores[k];
              const s1 = s?.scoreL1 || 0, s2 = s?.scoreL2 || 0, s3 = s?.scoreL3 || 0;
              return (
                <tr key={k}>
                  <td><strong>{NAMES[i]}</strong></td>
                  <td>{WEIGHTS[i]}</td>
                  <td className="score-green">{s1.toFixed(1)}</td>
                  <td className="score-blue">{s2.toFixed(1)}</td>
                  <td className="score-orange">{s3.toFixed(1)}</td>
                  <td><span className={`type-badge ${i === 7 ? 'bonus' : ''}`}>{i === 7 ? '加分项' : '常规'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 限定性指标检查 */}
      <div className="result-card" style={{ marginBottom: 20 }}>
        <div className="restrictive-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CA933E" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          限定性指标检查结果
        </div>
        {result.restrictiveChecks.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: 16 }}>暂无限定性指标数据</p>
        ) : result.restrictiveChecks.map(c => (
          <div key={c.indicatorId} className="restrictive-item">
            <span className="restrictive-badge">限定</span>
            <span className="restrictive-name">{c.indicatorName}</span>
            <div className="restrictive-levels">
              <span className={`level-check ${c.isPassL1 ? 'pass' : 'fail'}`}>{c.isPassL1 ? '✔' : '✘'} Ⅰ级</span>
              <span className={`level-check ${c.isPassL2 ? 'pass' : 'fail'}`}>{c.isPassL2 ? '✔' : '✘'} Ⅱ级</span>
              <span className={`level-check ${c.isPassL3 ? 'pass' : 'fail'}`}>{c.isPassL3 ? '✔' : '✘'} Ⅲ级</span>
            </div>
          </div>
        ))}
      </div>

      <div className="nav-buttons">
        <button className="btn" onClick={() => setStep(2)}>← 返回修改</button>
        <div className="nav-buttons-right">
          <button className="btn btn-primary" onClick={() => setStep(4)}>查看评价报告 →</button>
        </div>
      </div>
    </div>
  );
};

export default Step3;
