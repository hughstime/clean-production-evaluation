import { IndicatorInput, IndicatorDefinition, CategoryDefinition, Benchmark, ScoreResult, LevelScores, EvaluationResult, RestrictiveCheck, ImprovementSuggestion } from '../types';

type BenchmarkDirection = 'lower' | 'higher';
type BenchmarkOperator = '<' | '<=' | '>' | '>=';

export class EvaluationEngine {

  /**
   * 计算隶属函数值 - 将不同量纲的指标值映射为统一可比的0/100值
   */
  calculateMembershipScore(
    value: string | number,
    benchmark: Benchmark,
    type: 'qualitative' | 'quantitative'
  ): { scoreL1: number; scoreL2: number; scoreL3: number } {

    let scoreL1 = 0;
    let scoreL2 = 0;
    let scoreL3 = 0;

    if (type === 'qualitative') {
      // 定性指标：高等级同时满足低等级的评价要求
      const selectedLevel = value as number;
      if (selectedLevel === 1) {
        scoreL1 = 100; scoreL2 = 100; scoreL3 = 100;
      } else if (selectedLevel === 2) {
        scoreL2 = 100; scoreL3 = 100;
      } else if (selectedLevel === 3) {
        scoreL3 = 100;
      }
    } else {
      // 定量指标：分别判断是否满足 I/II/III 级基准
      const numValue = Number(value);
      const direction = this.getBenchmarkDirection(benchmark.level1);
      if (this.passesBenchmark(numValue, benchmark.level1, direction)) scoreL1 = 100;
      if (this.passesBenchmark(numValue, benchmark.level2, direction)) scoreL2 = 100;
      if (this.passesBenchmark(numValue, benchmark.level3, direction)) scoreL3 = 100;
    }

    return { scoreL1, scoreL2, scoreL3 };
  }

