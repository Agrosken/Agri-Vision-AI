
import React from 'react';
import type { AnalysisReport } from '../types';

interface ReportDisplayProps {
  report: AnalysisReport;
}

const HealthScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = () => {
    if (score > 80) return 'text-green-500';
    if (score > 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="text-center">
      <p className="text-sm text-gray-500">Overall Health Score</p>
      <p className={`text-6xl font-bold ${getScoreColor()}`}>{score}<span className="text-3xl">%</span></p>
    </div>
  );
};

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-700">Analysis Report</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-lg border">
        <div className="md:col-span-1 flex justify-center items-center">
          <HealthScoreGauge score={report.healthScore} />
        </div>
        <div className="md:col-span-2">
            <h4 className="font-semibold text-gray-700">Health Summary</h4>
            <p className="text-gray-600 italic">"{report.healthSummary}"</p>
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-gray-700">Detailed Findings</h4>
        <div className="prose prose-sm max-w-none mt-2 text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-md border">
          {report.detailedReport}
        </div>
      </div>
    </div>
  );
};

export default ReportDisplay;
