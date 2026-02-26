'use client';

import { SAFARecord } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';

interface TrendChartProps {
  records: SAFARecord[];
}

export function TrendChart({ records }: TrendChartProps) {
  // Group by month
  const monthlyData = records.reduce((acc, record) => {
    const monthKey = format(startOfMonth(new Date(record.date)), 'yyyy-MM');
    if (!acc[monthKey]) {
      acc[monthKey] = 0;
    }
    acc[monthKey]++;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month: format(parseISO(month + '-01'), 'MMM yyyy', { locale: tr }),
      count,
    }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Zaman Serisi Analizi</h2>
        <p className="text-sm text-gray-600 mt-1">Aylık bulgu sayıları trendi</p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
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
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Bulgu Sayısı"
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600">Ortalama/Ay</p>
          <p className="text-lg font-bold text-gray-900">
            {(records.length / Math.max(chartData.length, 1)).toFixed(0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">En Yüksek</p>
          <p className="text-lg font-bold text-red-600">
            {Math.max(...Object.values(monthlyData))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">En Düşük</p>
          <p className="text-lg font-bold text-green-600">
            {Math.min(...Object.values(monthlyData))}
          </p>
        </div>
      </div>
    </div>
  );
}
