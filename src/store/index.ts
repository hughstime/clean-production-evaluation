import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EnterpriseInfo, IndicatorInput, EvaluationResult, StepType, AppState, CategoryDefinition } from '../types';
import { EvaluationEngine } from '../utils/evaluation';
import indicatorData from '../data/indicators.json';

const evaluationEngine = new EvaluationEngine();
const categories = indicatorData.categories as unknown as CategoryDefinition[];

const createEnterpriseId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  if (globalThis.crypto?.getRandomValues) {
    const values = globalThis.crypto.getRandomValues(new Uint32Array(2));
    return `enterprise-${Date.now().toString(36)}-${values[0].toString(36)}${values[1].toString(36)}`;
  }

  return `enterprise-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

interface Store extends AppState {
  // Actions
  setStep: (step: StepType) => void;
  setEnterpriseInfo: (info: EnterpriseInfo) => void;
  updateIndicatorInput: (indicatorId: string, input: Partial<IndicatorInput>) => void;
  setEvaluationResult: (result: EvaluationResult) => void;
  calculateEvaluation: () => EvaluationResult | null;
  setLoading: (loading: boolean) => void;
  reset: () => void;

  // Getters
  getCurrentCategory: () => CategoryDefinition | null;
  getProgress: () => number;
  getTotalIndicators: () => number;
  getCompletedIndicators: () => number;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 1,
      enterpriseInfo: null,
      indicatorInputs: {},
      evaluationResult: null,
      isLoading: false,

      // Actions
      setStep: (step) => set({ currentStep: step }),

      setEnterpriseInfo: (info) =>
        set({ enterpriseInfo: { ...info, id: info.id ?? createEnterpriseId() } }),

      updateIndicatorInput: (indicatorId, input) =>
        set((state) => ({
          indicatorInputs: {
            ...state.indicatorInputs,
            [indicatorId]: {
              ...state.indicatorInputs[indicatorId],
              ...input,
              // 确保isApplicable存在
              isApplicable: input.isApplicable ??
                (state.indicatorInputs[indicatorId]?.isApplicable ?? true)
            }
          }
        })),

      setEvaluationResult: (result) => set({ evaluationResult: result }),

      setLoading: (loading) => set({ isLoading: loading }),

      calculateEvaluation: () => {
        const state = get();
        if (!state.enterpriseInfo || Object.keys(state.indicatorInputs).length === 0) {
          return null;
        }

        try {
          const result = evaluationEngine.evaluate(
            state.indicatorInputs,
            categories
          );
          set({ evaluationResult: result });
          return result;
        } catch (error) {
          console.error('Evaluation calculation failed:', error);
          return null;
        }
      },

      reset: () =>
        set({
          currentStep: 1,
          enterpriseInfo: null,
          indicatorInputs: {},
          evaluationResult: null,
          isLoading: false,
        }),

      // Getters
      getCurrentCategory: () => {
        const state = get();
        if (state.currentStep !== 2) return null;

        // 假设Step 2的当前类别可以通过某种方式确定
        // 这里简化处理，实际可能需要更复杂的逻辑
        return categories[0]; // 默认返回第一个类别
      },

      getProgress: () => {
        const state = get();
        if (state.currentStep === 1) {
          return state.enterpriseInfo ? 25 : 0;
        } else if (state.currentStep === 2) {
          const total = state.getTotalIndicators();
          const completed = state.getCompletedIndicators();
          return 25 + Math.round((completed / Math.max(total, 1)) * 50);
        } else if (state.currentStep === 3) {
          return state.evaluationResult ? 75 : 50;
        } else if (state.currentStep === 4) {
          return 100;
        }
        return 0;
      },

      getTotalIndicators: () => {
        return categories.reduce(
          (total, category) => total + category.indicators.length,
          0
        );
      },

      getCompletedIndicators: () => {
        const state = get();
        return Object.values(state.indicatorInputs).filter(
          (input) =>
            input.isApplicable === false ||
            input.selectedLevel !== undefined ||
            String(input.value ?? '').trim() !== '' ||
            Object.values(input.subValues ?? {}).some((v) => String(v ?? '').trim() !== '')
        ).length;
      },
    }),
    {
      name: 'clean-production-evaluation-storage',
      // 只持久化必要的数据
      partialize: (state) => ({
        enterpriseInfo: state.enterpriseInfo,
        indicatorInputs: state.indicatorInputs,
        evaluationResult: state.evaluationResult,
      }),
    }
  )
);
