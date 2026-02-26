'use client';

import { SAFARecord } from '@/lib/types';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendChartProps {
  records: SAFARecord[];
}

export function TrendChart({ records }: TrendChartProps) {
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

  // Trend hesaplama
  const values = Object.values(monthlyData);
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const trendPercentage = ((avgSecond - avgFirst) / avgFirst) * 100;

  const getTrendIcon = () => {
    if (trendPercentage > 5) return <TrendingUp className="h-5 w-5 text-red-500" />;
    if (trendPercentage < -5) return <TrendingDown className="h-5 w-5 text-green-500" />;
    return <Minus className="h-5 w-5 text-gray-500" />;
  };

  const getTrendColor = () => {
    if (trendPercentage > 5) return 'text-red-600 bg-red-50';
    if (trendPercentage < -5) return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Zaman Serisi Analizi</h2>
          <p className="text-xs text-gray-600 mt-0.5">Aylık bulgu sayıları trendi ve tahminler</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${getTrendColor()}`}>
          {getTrendIcon()}
          <div className="text-right">
            <div className="text-xs font-medium">Trend</div>
            <div className="text-sm font-bold">{trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                fontSize: '12px',
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Area
              type="monotone" 
              dataKey="count" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fill="url(#colorCount)"
              name="Bulgu Sayısı"
              dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 pt-3 border-t border-gray-200">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 font-medium">Ortalama/Ay</p>
          <p className="text-lg font-bold text-blue-900">
            {(records.length / Math.max(chartData.length, 1)).toFixed(0)}
          </p>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <p className="text-xs text-red-700 font-medium">En Yüksek</p>
          <p className="text-lg font-bold text-red-900">
            {Math.max(...Object.values(monthlyData))}
          </p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-xs text-green-700 font-medium">En Düşük</p>
          <p className="text-lg font-bold text-green-900">
            {Math.min(...Object.values(monthlyData))}
          </p>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <p className="text-xs text-purple-700 font-medium">Standart Sapma</p>
          <p className="text-lg font-bold text-purple-900">
            {(() => {
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
              return Math.sqrt(variance).toFixed(1);
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
