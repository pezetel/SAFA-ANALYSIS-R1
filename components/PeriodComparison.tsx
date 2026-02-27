'use client';

import { SAFARecord } from '@/lib/types';
import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PeriodComparisonProps {
  records: SAFARecord[];
}

function formatDateForInput(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function parseTurkishDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const year = parseInt(parts[2]);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

export function PeriodComparison({ records }: PeriodComparisonProps) {
  const [period1Start, setPeriod1Start] = useState('');
  const [period1End, setPeriod1End] = useState('');
  const [period2Start, setPeriod2Start] = useState('');
  const [period2End, setPeriod2End] = useState('');

  const dateRange = useMemo(() => {
    if (records.length === 0) return { min: new Date(), max: new Date() };
    const dates = records.map(r => new Date(r.date).getTime());
    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates))
    };
  }, [records]);

  const quickSelect = (type: string) => {
    const midYear = new Date(dateRange.min.getFullYear(), 5, 30);

    switch(type) {
      case 'first6-last6':
        setPeriod1Start(formatDateForInput(dateRange.min));
        setPeriod1End(formatDateForInput(midYear));
        setPeriod2Start(formatDateForInput(new Date(midYear.getTime() + 86400000)));
        setPeriod2End(formatDateForInput(dateRange.max));
        break;
      case '2024-2025':
        setPeriod1Start('01/01/2024');
        setPeriod1End('31/12/2024');
        setPeriod2Start('01/01/2025');
        setPeriod2End('31/12/2025');
        break;
      case 'q1-q2':
        const year = dateRange.min.getFullYear();
        setPeriod1Start(`01/01/${year}`);
        setPeriod1End(`31/03/${year}`);
        setPeriod2Start(`01/04/${year}`);
        setPeriod2End(`30/06/${year}`);
        break;
      case 'q3-q4':
        const year2 = dateRange.min.getFullYear();
        setPeriod1Start(`01/07/${year2}`);
        setPeriod1End(`30/09/${year2}`);
        setPeriod2Start(`01/10/${year2}`);
        setPeriod2End(`31/12/${year2}`);
        break;
    }
  };

  const comparisonData = useMemo(() => {
    const p1Start = parseTurkishDate(period1Start);
    const p1End = parseTurkishDate(period1End);
    const p2Start = parseTurkishDate(period2Start);
    const p2End = parseTurkishDate(period2End);

    if (!p1Start || !p1End || !p2Start || !p2End) {
      return null;
    }

    const period1Records = records.filter(r => {
      const date = new Date(r.date);
      return date >= p1Start && date <= p1End;
    });

    const period2Records = records.filter(r => {
      const date = new Date(r.date);
      return date >= p2Start && date <= p2End;
    });

    // Component counts
    const p1Components = period1Records.reduce((acc, r) => {
      acc[r.component] = (acc[r.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const p2Components = period2Records.reduce((acc, r) => {
      acc[r.component] = (acc[r.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // All components
    const allComponents = Array.from(new Set([...Object.keys(p1Components), ...Object.keys(p2Components)]));

    const componentComparison = allComponents.map(comp => {
      const p1Count = p1Components[comp] || 0;
      const p2Count = p2Components[comp] || 0;
      const change = p2Count - p1Count;
      const changePercent = p1Count > 0 ? (change / p1Count) * 100 : (p2Count > 0 ? 100 : 0);
      return {
        component: comp.replace(/_/g, ' '),
        period1: p1Count,
        period2: p2Count,
        change,
        changePercent
      };
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    return {
      period1: {
        total: period1Records.length,
        records: period1Records,
        dateRange: `${period1Start} - ${period1End}`
      },
      period2: {
        total: period2Records.length,
        records: period2Records,
        dateRange: `${period2Start} - ${period2End}`
      },
      totalChange: period2Records.length - period1Records.length,
      totalChangePercent: period1Records.length > 0 ? ((period2Records.length - period1Records.length) / period1Records.length) * 100 : 0,
      componentComparison: componentComparison.slice(0, 10),
      increased: componentComparison.filter(c => c.change > 0).slice(0, 5),
      decreased: componentComparison.filter(c => c.change < 0).slice(0, 5)
    };
  }, [records, period1Start, period1End, period2Start, period2End]);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Donem Secimi</h2>
        
        {/* Quick Select Buttons */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => quickSelect('first6-last6')}
            className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Ilk 6 Ay vs Son 6 Ay
          </button>
          <button
            onClick={() => quickSelect('2024-2025')}
            className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            2024 vs 2025
          </button>
          <button
            onClick={() => quickSelect('q1-q2')}
            className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Q1 vs Q2
          </button>
          <button
            onClick={() => quickSelect('q3-q4')}
            className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Q3 vs Q4
          </button>
        </div>

        {/* Custom Date Selection */}
        <div className="grid grid-cols-2 gap-6">
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Donem 1</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Baslangic (gg/aa/yyyy)</label>
                <input
                  type="text"
                  placeholder="01/01/2024"
                  value={period1Start}
                  onChange={(e) => setPeriod1Start(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Bitis (gg/aa/yyyy)</label>
                <input
                  type="text"
                  placeholder="31/12/2024"
                  value={period1End}
                  onChange={(e) => setPeriod1End(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>
          </div>
          <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
            <h3 className="text-sm font-semibold text-purple-900 mb-3">Donem 2</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Baslangic (gg/aa/yyyy)</label>
                <input
                  type="text"
                  placeholder="01/01/2025"
                  value={period2Start}
                  onChange={(e) => setPeriod2Start(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Bitis (gg/aa/yyyy)</label>
                <input
                  type="text"
                  placeholder="31/12/2025"
                  value={period2End}
                  onChange={(e) => setPeriod2End(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Results */}
      {comparisonData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Donem 1 Toplam</h3>
              <p className="text-3xl font-bold text-blue-600">{comparisonData.period1.total}</p>
              <p className="text-xs text-gray-500 mt-1">bulgu</p>
              <p className="text-xs text-blue-600 mt-2">{comparisonData.period1.dateRange}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Donem 2 Toplam</h3>
              <p className="text-3xl font-bold text-purple-600">{comparisonData.period2.total}</p>
              <p className="text-xs text-gray-500 mt-1">bulgu</p>
              <p className="text-xs text-purple-600 mt-2">{comparisonData.period2.dateRange}</p>
            </div>
            <div className={`bg-white rounded-xl border border-gray-200 p-6 ${comparisonData.totalChange > 0 ? 'border-red-200 bg-red-50' : comparisonData.totalChange < 0 ? 'border-green-200 bg-green-50' : ''}`}>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Degisim</h3>
              <div className="flex items-center gap-2">
                {comparisonData.totalChange > 0 ? (
                  <TrendingUp className="h-6 w-6 text-red-600" />
                ) : comparisonData.totalChange < 0 ? (
                  <TrendingDown className="h-6 w-6 text-green-600" />
                ) : (
                  <Minus className="h-6 w-6 text-gray-600" />
                )}
                <div>
                  <p className={`text-3xl font-bold ${comparisonData.totalChange > 0 ? 'text-red-600' : comparisonData.totalChange < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {comparisonData.totalChange > 0 ? '+' : ''}{comparisonData.totalChange}
                  </p>
                  <p className="text-xs text-gray-600">
                    {comparisonData.totalChangePercent > 0 ? '+' : ''}{comparisonData.totalChangePercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Changes */}
          <div className="grid grid-cols-2 gap-6">
            {/* Most Increased */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-600" />
                En Cok Artan Problemler
              </h3>
              <div className="space-y-2">
                {comparisonData.increased.length > 0 ? (
                  comparisonData.increased.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.component}</p>
                        <p className="text-xs text-gray-600">{item.period1} → {item.period2}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">+{item.change}</p>
                        <p className="text-xs text-red-600">+{item.changePercent.toFixed(0)}%</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Artan problem yok</p>
                )}
              </div>
            </div>

            {/* Most Decreased */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-green-600" />
                En Cok Azalan Problemler
              </h3>
              <div className="space-y-2">
                {comparisonData.decreased.length > 0 ? (
                  comparisonData.decreased.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.component}</p>
                        <p className="text-xs text-gray-600">{item.period1} → {item.period2}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{item.change}</p>
                        <p className="text-xs text-green-600">{item.changePercent.toFixed(0)}%</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Azalan problem yok</p>
                )}
              </div>
            </div>
          </div>

          {/* Comparison Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Komponent Karsilastirmasi</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData.componentComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="component" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    stroke="#6b7280"
                    style={{ fontSize: '10px' }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="period1" fill="#3b82f6" name="Donem 1" />
                  <Bar dataKey="period2" fill="#8b5cf6" name="Donem 2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Karsilastirma yapmak icin yukardaki hizli secim butonlarini kullanin veya tarih araliklari girin</p>
          <p className="text-xs text-gray-400 mt-2">Tarih formati: gg/aa/yyyy (ornek: 01/01/2024)</p>
        </div>
      )}
    </div>
  );
}
