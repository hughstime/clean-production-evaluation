import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { useStore } from '../store';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const NAMES = ['生产工艺及装备', '能源消耗', '水资源消耗', '原辅料资源消耗', '污染物产生与排放', '温室气体排放', '清洁生产管理', '资源循环利用'];
const WEIGHTS = [0.22, 0.12, 0.06, 0.10, 0.30, 0.05, 0.15, 0.10];
const KEYS = ['production_process', 'energy_consumption', 'water_consumption', 'raw_material_consumption', 'pollutant_emission', 'greenhouse_gas', 'clean_production_management', 'resource_recycling'];

const Step4 = () => {
  const { enterpriseInfo, evaluationResult, setStep, calculateEvaluation } = useStore();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!evaluationResult) {
      const r = calculateEvaluation();
      if (!r) { message.error('无法获取评价结果'); setStep(2); }
    }
  }, [evaluationResult, calculateEvaluation, setStep]);

  const handlePDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
      pdf.save(`清洁生产评价报告_${enterpriseInfo?.name}.pdf`);
      message.success('报告导出成功');
    } catch { message.error('导出失败'); }
  };

  if (!enterpriseInfo || !evaluationResult) {
    return <div className="form-card" style={{ textAlign: 'center', padding: 80 }}><p style={{ color: '#9ca3af' }}>加载中...</p></div>;
  }

  const levelColor = (l: string) => l === 'Ⅰ级' ? '#22c55e' : l === 'Ⅱ级' ? '#3b82f6' : l === 'Ⅲ级' ? '#f59e0b' : '#ef4444';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={handlePDF}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          导出PDF
        </button>
        <button className="btn" onClick={() => window.print()}>🖨️ 打印</button>
      </div>

      <div ref={reportRef}>
        {/* 封面 */}
        <div className="result-card" style={{ background: '#0D2339', color: '#fff', textAlign: 'center', padding: '48px 40px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 20, letterSpacing: 2 }}>T/ZAEPI XXX—XXXX</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: '#CA933E' }}>危险废物焚烧处置清洁生产评价报告</h1>
          <div style={{ margin: '28px 0', fontSize: 18 }}>
            评价等级: <span style={{ fontSize: 36, fontWeight: 700, color: levelColor(evaluationResult.level) }}>{evaluationResult.level}</span>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', margin: '0 80px', padding: '24px 0 0' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 8px' }}>被评价企业</p>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{enterpriseInfo.name}</h2>
          </div>
        </div>

        {/* 企业概况 */}
        <div className="result-card" style={{ marginBottom: 20 }}>
          <h4 style={{ color: '#CA933E', margin: '0 0 16px', fontSize: 16 }}>企业概况</h4>
          <table className="score-table">
            <tbody>
              <tr><td style={{ fontWeight: 600, width: 120 }}>企业名称</td><td>{enterpriseInfo.name}</td><td style={{ fontWeight: 600, width: 100 }}>联系人</td><td>{enterpriseInfo.contactPerson}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>企业地址</td><td>{enterpriseInfo.address}</td><td style={{ fontWeight: 600 }}>联系电话</td><td>{enterpriseInfo.contactPhone}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>统计报告期</td><td>{enterpriseInfo.reportPeriod}</td><td style={{ fontWeight: 600 }}>评价日期</td><td>{enterpriseInfo.evaluationDate}</td></tr>
            </tbody>
          </table>
        </div>

        {/* 评价结果 */}
        <div className="result-card" style={{ marginBottom: 20 }}>
          <h4 style={{ color: '#CA933E', margin: '0 0 16px', fontSize: 16 }}>评价结果汇总</h4>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center', margin: '16px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: levelColor(evaluationResult.level) }}>{evaluationResult.level}</div>
              <div style={{ color: '#9ca3af', fontSize: 13 }}>清洁生产水平</div>
            </div>
            <div>
              <p style={{ marginBottom: 8 }}>综合评价指数: <strong style={{ fontSize: 24, color: '#0D2339' }}>{evaluationResult.levelScore.toFixed(1)}</strong> 分</p>
              <p style={{ color: '#6b7280', fontSize: 14 }}>
                限定性指标: {evaluationResult.restrictiveChecks.every(c => c.isPassL3)
                  ? <span style={{ color: '#22c55e' }}>✓ 全部达标</span>
                  : <span style={{ color: '#ef4444' }}>✗ 存在不达标项</span>}
              </p>
            </div>
          </div>
        </div>

        {/* 分项得分 */}
        <div className="result-card" style={{ marginBottom: 20 }}>
          <h4 style={{ color: '#CA933E', margin: '0 0 16px', fontSize: 16 }}>分项得分</h4>
          <table className="score-table">
            <thead><tr><th style={{ textAlign: 'left' }}>评价类别</th><th>权重</th><th>得分</th><th>类型</th></tr></thead>
            <tbody>
              {KEYS.map((k, i) => {
                const s = evaluationResult.categoryScores[k];
                const max = s ? Math.max(s.scoreL1, s.scoreL2, s.scoreL3) : 0;
                return (
                  <tr key={k}>
                    <td><strong>{NAMES[i]}</strong></td>
                    <td>{WEIGHTS[i]}</td>
                    <td><strong>{max.toFixed(1)}</strong></td>
                    <td><span className={`type-badge ${i === 7 ? 'bonus' : ''}`}>{i === 7 ? '加分项' : '常规'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 说明 */}
        <div className="result-card">
          <h4 style={{ color: '#CA933E', margin: '0 0 12px', fontSize: 16 }}>报告说明</h4>
          <ol style={{ color: '#6b7280', lineHeight: 2, paddingLeft: 20, margin: 0 }}>
            <li>本报告依据T/ZAEPI XXX—XXXX《危险废物焚烧处置行业清洁生产评价指标体系》编制</li>
            <li>评价结果仅反映企业在统计报告期的清洁生产水平</li>
            <li>本报告仅供参考，企业应根据评价结果持续改进</li>
            <li>报告有效期：自评价之日起2年</li>
          </ol>
        </div>
      </div>

      <div className="nav-buttons" style={{ marginTop: 20 }}>
        <button className="btn" onClick={() => setStep(3)}>← 返回查看结果</button>
      </div>
    </div>
  );
};

export default Step4;