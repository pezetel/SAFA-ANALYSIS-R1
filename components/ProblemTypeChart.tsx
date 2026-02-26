'use client';

import { SAFARecord } from '@/lib/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ProblemTypeChartProps {
  records: SAFARecord[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ProblemTypeChart({ records }: ProblemTypeChartProps) {
  const typeCounts = records.reduce((acc, record) => {
    acc[record.problemType] = (acc[record.problemType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-3">
        <h2 className="text-base font-bold text-gray-900">Problem Tipleri</h2>
        <p className="text-xs text-gray-600 mt-0.5">Bulgu türlerine göre dağılım</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
