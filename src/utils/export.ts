import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { EnterpriseInfo, EvaluationResult, ExportData } from '../types';

/**
 * 生成PDF报告的类
 */
export class ReportExporter {
  /**
   * 导出完整的PDF报告
   */
  static async exportCompleteReport(
    enterpriseInfo: EnterpriseInfo,
    evaluationResult: EvaluationResult,
    elementId: string = 'report-content'
  ): Promise<void> {
    try {
      // 获取报告内容元素
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('报告内容元素不存在');
      }

      // 创建canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      // 创建PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // 如果内容高度超过一页，需要分页
      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        let remainingHeight = pdfHeight;
        let position = 0;

        while (remainingHeight > 0) {
          const pageHeight = Math.min(pdf.internal.pageSize.getHeight(), remainingHeight);

          if (position > 0) {
            pdf.addPage();
          }

          pdf.addImage(
            imgData,
            'PNG',
            0,
            -position,
            pdfWidth,
            pdfHeight
          );

          remainingHeight -= pdf.internal.pageSize.getHeight();
          position += pdf.internal.pageSize.getHeight();
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      // 下载PDF
      const fileName = `清洁生产评价报告_${enterpriseInfo.name}_${enterpriseInfo.evaluationDate}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF导出失败:', error);
      throw new Error('PDF导出失败，请重试');
    }
  }

  /**
   * 导出封面页
   */
  static async exportCover(
    enterpriseInfo: EnterpriseInfo,
    evaluationResult: EvaluationResult
  ): Promise<void> {
    // 创建封面内容
    const coverContent = this.createCoverContent(enterpriseInfo, evaluationResult);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = coverContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm'; // A4宽度
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save(`清洁生产评价报告_封面_${enterpriseInfo.name}.pdf`);
    } finally {
      document.body.removeChild(tempDiv);
    }
  }

  /**
   * 导出数据摘要（JSON格式）
   */
  static exportDataSummary(data: ExportData): void {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `清洁生产评价数据_${data.enterpriseInfo.name}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * 导出Excel格式的数据
   */
  static exportExcelData(data: ExportData): void {
    // 创建CSV格式的数据
    const csvContent = this.createCSVContent(data);
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `清洁生产评价数据_${data.enterpriseInfo.name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * 创建封面内容HTML
   */
  private static createCoverContent(enterpriseInfo: EnterpriseInfo, evaluationResult: EvaluationResult): string {
    return `
      <div style="
        width: 210mm;
        height: 297mm;
        background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 40px;
        box-sizing: border-box;
        font-family: 'Microsoft YaHei', sans-serif;
      ">
        <h1 style="
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 40px;
          text-align: center;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">危险废物焚烧处置清洁生产评价报告</h1>

        <div style="
          text-align: center;
          margin-bottom: 60px;
        ">
          <div style="
            font-size: 48px;
            font-weight: bold;
            color: ${this.getLevelColor(evaluationResult.level)};
            margin-bottom: 20px;
          ">${evaluationResult.level}</div>
          <div style="font-size: 20px; opacity: 0.9;">
            <p>评价日期：${enterpriseInfo.evaluationDate}</p>
          </div>
        </div>

        <div style="
          border-top: 2px solid rgba(255,255,255,0.3);
          width: 80%;
          margin: 40px 0;
        "></div>

        <div style="
          text-align: center;
          margin-top: 40px;
        ">
          <h2 style="
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 20px;
          ">${enterpriseInfo.name}</h2>
          <p style="
            font-size: 16px;
            opacity: 0.8;
          ">
            标准依据：T/ZAEPI XXX—XXXX《危险废物焚烧处置行业清洁生产评价指标体系》
          </p>
        </div>
      </div>
    `;
  }

  /**
   * 创建CSV内容
   */
  private static createCSVContent(data: ExportData): string {
    const headers = [
      '类别',
      '指标名称',
      '指标值',
      '适用状态',
      'Ⅰ级得分',
      'Ⅱ级得分',
      'Ⅲ级得分',
      '最高得分',
      '等级'
    ];

    const rows = Object.entries(data.indicatorInputs).map(([indicatorId, input]) => {
      // 这里需要根据indicatorId获取指标信息
      // 简化处理，实际应该从指标配置中获取
      return [
        indicatorId,
        input.value,
        input.isApplicable ? '是' : '否',
        '0', // I级得分
        '0', // II级得分
        '0', // III级得分
        '0', // 最高得分
        '未评级' // 等级
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // 添加BOM以支持中文
    return '\ufeff' + csv;
  }

  /**
   * 获取等级对应的颜色
   */
  private static getLevelColor(level: string): string {
    switch (level) {
      case 'Ⅰ级':
        return '#52c41a';
      case 'Ⅱ级':
        return '#1890ff';
      case 'Ⅲ级':
        return '#faad14';
      default:
        return '#ff4d4f';
    }
  }
}

/**
 * 数据验证工具
 */
export class DataValidator {
  /**
   * 验证企业信息
   */
  static validateEnterpriseInfo(info: EnterpriseInfo): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!info.name?.trim()) {
      errors.push('企业名称不能为空');
    }

    if (!info.address?.trim()) {
      errors.push('企业地址不能为空');
    }

    if (!info.contactPerson?.trim()) {
      errors.push('联系人不能为空');
    }

    if (!info.contactPhone?.trim()) {
      errors.push('联系电话不能为空');
    } else if (!/^1[3-9]\d{9}$/.test(info.contactPhone)) {
      errors.push('联系电话格式不正确');
    }

    if (!info.reportPeriod?.trim()) {
      errors.push('统计报告期不能为空');
    }

    if (!info.evaluationDate) {
      errors.push('评价日期不能为空');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证指标输入数据
   */
  static validateIndicatorInputs(indicatorInputs: Record<string, any>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    Object.entries(indicatorInputs).forEach(([indicatorId, input]) => {
      if (!input.isApplicable) {
        return; // 不适用指标不验证
      }

      if (!input.value) {
        errors.push(`指标 ${indicatorId} 的值不能为空`);
      }

      // 可以添加更多验证规则
      if (input.type === 'quantitative' && isNaN(Number(input.value))) {
        errors.push(`指标 ${indicatorId} 必须是数字`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * 数据导出工具
 */
export const dataExporter = {
  /**
   * 导出评价数据
   */
  exportEvaluation(data: ExportData, format: 'pdf' | 'json' | 'csv' = 'pdf'): Promise<void> {
    switch (format) {
      case 'pdf':
        return ReportExporter.exportCompleteReport(
          data.enterpriseInfo,
          data.evaluationResult!,
          'report-content'
        );
      case 'json':
        ReportExporter.exportDataSummary(data);
        return Promise.resolve();
      case 'csv':
        ReportExporter.exportExcelData(data);
        return Promise.resolve();
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  },

  /**
   * 分步导出
   */
  exportStepByStep(data: ExportData) {
    return {
      exportCover: () => ReportExporter.exportCover(data.enterpriseInfo, data.evaluationResult!),
      exportData: (format: 'json' | 'csv' = 'json') => {
        if (format === 'json') {
          ReportExporter.exportDataSummary(data);
        } else {
          ReportExporter.exportExcelData(data);
        }
      },
      exportFullReport: () => this.exportEvaluation(data, 'pdf')
    };
  }
};