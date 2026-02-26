'use client';

import { SAFARecord } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ATADistributionProps {
  records: SAFARecord[];
}

export function ATADistribution({ records }: ATADistributionProps) {
  const ataCounts = records.reduce((acc, record) => {
    acc[record.ata] = (acc[record.ata] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(ataCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([ata, count]) => ({
      ata,
      'Bulgu Sayısı': count,
    }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-3">
        <h2 className="text-base font-bold text-gray-900">ATA Kod Dağılımı</h2>
        <p className="text-xs text-gray-600 mt-0.5">En sık görülen 10 ATA kodu</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="ata" 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip 
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Bulgu Sayısı" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
