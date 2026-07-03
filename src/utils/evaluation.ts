import { IndicatorInput, IndicatorDefinition, ScoreResult, LevelScores, EvaluationResult, RestrictiveCheck, ImprovementSuggestion } from '../types';

export class EvaluationEngine {

  /**
   * 计算隶属函数值 - 将不同量纲的指标值映射为统一可比的0/100值
   */
  calculateMembershipScore(
    value: string | number,
    benchmark: any,
    type: 'qualitative' | 'quantitative'
  ): { scoreL1: number; scoreL2: number; scoreL3: number } {

    let scoreL1 = 0;
    let scoreL2 = 0;
    let scoreL3 = 0;

    if (type === 'qualitative') {
      // 定性指标：根据选择等级直接赋值
      const selectedLevel = value as number;
      if (selectedLevel === 1) scoreL1 = 100;
      else if (selectedLevel === 2) scoreL2 = 100;
      else if (selectedLevel === 3) scoreL3 = 100;
    } else {
      // 定量指标：根据数值与基准值的关系判定等级
      const numValue = Number(value);
      const level1Value = this.parseBenchmarkValue(benchmark.level1);
      const level2Value = this.parseBenchmarkValue(benchmark.level2);
      const level3Value = this.parseBenchmarkValue(benchmark.level3);

      // 根据指标性质（越小越好或越大越好）进行判断
      if (this.isLowerBetterIndicator(benchmark.level1)) {
        // 越小越好指标（如能耗、排放）
        if (numValue <= level1Value) scoreL1 = 100;
        else if (numValue <= level2Value) scoreL2 = 100;
        else if (numValue <= level3Value) scoreL3 = 100;
      } else {
        // 越大越好指标（如运行时间、利用率）
        if (numValue >= level1Value) scoreL1 = 100;
        else if (numValue >= level2Value) scoreL2 = 100;
        else if (numValue >= level3Value) scoreL3 = 100;
      }
    }

    return { scoreL1, scoreL2, scoreL3 };
  }

