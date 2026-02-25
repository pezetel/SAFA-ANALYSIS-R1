'use client';

import { SAFARecord } from '@/lib/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';
import { useState } from 'react';
import { DetailModal } from './DetailModal';

interface ATADistributionProps {
  records: SAFARecord[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function ATADistribution({ records }: ATADistributionProps) {
  const [selectedATA, setSelectedATA] = useState<string | null>(null);
  const [modalRecords, setModalRecords] = useState<SAFARecord[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const ataCounts = records.reduce((acc, record) => {
    acc[record.ata] = (acc[record.ata] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(ataCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([ata, count]) => ({
      name: ata,
      value: count,
      percentage: ((count / records.length) * 100).toFixed(1),
    }));

  const handleATAClick = (ata: string) => {
    const filtered = records.filter(r => r.ata === ata);
    setModalRecords(filtered);
    setSelectedATA(ata);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">ATA Chapter Dağılımı</h2>
          <p className="text-sm text-gray-600 mt-1">Top 8 sistem kategorisi (Tıklayarak detayları görün)</p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                activeIndex={activeIndex ?? undefined}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(data) => handleATAClick(data.name)}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 space-y-2">
          {chartData.slice(0, 5).map((item, index) => (
            <button
              key={item.name}
              onClick={() => handleATAClick(item.name)}
              className="w-full flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-medium text-gray-700 group-hover:text-blue-600">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600">{item.value} bulgu</span>
                <span className="font-semibold text-gray-900">{item.percentage}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedATA && (
        <DetailModal
          isOpen={!!selectedATA}
          onClose={() => setSelectedATA(null)}
          title={`ATA ${selectedATA} - Detaylı Bulgular`}
          records={modalRecords}
        />
      )}
    </>
  );
}