  /**
   * 解析基准值
   */
  private parseBenchmarkValue(value: string | number | { description: string; value: number }): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'object') return value.value;
    return this.parseBenchmarkLimit(value, this.getBenchmarkDirection(value)).value;
  }

  /**
   * 判断定量指标方向：越小越好或越大越好
   */
  private getBenchmarkDirection(level1Benchmark: Benchmark['level1']): BenchmarkDirection {
    const level1Str = String(level1Benchmark).toLowerCase();
    if (level1Str.includes('≤') || level1Str.includes('<=') || level1Str.includes('<')) {
      return 'lower';
    }
    if (level1Str.includes('≥') || level1Str.includes('>=') || level1Str.includes('>')) {
      return 'higher';
    }

    return ['能耗', '消耗', '排放', '浓度', '次数', '产出率'].some(keyword => level1Str.includes(keyword))
      ? 'lower'
      : 'higher';
  }

  private parseBenchmarkLimit(
    value: string | number | { description: string; value: number },
    direction: BenchmarkDirection
  ): { value: number; operator: BenchmarkOperator } {
    if (typeof value === 'number') {
      return { value, operator: direction === 'lower' ? '<=' : '>=' };
    }
    if (typeof value === 'object') {
      return { value: value.value, operator: direction === 'lower' ? '<=' : '>=' };
    }

    const str = String(value).replace(/,/g, '').replace(/％/g, '%').trim();
    const range = str.match(/(-?\d+(?:\.\d+)?)\s*[-－—–~～]\s*(-?\d+(?:\.\d+)?)/);
    if (range) {
      const first = Number(range[1]);
      const second = Number(range[2]);
      return {
        value: direction === 'lower' ? Math.max(first, second) : Math.min(first, second),
        operator: direction === 'lower' ? '<=' : '>=',
      };
    }

    const match = str.match(/-?\d+(?:\.\d+)?/);
    const parsedValue = match ? Number(match[0]) : Number.NaN;

    if (str.includes('≤') || str.includes('<=')) return { value: parsedValue, operator: '<=' };
    if (str.includes('<')) return { value: parsedValue, operator: '<' };
    if (str.includes('≥') || str.includes('>=')) return { value: parsedValue, operator: '>=' };
    if (str.includes('>')) return { value: parsedValue, operator: '>' };

    return { value: parsedValue, operator: direction === 'lower' ? '<=' : '>=' };
  }

  private passesBenchmark(
    numValue: number,
    benchmark: string | number | { description: string; value: number },
    direction: BenchmarkDirection
  ): boolean {
    const { value, operator } = this.parseBenchmarkLimit(benchmark, direction);
    if (!Number.isFinite(numValue) || !Number.isFinite(value)) return false;

    switch (operator) {
      case '<': return numValue < value;
      case '<=': return numValue <= value;
      case '>': return numValue > value;
      case '>=': return numValue >= value;
    }
  }

  private getIndicatorInputValue(indicator: IndicatorDefinition, input: IndicatorInput): string | number | undefined {
    return indicator.type === 'qualitative' ? (input.selectedLevel ?? input.value) : input.value;
  }

  private hasAnsweredIndicator(indicator: IndicatorDefinition, input?: IndicatorInput): input is IndicatorInput {
    if (!input || input.isApplicable === false) return false;
    const value = this.getIndicatorInputValue(indicator, input);
    return value !== undefined && value !== null && String(value).trim() !== '';
  }

  private hasScorableBenchmark(indicator: IndicatorDefinition): boolean {
    if (indicator.type === 'qualitative') return true;
    const direction = this.getBenchmarkDirection(indicator.benchmarks.level1);
    return [indicator.benchmarks.level1, indicator.benchmarks.level2, indicator.benchmarks.level3]
      .every((benchmark) => Number.isFinite(this.parseBenchmarkLimit(benchmark, direction).value));
  }

  /**
   * 计算加权综合评价指数
   */
  calculateTotalScore(
    indicatorInputs: Record<string, IndicatorInput>,
    categoryWeights: Record<string, number>,
    indicators: CategoryDefinition[]
  ): LevelScores {

    let totalScoreL1 = 0;
    let totalScoreL2 = 0;
    let totalScoreL3 = 0;
    let totalValidWeight = 0;

    // 计算每个类别的得分
    Object.entries(categoryWeights).forEach(([categoryId, categoryWeight]) => {
      const cat = indicators.find((c) => c.id === categoryId);
      const categoryIndicators = cat?.indicators || [];
      let categoryScoreL1 = 0;
      let categoryScoreL2 = 0;
      let categoryScoreL3 = 0;
      let categoryValidWeight = 0;

      // 计算类别内各指标的加权得分
      categoryIndicators.forEach(indicator => {
        const input = indicatorInputs[indicator.id];
        if (this.hasScorableBenchmark(indicator) && this.hasAnsweredIndicator(indicator, input)) {
          // 定性指标用selectedLevel，定量指标用value
          const inputValue = this.getIndicatorInputValue(indicator, input)!;
          const scores = this.calculateMembershipScore(inputValue, indicator.benchmarks, indicator.type);

          // 如果用户选择了特定等级，使用该等级的得分
          const weightedScoreL1 = scores.scoreL1 * indicator.weight;
          const weightedScoreL2 = scores.scoreL2 * indicator.weight;
          const weightedScoreL3 = scores.scoreL3 * indicator.weight;

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

    const capScore = (score: number) => Math.min(score, 100);

    return {
      totalScoreL1: totalValidWeight > 0 ? capScore(totalScoreL1) : 0,
      totalScoreL2: totalValidWeight > 0 ? capScore(totalScoreL2) : 0,
      totalScoreL3: totalValidWeight > 0 ? capScore(totalScoreL3) : 0
    };
  }

  /**
   * 检查限定性指标
   */
  checkRestrictiveIndicators(
    indicatorInputs: Record<string, IndicatorInput>,
    indicators: CategoryDefinition[]
  ): RestrictiveCheck[] {
    return indicators.flatMap((category) =>
      category.indicators
        .filter((indicator) => indicator.isRestrictive && this.hasScorableBenchmark(indicator))
        .map(indicator => {
          const input = indicatorInputs[indicator.id];
          const inputValue = this.hasAnsweredIndicator(indicator, input)
            ? Number(this.getIndicatorInputValue(indicator, input))
            : Number.NaN;

          const direction = this.getBenchmarkDirection(indicator.benchmarks.level1);
          const isPassL1 = this.passesBenchmark(inputValue, indicator.benchmarks.level1, direction);
          const isPassL2 = this.passesBenchmark(inputValue, indicator.benchmarks.level2, direction);
          const isPassL3 = this.passesBenchmark(inputValue, indicator.benchmarks.level3, direction);

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
    indicators: CategoryDefinition[],
    indicatorInputs: Record<string, IndicatorInput>
  ): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // 按类别分析低分项
    Object.entries(categoryScores).forEach(([categoryId, score]) => {
      const category = indicators.find((cat) => cat.id === categoryId);
      if (!category || !category.indicators || score.scoreL1 >= 70) return; // 得分70分以上不提建议

      const lowScoreIndicators = category.indicators
        .map(indicator => {
          const input = indicatorInputs[indicator.id];
          if (!this.hasScorableBenchmark(indicator) || !this.hasAnsweredIndicator(indicator, input)) return null;

          const inputValue = this.getIndicatorInputValue(indicator, input)!;
          const scores = this.calculateMembershipScore(inputValue, indicator.benchmarks, indicator.type);
          const maxScore = Math.max(scores.scoreL1, scores.scoreL2, scores.scoreL3);
          const gap = 100 - maxScore;

          if (gap > 20) { // 差距大于20分才提建议
            return {
              name: indicator.name,
              score: maxScore,
              gap,
              suggestion: this.generateSuggestion(indicator, inputValue)
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
  private generateSuggestion(indicator: IndicatorDefinition, value: string | number): string {
    const indicatorName = indicator.name;

    if (indicator.type === 'qualitative') {
      const desc = typeof indicator.benchmarks.level1 === 'object' ? indicator.benchmarks.level1.description : indicator.benchmarks.level1;
      return `建议提升至更高水平的${indicatorName}，以达到清洁生产先进水平。参考Ⅰ级标准：${desc}`;
    } else {
      const numValue = Number(value);
      const level1Value = this.parseBenchmarkValue(indicator.benchmarks.level1);
      const level2Value = this.parseBenchmarkValue(indicator.benchmarks.level2);

      if (this.getBenchmarkDirection(indicator.benchmarks.level1) === 'lower') {
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
    indicators: CategoryDefinition[]
  ): EvaluationResult {
    // 获取类别权重
    const categoryWeights: Record<string, number> = {};
    indicators.forEach(category => {
      // 资源循环利用是加分项，按草案额外0.1权重计入，最终综合指数封顶100。
      categoryWeights[category.id] = category.weight;
    });

    // 计算综合得分
    const scores = this.calculateTotalScore(indicatorInputs, categoryWeights, indicators);

    // 检查限定性指标
    const restrictiveChecks = this.checkRestrictiveIndicators(indicatorInputs, indicators);

    // 确定等级
    const level = this.determineLevel(scores, restrictiveChecks);

    // 计算各分类得分（用于可视化）
    const categoryScores: Record<string, ScoreResult> = {};
    indicators.forEach((category) => {
      const catIndicators = category.indicators || [];
      let categoryScoreL1 = 0;
      let categoryScoreL2 = 0;
      let categoryScoreL3 = 0;
      let categoryValidWeight = 0;

      if (catIndicators.length === 0) {
        categoryScores[category.id] = { scoreL1: 0, scoreL2: 0, scoreL3: 0 };
        return;
      }

      catIndicators.forEach((indicator) => {
        const input = indicatorInputs[indicator.id];
        if (this.hasScorableBenchmark(indicator) && this.hasAnsweredIndicator(indicator, input)) {
          const inputValue = this.getIndicatorInputValue(indicator, input)!;
          const scores = this.calculateMembershipScore(inputValue, indicator.benchmarks, indicator.type);
          categoryScoreL1 += scores.scoreL1 * indicator.weight;
          categoryScoreL2 += scores.scoreL2 * indicator.weight;
          categoryScoreL3 += scores.scoreL3 * indicator.weight;
          categoryValidWeight += indicator.weight;
        }
      });

      categoryScores[category.id] = {
        scoreL1: categoryValidWeight > 0 ? categoryScoreL1 / categoryValidWeight : 0,
        scoreL2: categoryValidWeight > 0 ? categoryScoreL2 / categoryValidWeight : 0,
        scoreL3: categoryValidWeight > 0 ? categoryScoreL3 / categoryValidWeight : 0,
      };
    });

    // 生成改进建议
    const suggestions = this.generateImprovementSuggestions(categoryScores, indicators, indicatorInputs);

    // 获得最终得分（根据等级）
    let levelScore = Math.max(scores.totalScoreL1, scores.totalScoreL2, scores.totalScoreL3);
    if (level === 'Ⅰ级') levelScore = scores.totalScoreL1;
    else if (level === 'Ⅱ级') levelScore = scores.totalScoreL2;
    else if (level === 'Ⅲ级') levelScore = scores.totalScoreL3;

    return {
      level,
      levelScore,
      levelScores: scores,
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
