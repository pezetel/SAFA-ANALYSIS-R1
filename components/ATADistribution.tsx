'use client';

import { SAFARecord } from '@/lib/types';
import { getATADescription } from '@/lib/ataLookup';
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
      description: getATADescription(ata),
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 max-w-[200px]">
          <p className="font-semibold text-gray-900 text-xs">ATA {data.name}</p>
          {data.description && (
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight truncate">{data.description}</p>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[11px] text-gray-600">{data.value} findings</span>
            <span className="text-[11px] font-semibold text-blue-600">{data.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">ATA Chapter Distribution</h2>
          <p className="text-sm text-gray-600 mt-1">Top 8 system categories (Click to view details)</p>
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 space-y-0.5">
          {chartData.map((item, index) => (
            <button
              key={item.name}
              onClick={() => handleATAClick(item.name)}
              className="w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                  {item.name}
                </span>
                {item.description && (
                  <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                    {item.description}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-[11px] text-gray-400">{item.value}</span>
                <span className="text-xs font-bold text-gray-800 min-w-[36px] text-right">{item.percentage}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedATA && (
        <DetailModal
          isOpen={!!selectedATA}
          onClose={() => setSelectedATA(null)}
          title={`ATA ${selectedATA} – ${getATADescription(selectedATA) || 'Detailed Findings'}`}
          records={modalRecords}
        />
      )}
    </>
  );
}
