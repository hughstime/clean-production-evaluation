// 企业信息类型
export interface EnterpriseInfo {
  id?: string;
  name: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  reportPeriod: string;
  disposalCapacity?: string;
  wasteCategory?: string;
  evaluationDate: string;
}

// 指标基准值类型
export interface Benchmark {
  level1: string | number | { description: string; value: number };
  level2: string | number | { description: string; value: number };
  level3: string | number | { description: string; value: number };
}

// 单个指标定义类型
export interface IndicatorDefinition {
  id: string;
  name: string;
  weight: number;
  type: 'qualitative' | 'quantitative';
  unit: string;
  isRestrictive: boolean;
  isBonus: boolean;
  benchmarks: Benchmark;
  formula?: string;
}

// 指标类别定义类型
export interface CategoryDefinition {
  id: string;
  name: string;
  order: number;
  weight: number;
  isBonus?: boolean;
  indicators: IndicatorDefinition[];
}

// 指标输入值类型
export interface IndicatorInput {
  id: string;
  value: string | number;
  selectedLevel?: number; // 1=I级, 2=II级, 3=III级
  isApplicable: boolean; // 是否适用
}

// 评价得分结果类型
export interface ScoreResult {
  scoreL1: number; // I级得分
  scoreL2: number; // II级得分
  scoreL3: number; // III级得分
}

// 各级别得分类型
export interface LevelScores {
  totalScoreL1: number;
  totalScoreL2: number;
  totalScoreL3: number;
}

// 限定性指标检查结果
export interface RestrictiveCheck {
  indicatorId: string;
  indicatorName: string;
  actualValue?: string | number;
  isPassL1: boolean;
  isPassL2: boolean;
  isPassL3: boolean;
}

// 评价结果类型
export interface EvaluationResult {
  level: '未达标' | 'Ⅲ级' | 'Ⅱ级' | 'Ⅰ级';
  levelScore: number;
  levelScores: LevelScores;
  isRestrictivePassL1: boolean;
  isRestrictivePassL2: boolean;
  isRestrictivePassL3: boolean;
  categoryScores: Record<string, ScoreResult>;
  restrictiveChecks: RestrictiveCheck[];
  suggestions: string[];
}

// 步骤类型
export type StepType = 1 | 2 | 3 | 4;

// 应用状态类型
export interface AppState {
  currentStep: StepType;
  enterpriseInfo: EnterpriseInfo | null;
  indicatorInputs: Record<string, IndicatorInput>;
  evaluationResult: EvaluationResult | null;
  isLoading: boolean;
}

// 导入导出数据类型
export interface ExportData {
  enterpriseInfo: EnterpriseInfo;
  indicatorInputs: Record<string, IndicatorInput>;
  evaluationResult?: EvaluationResult;
  exportDate: string;
}

// 改进建议类型
export interface ImprovementSuggestion {
  category: string;
  categoryScore: number;
  indicators: Array<{
    name: string;
    score: number;
    gap: number;
    suggestion: string;
  }>;
}
