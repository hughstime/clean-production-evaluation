/**
 * 填报原始数据 Excel 导出工具
 *
 * 将企业信息、全部指标填报明细（含实物量）、评价结果导出为多工作表 Excel 文件。
 * 与评价报告（PDF）导出入口并列，供后台留存与核查。
 */
import * as XLSX from 'xlsx';
import { EnterpriseInfo, IndicatorInput, EvaluationResult, CategoryDefinition, IndicatorDefinition } from '../types';
import indicatorData from '../data/indicators.json';
import { calcEnergyAndCarbon, SubValues, ENERGY_INPUT_FIELDS } from './energy';

const ENERGY_SOURCE_ID = 'waste_specific_energy';

const categories = indicatorData.categories as unknown as CategoryDefinition[];

const LEVEL_NAMES: Record<number, string> = { 1: 'Ⅰ级', 2: 'Ⅱ级', 3: 'Ⅲ级' };

// 与填报页一致的类别级"不适用"文案
const NA_LABELS: Record<string, string> = {
  resource_recycling: '未开展',
  greenhouse_gas: '不准确、企业已自行开展碳核查',
};

const typeLabel = (ind: IndicatorDefinition): string => {
  if (ind.computed) return '定量（自动计算）';
  return ind.type === 'qualitative' ? '定性' : '定量';
};

const benchmarkText = (b: string | number | { description: string; value: number }): string => {
  if (b === '' || b === null || b === undefined) return '—';
  if (typeof b === 'object') return b.description;
  return String(b);
};