  /**
   * 解析基准值
   */
  private parseBenchmarkValue(value: string | number | { description: string; value: number }): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'object') return value.value;
    // 处理字符串中的特殊符号（如">70%"，"<25%"）
    const str = String(value).replace(/[<>%]/g, '');
    return parseFloat(str);
  }

  /**
   * 判断是否为"越小越好"指标
   */
  private isLowerBetterIndicator(level1Benchmark: any): boolean {
    const level1Str = String(level1Benchmark).toLowerCase();
    return level1Str.includes('≤') || level1Str.includes('<') ||
           level1Str.includes('≤') ||
           ['能耗', '消耗', '排放', '浓度', '次数', '产出率'].some(keyword => level1Str.includes(keyword));
  }

  /**
   * 计算加权综合评价指数
   */
  calculateTotalScore(
    indicatorInputs: Record<string, IndicatorInput>,
    categoryWeights: Record<string, number>,
    indicators: IndicatorDefinition[]
  ): LevelScores {

    let totalScoreL1 = 0;
    let totalScoreL2 = 0;
    let totalScoreL3 = 0;
    let totalValidWeight = 0;

    // 计算每个类别的得分
    Object.entries(categoryWeights).forEach(([categoryId, categoryWeight]) => {
      const cat = indicators.find((c: any) => c.id === categoryId);
      const categoryIndicators = (cat as any)?.indicators || [];
      let categoryScoreL1 = 0;
      let categoryScoreL2 = 0;
      let categoryScoreL3 = 0;
      let categoryValidWeight = 0;

      // 计算类别内各指标的加权得分
      categoryIndicators.forEach(indicator => {
        const input = indicatorInputs[indicator.id];
        if (input && input.isApplicable) {
          // 定性指标用selectedLevel，定量指标用value
          const inputValue = indicator.type === 'qualitative' ? (input.selectedLevel || input.value) : input.value;
          const scores = this.calculateMembershipScore(inputValue, indicator.benchmarks, indicator.type);

          // 如果用户选择了特定等级，使用该等级的得分
          let weightedScoreL1 = scores.scoreL1 * indicator.weight;
          let weightedScoreL2 = scores.scoreL2 * indicator.weight;
          let weightedScoreL3 = scores.scoreL3 * indicator.weight;

          if (input.selectedLevel) {
            if (input.selectedLevel === 1) weightedScoreL1 = 100 * indicator.weight;
            else if (input.selectedLevel === 2) weightedScoreL2 = 100 * indicator.weight;
            else if (input.selectedLevel === 3) weightedScoreL3 = 100 * indicator.weight;
          }

          categoryScoreL1 += weightedScoreL1;
          categoryScoreL2 += weightedScoreL2;
          categoryScoreL3 += weightedScoreL3;
          categoryValidWeight += indicator.weight;
        }
      });

      // 如果有适用指标，计算类别加权得分
      if (categoryValidWeight > 0) {
        const ratio = categoryWeight / categoryValidWeight;
        totalScoreL1 += categoryScoreL1 * ratio;
        totalScoreL2 += categoryScoreL2 * ratio;
        totalScoreL3 += categoryScoreL3 * ratio;
        totalValidWeight += categoryWeight;
      }
    });

    return {
      totalScoreL1: totalValidWeight > 0 ? totalScoreL1 : 0,
      totalScoreL2: totalValidWeight > 0 ? totalScoreL2 : 0,
      totalScoreL3: totalValidWeight > 0 ? totalScoreL3 : 0
    };
  }

  /**
   * 检查限定性指标
   */
  checkRestrictiveIndicators(
    indicatorInputs: Record<string, IndicatorInput>,
    indicators: IndicatorDefinition[]
  ): RestrictiveCheck[] {
    return indicators.flatMap((category: any) =>
      (category.indicators || [])
        .filter((indicator: any) => indicator.isRestrictive)
        .map(indicator => {
          const input = indicatorInputs[indicator.id];
          const level1Value = this.parseBenchmarkValue(indicator.benchmarks.level1);
          const level2Value = this.parseBenchmarkValue(indicator.benchmarks.level2);
          const level3Value = this.parseBenchmarkValue(indicator.benchmarks.level3);
          const inputValue = Number(input?.value || 0);

          // 根据指标类型判断是否达标
          const isLowerBetter = this.isLowerBetterIndicator(indicator.benchmarks.level1);

          const isPassL1 = isLowerBetter ? inputValue <= level1Value : inputValue >= level1Value;
          const isPassL2 = isLowerBetter ? inputValue <= level2Value : inputValue >= level2Value;
          const isPassL3 = isLowerBetter ? inputValue <= level3Value : inputValue >= level3Value;

          return {
            indicatorId: indicator.id,
            indicatorName: indicator.name,
            isPassL1,
            isPassL2,
            isPassL3
          };
        })
    );
  }

  /**
   * 确定清洁生产等级
   */
  determineLevel(
    scores: LevelScores,
    restrictiveChecks: RestrictiveCheck[]
  ): EvaluationResult['level'] {

    // 检查限定性指标是否满足
    const isAnyRestrictiveFailL1 = restrictiveChecks.some(check => !check.isPassL1);
    const isAnyRestrictiveFailL2 = restrictiveChecks.some(check => !check.isPassL2);
    const isAnyRestrictiveFailL3 = restrictiveChecks.some(check => !check.isPassL3);

    // 第一步：检查Ⅰ级
    if (!isAnyRestrictiveFailL1 && scores.totalScoreL1 >= 85) {
      return 'Ⅰ级';
    }

    // 第二步：检查Ⅱ级
    if (!isAnyRestrictiveFailL2 && scores.totalScoreL2 >= 85) {
      return 'Ⅱ级';
    }

    // 第三步：检查Ⅲ级
    if (!isAnyRestrictiveFailL3 && scores.totalScoreL3 === 100) {
      return 'Ⅲ级';
    }

    // 未达标
    return '未达标';
  }

  /**
   * 生成改进建议
   */
  generateImprovementSuggestions(
    categoryScores: Record<string, ScoreResult>,
    indicators: IndicatorDefinition[],
    indicatorInputs: Record<string, IndicatorInput>
  ): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // 按类别分析低分项
    Object.entries(categoryScores).forEach(([categoryId, score]) => {
      const category = indicators.find((cat: any) => cat.id === categoryId) as any;
      if (!category || !category.indicators || score.scoreL1 >= 70) return; // 得分70分以上不提建议

      const lowScoreIndicators = category.indicators
        .map(indicator => {
          const input = indicatorInputs[indicator.id];
          if (!input || !input.isApplicable) return null;

          const scores = this.calculateMembershipScore(input.value, indicator.benchmarks, indicator.type);
          const maxScore = Math.max(scores.scoreL1, scores.scoreL2, scores.scoreL3);
          const gap = 100 - maxScore;

          if (gap > 20) { // 差距大于20分才提建议
            return {
              name: indicator.name,
              score: maxScore,
              gap,
              suggestion: this.generateSuggestion(indicator, input.value, maxScore)
            };
          }
          return null;
        })
        .filter(Boolean) as Array<{
          name: string;
          score: number;
          gap: number;
          suggestion: string;
        }>;

      if (lowScoreIndicators.length > 0) {
        suggestions.push({
          category: category.name,
          categoryScore: Math.max(score.scoreL1, score.scoreL2, score.scoreL3),
          indicators: lowScoreIndicators
        });
      }
    });

    return suggestions;
  }

  /**
   * 生成单个指标的建议
   */
  private generateSuggestion(indicator: IndicatorDefinition, value: string | number, score: number): string {
    const indicatorName = indicator.name;

    if (indicator.type === 'qualitative') {
      const desc = typeof indicator.benchmarks.level1 === 'object' ? (indicator.benchmarks.level1 as any).description : indicator.benchmarks.level1;
      return `建议提升至更高水平的${indicatorName}，以达到清洁生产先进水平。参考Ⅰ级标准：${desc}`;
    } else {
      const numValue = Number(value);
      const level1Value = this.parseBenchmarkValue(indicator.benchmarks.level1);
      const level2Value = this.parseBenchmarkValue(indicator.benchmarks.level2);
      const level3Value = this.parseBenchmarkValue(indicator.benchmarks.level3);

      if (this.isLowerBetterIndicator(indicator.benchmarks.level1)) {
        // 越小越好指标
        if (numValue > level1Value) {
          return `${indicatorName}偏高，建议通过工艺优化、设备升级或加强管理措施来降低，目标值应≤${level1Value}${indicator.unit}`;
        } else if (numValue > level2Value) {
          return `${indicatorName}有优化空间，建议进一步改进，目标值应≤${level2Value}${indicator.unit}`;
        }
      } else {
        // 越大越好指标
        if (numValue < level1Value) {
          return `${indicatorName}偏低，建议通过优化运行参数、提高设备效率或加强维护来提升，目标值应≥${level1Value}${indicator.unit}`;
        } else if (numValue < level2Value) {
          return `${indicatorName}有提升空间，建议进一步改进，目标值应≥${level2Value}${indicator.unit}`;
        }
      }
    }

    return `持续保持${indicatorName}的优化水平，向更高标准努力。`;
  }

  /**
   * 执行完整评价流程
   */
  evaluate(
    indicatorInputs: Record<string, IndicatorInput>,
    indicators: IndicatorDefinition[]
  ): EvaluationResult {
    // 获取类别权重
    const categoryWeights: Record<string, number> = {};
    indicators.forEach(category => {
      // 资源循环利用是加分项，不纳入基本权重
      if (!category.isBonus) {
        categoryWeights[category.id] = category.weight;
      }
    });

    // 计算综合得分
    const scores = this.calculateTotalScore(indicatorInputs, categoryWeights, indicators);

    // 检查限定性指标
    const restrictiveChecks = this.checkRestrictiveIndicators(indicatorInputs, indicators);

    // 确定等级
    const level = this.determineLevel(scores, restrictiveChecks);

    // 计算各分类得分（用于可视化）
    const categoryScores: Record<string, ScoreResult> = {};
    indicators.forEach((category: any) => {
      const catIndicators = category.indicators || [];
      if (catIndicators.length === 0) {
        categoryScores[category.id] = { scoreL1: 0, scoreL2: 0, scoreL3: 0 };
        return;
      }
      const categoryIndicators = catIndicators.map((indicator: any) => {
        const input = indicatorInputs[indicator.id];
        if (input && input.isApplicable) {
          const inputValue = indicator.type === 'qualitative' ? (input.selectedLevel || input.value) : input.value;
          return this.calculateMembershipScore(inputValue, indicator.benchmarks, indicator.type);
        }
        return { scoreL1: 0, scoreL2: 0, scoreL3: 0 };
      });

      const avgScoreL1 = categoryIndicators.reduce((sum: number, s: any) => sum + s.scoreL1, 0) / categoryIndicators.length;
      const avgScoreL2 = categoryIndicators.reduce((sum: number, s: any) => sum + s.scoreL2, 0) / categoryIndicators.length;
      const avgScoreL3 = categoryIndicators.reduce((sum: number, s: any) => sum + s.scoreL3, 0) / categoryIndicators.length;

      categoryScores[category.id] = {
        scoreL1: avgScoreL1,
        scoreL2: avgScoreL2,
        scoreL3: avgScoreL3
      };
    });

    // 生成改进建议
    const suggestions = this.generateImprovementSuggestions(categoryScores, indicators, indicatorInputs);

    // 获得最终得分（根据等级）
    let levelScore = 0;
    if (level === 'Ⅰ级') levelScore = scores.totalScoreL1;
    else if (level === 'Ⅱ级') levelScore = scores.totalScoreL2;
    else if (level === 'Ⅲ级') levelScore = scores.totalScoreL3;

    return {
      level,
      levelScore,
      isRestrictivePassL1: restrictiveChecks.every(check => check.isPassL1),
      isRestrictivePassL2: restrictiveChecks.every(check => check.isPassL2),
      isRestrictivePassL3: restrictiveChecks.every(check => check.isPassL3),
      categoryScores,
      restrictiveChecks,
      suggestions: suggestions.map(s =>
        `${s.category}：${s.indicators.map(i => `${i.name}(${i.score.toFixed(1)}分)`).join('、')}${s.indicators.length > 0 && s.indicators[0].suggestion ? `。${s.indicators[0].suggestion}` : ''}`
      )
    };
  }
}