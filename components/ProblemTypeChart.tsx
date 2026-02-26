'use client';

import { SAFARecord } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useState } from 'react';
import { DetailModal } from './DetailModal';

interface ProblemTypeChartProps {
  records: SAFARecord[];
}

const COLORS: Record<string, string> = {
  MISSING: '#ef4444',
  DAMAGED: '#f59e0b',
  LOOSE: '#eab308',
  INOPERATIVE: '#8b5cf6',
  CLEANLINESS: '#06b6d4',
  LOW_LEVEL: '#14b8a6',
  ADJUSTMENT: '#10b981',
  OTHER: '#6b7280',
};

export function ProblemTypeChart({ records }: ProblemTypeChartProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [modalRecords, setModalRecords] = useState<SAFARecord[]>([]);

  const problemCounts = records.reduce((acc, record) => {
    acc[record.problemType] = (acc[record.problemType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(problemCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({
      type: type,
      originalType: type,
      count,
      percentage: ((count / records.length) * 100).toFixed(1),
    }));

  const handleTypeClick = (type: string) => {
    const filtered = records.filter(r => r.problemType === type);
    setModalRecords(filtered);
    setSelectedType(type);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Problem Tipi Dağılımı</h2>
          <p className="text-sm text-gray-600 mt-1">Bulgu türlerine göre analiz (Tıklayarak detayları görün)</p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="type" 
                stroke="#6b7280"
                style={{ fontSize: '11px', cursor: 'pointer' }}
                angle={-15}
                textAnchor="end"
                height={70}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${value} bulgu (${props.payload.percentage}%)`,
                  'Sayı'
                ]}
              />
              <Bar 
                dataKey="count" 
                radius={[8, 8, 0, 0]}
                onClick={(data) => handleTypeClick(data.originalType)}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.originalType] || '#6b7280'}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {chartData.slice(0, 4).map((item) => (
            <button
              key={item.originalType}
              onClick={() => handleTypeClick(item.originalType)}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[item.originalType] || '#6b7280' }}
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{item.type}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedType && (
        <DetailModal
          isOpen={!!selectedType}
          onClose={() => setSelectedType(null)}
          title={`${selectedType} - Detaylı Bulgular`}
          records={modalRecords}
        />
      )}
    </>
  );
}
