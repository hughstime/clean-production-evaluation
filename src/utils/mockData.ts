import { EnterpriseInfo, IndicatorInput } from '../types';

/**
 * 模拟企业信息数据
 */
export const mockEnterpriseInfo: EnterpriseInfo = {
  name: '浙江省某环保科技有限公司',
  address: '浙江省杭州市西湖区科技园区88号',
  contactPerson: '张三',
  contactPhone: '13800138000',
  reportPeriod: '2024-01-01 to 2024-12-31',
  evaluationDate: '2026-04-10',
  disposalCapacity: '30000 t/a',
  wasteCategory: 'HW01, HW08, HW11'
};

/**
 * 模拟指标输入数据
 */
export const mockIndicatorInputs: Record<string, IndicatorInput> = {
  // 生产工艺及装备
  storage_info_management: {
    id: 'storage_info_management',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  anti_seepage_measures: {
    id: 'anti_seepage_measures',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  waste_preparation_system: {
    id: 'waste_preparation_system',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  incineration_equipment: {
    id: 'incineration_equipment',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  boiler_equipment: {
    id: 'boiler_equipment',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  flue_gas_treatment: {
    id: 'flue_gas_treatment',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  monitoring_system: {
    id: 'monitoring_system',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  emergency_system: {
    id: 'emergency_system',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  automation_level: {
    id: 'automation_level',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  dcs_coverage: {
    id: 'dcs_coverage',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },

  // 能源资源消耗
  energy_efficient_product_ratio: {
    id: 'energy_efficient_product_ratio',
    value: 90,
    selectedLevel: 1,
    isApplicable: true
  },
  waste_specific_energy: {
    id: 'waste_specific_energy',
    value: 120,
    selectedLevel: 1,
    isApplicable: true
  },
  water_recycling_rate: {
    id: 'water_recycling_rate',
    value: 85,
    selectedLevel: 2,
    isApplicable: true
  },
  steam_utilization_rate: {
    id: 'steam_utilization_rate',
    value: 90,
    selectedLevel: 1,
    isApplicable: true
  },

  // 资源综合利用
  byproduct_utilization_rate: {
    id: 'byproduct_utilization_rate',
    value: 95,
    selectedLevel: 1,
    isApplicable: true
  },
  waste_heat_recovery_rate: {
    id: 'waste_heat_recovery_rate',
    value: 80,
    selectedLevel: 2,
    isApplicable: true
  },
  ash_utilization_rate: {
    id: 'ash_utilization_rate',
    value: 90,
    selectedLevel: 1,
    isApplicable: true
  },
  slag_utilization_rate: {
    id: 'slag_utilization_rate',
    value: 95,
    selectedLevel: 1,
    isApplicable: true
  },

  // 污染物产生
  dust_emission: {
    id: 'dust_emission',
    value: 10,
    selectedLevel: 1,
    isApplicable: true
  },
  so2_emission: {
    id: 'so2_emission',
    value: 50,
    selectedLevel: 1,
    isApplicable: true
  },
  nox_emission: {
    id: 'nox_emission',
    value: 100,
    selectedLevel: 2,
    isApplicable: true
  },
  co_emission: {
    id: 'co_emission',
    value: 60,
    selectedLevel: 1,
    isApplicable: true
  },
  hcl_emission: {
    id: 'hcl_emission',
    value: 30,
    selectedLevel: 1,
    isApplicable: true
  },
  heavy_metal_emission: {
    id: 'heavy_metal_emission',
    value: 0.1,
    selectedLevel: 1,
    isApplicable: true
  },
  dioxin_emission: {
    id: 'dioxin_emission',
    value: 0.1,
    selectedLevel: 1,
    isApplicable: true
  },
  wastewater_discharge: {
    id: 'wastewater_discharge',
    value: 0.5,
    selectedLevel: 1,
    isApplicable: true
  },

  // 污染物排放
  noise_standard: {
    id: 'noise_standard',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  emergency_facilities: {
    id: 'emergency_facilities',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  online_monitoring: {
    id: 'online_monitoring',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },

  // 环境管理
  environmental_certification: {
    id: 'environmental_certification',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  environmental_management_system: {
    id: 'environmental_management_system',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  clean_production_audit: {
    id: 'clean_production_audit',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  stakeholder_communication: {
    id: 'stakeholder_communication',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },

  // 劳动安全卫生
  safety_system: {
    id: 'safety_system',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  health_monitoring: {
    id: 'health_monitoring',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  safety_training: {
    id: 'safety_training',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  },
  ppe_usage: {
    id: 'ppe_usage',
    value: 1,
    selectedLevel: 1,
    isApplicable: true
  }
};

/**
 * 获取所有模拟指标输入
 */
export const getAllMockIndicatorInputs = (): IndicatorInput[] => {
  return Object.values(mockIndicatorInputs);
};

/**
 * 填充模拟数据到表单
 */
export const fillMockData = () => {
  return {
    enterpriseInfo: mockEnterpriseInfo,
    indicatorInputs: mockIndicatorInputs
  };
};