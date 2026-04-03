'use client';

import { SAFARecord, EODRecord } from '@/lib/types';
import { getOverallMonthlyRate } from '@/lib/eodProcessor';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart, ReferenceLine } from 'recharts';
import { format, parseISO, startOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useMemo, useState } from 'react';

interface TrendChartProps {
  records: SAFARecord[];
  eodRecords?: EODRecord[];
}

export function TrendChart({ records, eodRecords }: TrendChartProps) {
  const [showRate, setShowRate] = useState(true);
  const hasEOD = eodRecords && eodRecords.length > 0;

  const monthlyData = records.reduce((acc, record) => {
    const monthKey = format(startOfMonth(new Date(record.date)), 'yyyy-MM');
    if (!acc[monthKey]) {
      acc[monthKey] = 0;
    }
    acc[monthKey]++;
    return acc;
  }, {} as Record<string, number>);

  const sortedMonths = Object.keys(monthlyData).sort();
  const values = sortedMonths.map(month => monthlyData[month]);

  const eodRateData = useMemo(() => {
    if (!hasEOD) return null;
    return getOverallMonthlyRate(records, eodRecords!);
  }, [records, eodRecords, hasEOD]);

  const avgRate = useMemo(() => {
    if (!eodRateData) return 0;
    const withData = eodRateData.filter(m => m.eods > 0);
    if (withData.length === 0) return 0;
    return withData.reduce((sum, m) => sum + m.rate, 0) / withData.length;
  }, [eodRateData]);

  const chartData = useMemo(() => {
    if (!hasEOD || !eodRateData) {
      return sortedMonths.map((month) => ({
        month: format(parseISO(month + '-01'), 'MMM yyyy', { locale: enUS }),
        count: monthlyData[month],
      }));
    }

    const allMonths = Array.from(new Set([
      ...sortedMonths,
      ...eodRateData.map(d => d.month),
    ])).sort();

    return allMonths.map(month => {
      const eodEntry = eodRateData.find(d => d.month === month);
      return {
        month: format(parseISO(month + '-01'), 'MMM yyyy', { locale: enUS }),
        rawMonth: month,
        count: monthlyData[month] || 0,
        eods: eodEntry?.eods || 0,
        rate: eodEntry?.rate ? parseFloat(eodEntry.rate.toFixed(3)) : 0,
      };
    });
  }, [sortedMonths, monthlyData, eodRateData, hasEOD]);

  const n = values.length;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0]?.payload;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-bold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-600">Findings:</span>
            <span className="font-bold">{data?.count || 0}</span>
          </p>
          {hasEOD && (
            <>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-gray-600">EODs:</span>
                <span className="font-bold">{data?.eods || 0}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-gray-600">Rate:</span>
                <span className={`font-bold ${
                  data?.rate > avgRate * 1.5 ? 'text-red-600' : data?.rate > avgRate ? 'text-yellow-600' : 'text-green-600'
                }`}>{data?.rate?.toFixed(3) || '0'}</span>
              </p>
              <hr className="border-gray-100" />
              <p className="text-gray-400">Avg Rate: {avgRate.toFixed(3)}</p>
            </>
          )}
        </div>
      </div>
    );
  };

  // Custom label for Avg Rate — sits just right of the plot area, between chart and outer edge
  const AvgRateLabel = (props: any) => {
    const { viewBox } = props;
    // Position: right edge of plot area + small gap
    const x = viewBox.x + viewBox.width + 4;
    const y = viewBox.y;
    return (
      <g>
        <rect
          x={x}
          y={y - 8}
          width={50}
          height={16}
          rx={3}
          fill="#fef2f2"
          stroke="#fca5a5"
          strokeWidth={0.5}
        />
        <text
          x={x + 4}
          y={y + 3}
          fill="#dc2626"
          fontSize={8}
          fontWeight={700}
        >
          Avg {avgRate.toFixed(2)}
        </text>
      </g>
    );
  };

  // Custom label for Alert 1.5x — same positioning logic
  const AlertLabel = (props: any) => {
    const { viewBox } = props;
    const x = viewBox.x + viewBox.width + 4;
    const y = viewBox.y;
    return (
      <g opacity={0.8}>
        <rect
          x={x}
          y={y - 8}
          width={50}
          height={16}
          rx={3}
          fill="#fef2f2"
          stroke="#fca5a5"
          strokeWidth={0.5}
          opacity={0.7}
        />
        <text
          x={x + 4}
          y={y + 3}
          fill="#dc2626"
          fontSize={8}
          fontWeight={600}
          opacity={0.8}
        >
          1.5× Avg
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Time Series Analysis</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Monthly finding counts
            {hasEOD && ' with EOD-based finding rate'}
          </p>
        </div>
        {hasEOD && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRate(!showRate)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                showRate
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              {showRate ? '📊 Rate ON' : '📊 Rate OFF'}
            </button>
          </div>
        )}
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {hasEOD && showRate ? (
            <ComposedChart data={chartData} margin={{ top: 8, right: 60, left: 0, bottom: 0 }}>
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
                yAxisId="left"
                stroke="#6b7280"
                style={{ fontSize: '11px' }}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#f59e0b"
                style={{ fontSize: '11px' }}
                tick={{ fill: '#f59e0b' }}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              <ReferenceLine
                yAxisId="right"
                y={avgRate}
                stroke="#ef4444"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={<AvgRateLabel />}
              />
              {avgRate > 0 && (
                <ReferenceLine
                  yAxisId="right"
                  y={avgRate * 1.5}
                  stroke="#ef4444"
                  strokeDasharray="2 4"
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  label={<AlertLabel />}
                />
              )}
              <Area
                yAxisId="left"
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fill="url(#colorCount)"
                name="Finding Count"
                dot={{ fill: '#3b82f6', r: 3, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5, strokeWidth: 2 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="rate"
                stroke="#f59e0b"
                strokeWidth={2.5}
                name="Finding Rate (F/EOD)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isAlert = payload.rate > avgRate * 1.5;
                  const isWatch = payload.rate > avgRate && !isAlert;
                  return (
                    <circle
                      key={`dot-${cx}-${cy}`}
                      cx={cx}
                      cy={cy}
                      r={isAlert ? 6 : isWatch ? 5 : 4}
                      fill={isAlert ? '#ef4444' : isWatch ? '#f59e0b' : '#22c55e'}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 7, strokeWidth: 2 }}
              />
            </ComposedChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 5, right: 15, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCountOnly" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#colorCountOnly)"
                name="Finding Count"
                dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className={`mt-4 grid gap-3 pt-3 border-t border-gray-200 ${hasEOD ? 'grid-cols-5' : 'grid-cols-4'}`}>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 font-medium">Average/Month</p>
          <p className="text-lg font-bold text-blue-900">
            {n > 0 ? (values.reduce((a, b) => a + b, 0) / n).toFixed(0) : 0}
          </p>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <p className="text-xs text-red-700 font-medium">Highest</p>
          <p className="text-lg font-bold text-red-900">
            {n > 0 ? Math.max(...values) : 0}
          </p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-xs text-green-700 font-medium">Lowest</p>
          <p className="text-lg font-bold text-green-900">
            {n > 0 ? Math.min(...values) : 0}
          </p>
        </div>
        {hasEOD && (
          <div className="text-center p-2 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-700 font-medium">Avg Rate (F/EOD)</p>
            <p className="text-lg font-bold text-amber-900">
              {avgRate.toFixed(3)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
