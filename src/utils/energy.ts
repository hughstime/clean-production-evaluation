/**
 * 能源实物量折标与碳排放计算工具
 *
 * 依据《工业企业碳排放与等价能耗计算算法规格说明》v1.1 及业务确认口径：
 * - 原煤按一般烟煤口径：折标 0.6373 tce/t，终端消费碳排因子 2.7324 tCO₂/tce
 * - 天然气折标 1.2143 kgce/Nm³（GB/T 2589-2020）
 * - 柴油折标 1.4571 tce/t，碳排因子 2.1680 tCO₂/tce
 * - 电力等价折标系数 2.8498 tce/万kWh（全省平均），平均电力排放因子 1.8561 tCO₂/tce
 * - 热力折标 0.0341 tce/百万kJ，平均热力排放因子 2.8939 tCO₂/tce
 * - 计算口径为能源消费侧，不涉及加工转换、回收利用等复杂逻辑
 */

export type EnergyFieldKey =
  | 'annual_waste'
  | 'raw_coal'
  | 'natural_gas'
  | 'diesel'
  | 'electricity'
  | 'heat';

export type EnergyItemKey = Exclude<EnergyFieldKey, 'annual_waste'>;

export interface EnergyFieldDef {
  key: EnergyFieldKey;
  label: string;
  unit: string;
}

/** 实物量输入字段定义（顺序即页面展示顺序） */
export const ENERGY_INPUT_FIELDS: EnergyFieldDef[] = [
  { key: 'annual_waste', label: '年入厂危废', unit: '吨' },
  { key: 'raw_coal', label: '原煤消耗', unit: '吨' },
  { key: 'natural_gas', label: '天然气消耗', unit: '标准立方米（Nm³）' },
  { key: 'diesel', label: '柴油消耗', unit: '吨' },
  { key: 'electricity', label: '购入用电量', unit: '千瓦时（kWh）' },
  { key: 'heat', label: '购入热力', unit: '兆焦（MJ）' },
];

/** 折标系数（吨标准煤 / 实物单位） */
export const CONVERSION_FACTORS: Record<EnergyItemKey, number> = {
  raw_coal: 0.6373,       // 一般烟煤口径
  natural_gas: 0.0012143, // 1.2143 kgce/Nm³
  diesel: 1.4571,         // tce/t
  electricity: 0.00028498,// 等价系数 2.8498 tce/万kWh
  heat: 0.0000341,        // 0.0341 tce/百万kJ
};

/** 碳排放因子（吨CO₂ / 吨标准煤） */
export const CARBON_FACTORS: Record<EnergyItemKey, number> = {
  raw_coal: 2.7324,   // 一般烟煤终端消费因子
  natural_gas: 1.6743,
  diesel: 2.1680,
  electricity: 1.8561, // 平均电力排放因子（client-confirmed-2025-v4）
  heat: 2.8939,        // 平均热力排放因子
};

export type SubValues = Partial<Record<EnergyFieldKey, string>>;

const toNum = (v: string | undefined): number => {
  if (v === undefined || v === null) return 0;
  const s = String(v).trim();
  if (s === '') return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

export interface EnergyCalcItem {
  key: EnergyItemKey;
  label: string;
  input: number;
  unit: string;
  energyTce: number;
  carbonTco2: number;
}

export interface EnergyCalcResult {
  annualWaste: number;
  hasAnyEnergyInput: boolean;
  items: EnergyCalcItem[];
  totalEnergyTce: number;
  /** 吨入厂危废综合能耗（kgce/t），条件不足时为 null */
  energyPerWaste: number | null;
  totalCarbonTco2: number;
  /** 吨危废二氧化碳排放量（tCO₂/t），条件不足时为 null */
  carbonPerWaste: number | null;
}

/** 根据实物量子输入计算等价能耗与碳排放（能源消费侧口径） */
export function calcEnergyAndCarbon(subValues: SubValues): EnergyCalcResult {
  const annualWaste = toNum(subValues.annual_waste);

  const items: EnergyCalcItem[] = (Object.keys(CONVERSION_FACTORS) as EnergyItemKey[]).map((key) => {
    const field = ENERGY_INPUT_FIELDS.find((f) => f.key === key)!;
    const input = toNum(subValues[key]);
    const energyTce = input * CONVERSION_FACTORS[key];
    const carbonTco2 = energyTce * CARBON_FACTORS[key];
    return { key, label: field.label, input, unit: field.unit, energyTce, carbonTco2 };
  });

  const hasAnyEnergyInput = items.some((it) => it.input > 0);

  const totalEnergyTce = items.reduce((sum, it) => sum + it.energyTce, 0);
  const totalCarbonTco2 = items.reduce((sum, it) => sum + it.carbonTco2, 0);

  const perWasteReady = annualWaste > 0 && hasAnyEnergyInput;

  return {
    annualWaste,
    hasAnyEnergyInput,
    items,
    totalEnergyTce,
    energyPerWaste: perWasteReady ? (totalEnergyTce * 1000) / annualWaste : null,
    totalCarbonTco2,
    carbonPerWaste: perWasteReady ? totalCarbonTco2 / annualWaste : null,
  };
}

/** 供评价引擎使用的计算结果值（写入指标 value） */
export function computedValueFor(computation: 'energy' | 'carbon', subValues: SubValues): string {
  const r = calcEnergyAndCarbon(subValues);
  if (computation === 'energy') {
    return r.energyPerWaste !== null ? r.energyPerWaste.toFixed(2) : '';
  }
  return r.carbonPerWaste !== null ? r.carbonPerWaste.toFixed(3) : '';
}