const safeName = (s: string): string => s.replace(/[\\/:*?"<>|]/g, '_');

const nowStamp = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};

export function exportRawDataToExcel(
  enterpriseInfo: EnterpriseInfo,
  indicatorInputs: Record<string, IndicatorInput>,
  evaluationResult: EvaluationResult | null
): void {
  const wb = XLSX.utils.book_new();

  /* ---------- Sheet1 企业信息 ---------- */
  const infoAoa: (string | number)[][] = [
    ['危险废物焚烧处置清洁生产评价 —— 填报原始数据'],
    ['导出时间', new Date().toLocaleString('zh-CN')],
    [],
    ['项目', '内容'],
    ['企业名称', enterpriseInfo.name],
    ['企业地址', enterpriseInfo.address],
    ['联系人', enterpriseInfo.contactPerson],
    ['联系电话', enterpriseInfo.contactPhone],
    ['统计报告期', enterpriseInfo.reportPeriod],
    ['焚烧处置能力', enterpriseInfo.disposalCapacity || ''],
    ['处置废物类别', enterpriseInfo.wasteCategory || ''],
    ['评价日期', enterpriseInfo.evaluationDate],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(infoAoa);
  wsInfo['!cols'] = [{ wch: 16 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, '企业信息');

  /* ---------- Sheet2 指标填报明细 ---------- */
  const energySubs = (indicatorInputs[ENERGY_SOURCE_ID]?.subValues ?? {}) as SubValues;
  const calc = calcEnergyAndCarbon(energySubs);

  const head = ['序号', '一级指标', '二级指标名称', '类型', '单位', '二级权重', '限定性', '加分项', '填报内容', '是否适用', 'Ⅰ级基准', 'Ⅱ级基准', 'Ⅲ级基准'];
  const rows: (string | number)[][] = [head];
  let seq = 0;

  categories.forEach((cat) => {
    cat.indicators.forEach((ind) => {
      seq += 1;
      const input = indicatorInputs[ind.id];
      const applicable = input ? input.isApplicable !== false : true;
      let filled = '—';

      if (!applicable) {
        const naLabel = NA_LABELS[cat.id] ?? '不适用';
        filled = naLabel + (cat.id === 'greenhouse_gas' && input?.naNote ? `：${input.naNote}` : '');
      } else if (ind.computed) {
        const unitLabel = ind.computation === 'energy' ? 'kgce/t' : 'tCO₂/t';
        const v = ind.computation === 'energy' ? calc.energyPerWaste : calc.carbonPerWaste;
        filled = `自动计算 = ${v !== null ? (ind.computation === 'energy' ? v.toFixed(2) : v.toFixed(3)) : '未得出'} ${unitLabel}`;
      } else if (ind.type === 'qualitative') {
        filled = input?.selectedLevel ? LEVEL_NAMES[input.selectedLevel] : '未填报';
      } else {
        filled = input?.value !== undefined && String(input.value).trim() !== '' ? String(input.value) : '未填报';
      }

      rows.push([
        seq,
        cat.name,
        ind.name,
        typeLabel(ind),
        ind.unit || '—',
        ind.weight,
        ind.isRestrictive ? '是' : '否',
        ind.isBonus ? '是' : '否',
        filled,
        applicable ? '适用' : (NA_LABELS[cat.id] ?? '不适用'),
        benchmarkText(ind.benchmarks.level1),
        benchmarkText(ind.benchmarks.level2),
        benchmarkText(ind.benchmarks.level3),
      ]);

      // 计算型指标附带实物量原始输入
      if (ind.computed && ind.computation === 'energy') {
        const detail = ENERGY_INPUT_FIELDS.map((f) => `${f.label}(${f.unit})=${energySubs[f.key] ?? ''}`).join('；');
        rows.push(['', cat.name, '└ 实物量原始输入', '', '', '', '', '', detail, '', '', '', '']);
      }
    });
  });

  const wsDetail = XLSX.utils.aoa_to_sheet(rows);
  wsDetail['!cols'] = [
    { wch: 6 }, { wch: 16 }, { wch: 38 }, { wch: 15 }, { wch: 13 }, { wch: 9 },
    { wch: 8 }, { wch: 8 }, { wch: 60 }, { wch: 8 }, { wch: 26 }, { wch: 26 }, { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, '指标填报明细');

  /* ---------- Sheet3 能源实物量与折算 ---------- */
  const calcAoa: (string | number)[][] = [
    ['能源实物量与折算结果（系统自动计算）'],
    [],
    ['项目', '实物量', '折标能耗（tce）', '碳排放（tCO₂）'],
    ...calc.items.map((it) => [it.label, it.input === 0 ? '' : it.input, Number(it.energyTce.toFixed(4)), Number(it.carbonTco2.toFixed(4))]),
    ['合计', '', Number(calc.totalEnergyTce.toFixed(4)), Number(calc.totalCarbonTco2.toFixed(4))],
    [],
    ['年入厂危废（t）', calc.annualWaste || ''],
    ['吨入厂危废综合能耗（kgce/t）', calc.energyPerWaste !== null ? Number(calc.energyPerWaste.toFixed(2)) : '—'],
    ['吨危废二氧化碳排放量（tCO₂/t）', calc.carbonPerWaste !== null ? Number(calc.carbonPerWaste.toFixed(3)) : '—'],
  ];
  const wsCalc = XLSX.utils.aoa_to_sheet(calcAoa);
  wsCalc['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsCalc, '能源与碳排放');

  /* ---------- Sheet4 评价结果 ---------- */
  const resAoa: (string | number)[][] = [
    ['评价结果汇总'],
    [],
    ['评价等级', evaluationResult?.level ?? '—'],
    ['综合评价指数', evaluationResult ? Number(evaluationResult.levelScore.toFixed(1)) : '—'],
    ['Ⅰ级综合指数', evaluationResult ? Number((evaluationResult.levelScores?.totalScoreL1 ?? 0).toFixed(1)) : '—'],
    ['Ⅱ级综合指数', evaluationResult ? Number((evaluationResult.levelScores?.totalScoreL2 ?? 0).toFixed(1)) : '—'],
    ['Ⅲ级综合指数', evaluationResult ? Number((evaluationResult.levelScores?.totalScoreL3 ?? 0).toFixed(1)) : '—'],
    [],
    ['一级指标', '权重', 'Ⅰ级得分', 'Ⅱ级得分', 'Ⅲ级得分', '类型'],
    ...categories.map((cat) => {
      const s = evaluationResult?.categoryScores[cat.id];
      return [
        cat.name,
        cat.weight,
        Number((s?.scoreL1 || 0).toFixed(1)),
        Number((s?.scoreL2 || 0).toFixed(1)),
        Number((s?.scoreL3 || 0).toFixed(1)),
        cat.isBonus ? '加分项' : '常规',
      ];
    }),
    [],
    ['限定性指标检查'],
    ['指标名称', 'Ⅰ级', 'Ⅱ级', 'Ⅲ级'],
    ...(evaluationResult?.restrictiveChecks ?? []).map((c) => [
      c.indicatorName,
      c.isPassL1 ? '✔ 达标' : '✘ 不达标',
      c.isPassL2 ? '✔ 达标' : '✘ 不达标',
      c.isPassL3 ? '✔ 达标' : '✘ 不达标',
    ]),
  ];
  const wsRes = XLSX.utils.aoa_to_sheet(resAoa);
  wsRes['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsRes, '评价结果');

  XLSX.writeFile(wb, `清洁生产评价填报数据_${safeName(enterpriseInfo.name)}_${nowStamp()}.xlsx`);
}
