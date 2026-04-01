'use client';

import { SAFARecord } from '@/lib/types';
import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Plane } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface PeriodComparisonProps {
  records: SAFARecord[];
}

const AIRCRAFT_TYPES = {
  'B737-NG': [
    'TC-SEI', 'TC-SEJ', 'TC-SEK', 'TC-SEM', 'TC-SEN', 'TC-SEO', 'TC-SEP', 'TC-SEU', 'TC-SEY', 'TC-SEZ',
    'TC-SNN', 'TC-SNR', 'TC-SNT', 'TC-SNU', 'TC-SNV', 'TC-SOA', 'TC-SOB', 'TC-SUU', 'TC-SOC', 'TC-SOD',
    'TC-SOE', 'TC-SOF', 'TC-SOG', 'TC-SOH', 'TC-SON', 'TC-SOO', 'TC-SOP', 'TC-SOR', 'TC-SOV', 'TC-SOY',
    'TC-SOZ', 'TC-SPA', 'TC-SPB', 'TC-SPC', 'TC-SPD', 'TC-SPH', 'TC-SPE', 'TC-SPF', 'TC-SPI', 'TC-SPJ',
    'TC-SPK', 'TC-SPT', 'TC-SPM', 'TC-SPP', 'TC-SPN', 'TC-SPU', 'TC-SPR', 'TC-SPO', 'TC-SPS', 'TC-SPV',
    'TC-SRB', 'TC-SRC', 'TC-SPY', 'TC-SPZ', 'TC-SRG', 'TC-SRE', 'TC-SRF'
  ],
  'B737-MAX': [
    'TC-SOI', 'TC-SOJ', 'TC-SOL', 'TC-SMA', 'TC-SMD', 'TC-SMB', 'TC-SME', 'TC-SOK', 'TC-SOM', 'TC-SLA',
    'TC-SLB', 'TC-SLC', 'TC-SLD', 'TC-SMR', 'TC-SMS', 'TC-SMT', 'TC-SLE', 'TC-SLF', 'TC-SMJ', 'TC-SMK',
    'TC-SML', 'TC-SMN', 'TC-SMP', 'TC-SMF', 'TC-SMI', 'TC-SMU', 'TC-SMV', 'TC-SMZ'
  ]
};

function formatDateForInput(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function parseInputDate(dateStr: string): Date | null {
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
  const [comparisonMode, setComparisonMode] = useState<'period' | 'aircraft' | 'fleet'>('period');
  
  // Period comparison state
  const [period1Start, setPeriod1Start] = useState('');
  const [period1End, setPeriod1End] = useState('');
  const [period2Start, setPeriod2Start] = useState('');
  const [period2End, setPeriod2End] = useState('');

  // Aircraft comparison state
  const [selectedPeriodStart, setSelectedPeriodStart] = useState('');
  const [selectedPeriodEnd, setSelectedPeriodEnd] = useState('');
  const [aircraft1, setAircraft1] = useState('');
  const [aircraft2, setAircraft2] = useState('');

  const allAircraft = useMemo(() => {
    return Array.from(new Set(records.map(r => r.aircraft))).sort();
  }, [records]);

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

  const periodComparisonData = useMemo(() => {
    const p1Start = parseInputDate(period1Start);
    const p1End = parseInputDate(period1End);
    const p2Start = parseInputDate(period2Start);
    const p2End = parseInputDate(period2End);

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

  const aircraftComparisonData = useMemo(() => {
    const pStart = parseInputDate(selectedPeriodStart);
    const pEnd = parseInputDate(selectedPeriodEnd);

    if (!pStart || !pEnd || !aircraft1 || !aircraft2) {
      return null;
    }

    const periodRecords = records.filter(r => {
      const date = new Date(r.date);
      return date >= pStart && date <= pEnd;
    });

    const ac1Records = periodRecords.filter(r => r.aircraft === aircraft1);
    const ac2Records = periodRecords.filter(r => r.aircraft === aircraft2);

    // Component counts for each aircraft
    const ac1Components = ac1Records.reduce((acc, r) => {
      acc[r.component] = (acc[r.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ac2Components = ac2Records.reduce((acc, r) => {
      acc[r.component] = (acc[r.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const allComponents = Array.from(new Set([...Object.keys(ac1Components), ...Object.keys(ac2Components)]));

    const componentComparison = allComponents.map(comp => {
      const ac1Count = ac1Components[comp] || 0;
      const ac2Count = ac2Components[comp] || 0;
      const diff = ac2Count - ac1Count;
      return {
        component: comp.replace(/_/g, ' '),
        aircraft1: ac1Count,
        aircraft2: ac2Count,
        difference: diff
      };
    }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

    // Problem type breakdown
    const ac1Problems = ac1Records.reduce((acc, r) => {
      acc[r.problemType] = (acc[r.problemType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ac2Problems = ac2Records.reduce((acc, r) => {
      acc[r.problemType] = (acc[r.problemType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const allProblemTypes = Array.from(new Set([...Object.keys(ac1Problems), ...Object.keys(ac2Problems)]));

    const radarData = allProblemTypes.map(type => ({
      problemType: type,
      [aircraft1]: ac1Problems[type] || 0,
      [aircraft2]: ac2Problems[type] || 0
    }));

    return {
      aircraft1: {
        name: aircraft1,
        total: ac1Records.length,
        records: ac1Records
      },
      aircraft2: {
        name: aircraft2,
        total: ac2Records.length,
        records: ac2Records
      },
      dateRange: `${selectedPeriodStart} - ${selectedPeriodEnd}`,
      componentComparison: componentComparison.slice(0, 10),
      radarData,
      higher: componentComparison.filter(c => c.difference < 0).slice(0, 5),
      lower: componentComparison.filter(c => c.difference > 0).slice(0, 5)
    };
  }, [records, selectedPeriodStart, selectedPeriodEnd, aircraft1, aircraft2]);

  const fleetComparisonData = useMemo(() => {
    const pStart = parseInputDate(selectedPeriodStart);
    const pEnd = parseInputDate(selectedPeriodEnd);

    if (!pStart || !pEnd) {
      return null;
    }

    const periodRecords = records.filter(r => {
      const date = new Date(r.date);
      return date >= pStart && date <= pEnd;
    });

    const ngRecords = periodRecords.filter(r => AIRCRAFT_TYPES['B737-NG'].includes(r.aircraft));
    const maxRecords = periodRecords.filter(r => AIRCRAFT_TYPES['B737-MAX'].includes(r.aircraft));

    // Component counts for each fleet
    const ngComponents = ngRecords.reduce((acc, r) => {
      acc[r.component] = (acc[r.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const maxComponents = maxRecords.reduce((acc, r) => {
      acc[r.component] = (acc[r.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const allComponents = Array.from(new Set([...Object.keys(ngComponents), ...Object.keys(maxComponents)]));

    const componentComparison = allComponents.map(comp => {
      const ngCount = ngComponents[comp] || 0;
      const maxCount = maxComponents[comp] || 0;
      const diff = maxCount - ngCount;
      return {
        component: comp.replace(/_/g, ' '),
        ng: ngCount,
        max: maxCount,
        difference: diff
      };
    }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

    // Problem type breakdown for radar
    const ngProblems = ngRecords.reduce((acc, r) => {
      acc[r.problemType] = (acc[r.problemType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const maxProblems = maxRecords.reduce((acc, r) => {
      acc[r.problemType] = (acc[r.problemType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const allProblemTypes = Array.from(new Set([...Object.keys(ngProblems), ...Object.keys(maxProblems)]));

    const radarData = allProblemTypes.map(type => ({
      problemType: type,
      'B737-NG': ngProblems[type] || 0,
      'B737-MAX': maxProblems[type] || 0
    }));

    // Per-aircraft averages
    const ngAircraftCount = new Set(ngRecords.map(r => r.aircraft)).size;
    const maxAircraftCount = new Set(maxRecords.map(r => r.aircraft)).size;

    return {
      ng: {
        total: ngRecords.length,
        aircraftCount: ngAircraftCount,
        avgPerAircraft: ngAircraftCount > 0 ? (ngRecords.length / ngAircraftCount).toFixed(1) : '0'
      },
      max: {
        total: maxRecords.length,
        aircraftCount: maxAircraftCount,
        avgPerAircraft: maxAircraftCount > 0 ? (maxRecords.length / maxAircraftCount).toFixed(1) : '0'
      },
      dateRange: `${selectedPeriodStart} - ${selectedPeriodEnd}`,
      componentComparison: componentComparison.slice(0, 10),
      radarData,
      ngHigher: componentComparison.filter(c => c.difference < 0).slice(0, 5),
      maxHigher: componentComparison.filter(c => c.difference > 0).slice(0, 5)
    };
  }, [records, selectedPeriodStart, selectedPeriodEnd]);

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setComparisonMode('period')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              comparisonMode === 'period'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Period vs Period
          </button>
          <button
            onClick={() => setComparisonMode('aircraft')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              comparisonMode === 'aircraft'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Aircraft vs Aircraft
          </button>
          <button
            onClick={() => setComparisonMode('fleet')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              comparisonMode === 'fleet'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            NG Fleet vs MAX Fleet
          </button>
        </div>
      </div>

      {/* PERIOD vs PERIOD */}
      {comparisonMode === 'period' && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Period Selection</h2>
            
            {/* Quick Select Buttons */}
            <div className="mb-4 flex gap-2 flex-wrap">
              <button
                onClick={() => quickSelect('first6-last6')}
                className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                First 6 Months vs Last 6 Months
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
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Period 1</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Start (dd/mm/yyyy)</label>
                    <input
                      type="text"
                      placeholder="01/01/2024"
                      value={period1Start}
                      onChange={(e) => setPeriod1Start(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">End (dd/mm/yyyy)</label>
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
                <h3 className="text-sm font-semibold text-purple-900 mb-3">Period 2</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Start (dd/mm/yyyy)</label>
                    <input
                      type="text"
                      placeholder="01/01/2025"
                      value={period2Start}
                      onChange={(e) => setPeriod2Start(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">End (dd/mm/yyyy)</label>
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

          {/* Period Comparison Results */}
          {periodComparisonData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Period 1 Total</h3>
                  <p className="text-3xl font-bold text-blue-600">{periodComparisonData.period1.total}</p>
                  <p className="text-xs text-gray-500 mt-1">findings</p>
                  <p className="text-xs text-blue-600 mt-2">{periodComparisonData.period1.dateRange}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Period 2 Total</h3>
                  <p className="text-3xl font-bold text-purple-600">{periodComparisonData.period2.total}</p>
                  <p className="text-xs text-gray-500 mt-1">findings</p>
                  <p className="text-xs text-purple-600 mt-2">{periodComparisonData.period2.dateRange}</p>
                </div>
                <div className={`bg-white rounded-xl border border-gray-200 p-6 ${periodComparisonData.totalChange > 0 ? 'border-red-200 bg-red-50' : periodComparisonData.totalChange < 0 ? 'border-green-200 bg-green-50' : ''}`}>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Change</h3>
                  <div className="flex items-center gap-2">
                    {periodComparisonData.totalChange > 0 ? (
                      <TrendingUp className="h-6 w-6 text-red-600" />
                    ) : periodComparisonData.totalChange < 0 ? (
                      <TrendingDown className="h-6 w-6 text-green-600" />
                    ) : (
                      <Minus className="h-6 w-6 text-gray-600" />
                    )}
                    <div>
                      <p className={`text-3xl font-bold ${periodComparisonData.totalChange > 0 ? 'text-red-600' : periodComparisonData.totalChange < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {periodComparisonData.totalChange > 0 ? '+' : ''}{periodComparisonData.totalChange}
                      </p>
                      <p className="text-xs text-gray-600">
                        {periodComparisonData.totalChangePercent > 0 ? '+' : ''}{periodComparisonData.totalChangePercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Changes */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-red-600" />
                    Most Increased Problems
                  </h3>
                  <div className="space-y-2">
                    {periodComparisonData.increased.length > 0 ? (
                      periodComparisonData.increased.map((item, idx) => (
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
                      <p className="text-sm text-gray-500 text-center py-4">No increased problems</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-green-600" />
                    Most Decreased Problems
                  </h3>
                  <div className="space-y-2">
                    {periodComparisonData.decreased.length > 0 ? (
                      periodComparisonData.decreased.map((item, idx) => (
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
                      <p className="text-sm text-gray-500 text-center py-4">No decreased problems</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Comparison Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Component Comparison</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={periodComparisonData.componentComparison}>
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
                      <Bar dataKey="period1" fill="#3b82f6" name="Period 1" />
                      <Bar dataKey="period2" fill="#8b5cf6" name="Period 2" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* AIRCRAFT vs AIRCRAFT */}
      {comparisonMode === 'aircraft' && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Aircraft Comparison</h2>
            
            {/* Period Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Period (dd/mm/yyyy)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Start: 01/01/2024"
                  value={selectedPeriodStart}
                  onChange={(e) => setSelectedPeriodStart(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="End: 31/12/2024"
                  value={selectedPeriodEnd}
                  onChange={(e) => setSelectedPeriodEnd(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Aircraft Selection */}
            <div className="grid grid-cols-2 gap-6">
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Aircraft 1</h3>
                <select
                  value={aircraft1}
                  onChange={(e) => setAircraft1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select Aircraft</option>
                  {allAircraft.map(ac => (
                    <option key={ac} value={ac}>{ac}</option>
                  ))}
                </select>
              </div>
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <h3 className="text-sm font-semibold text-purple-900 mb-3">Aircraft 2</h3>
                <select
                  value={aircraft2}
                  onChange={(e) => setAircraft2(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="">Select Aircraft</option>
                  {allAircraft.map(ac => (
                    <option key={ac} value={ac}>{ac}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Aircraft Comparison Results */}
          {aircraftComparisonData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="h-5 w-5 text-blue-600" />
                    <h3 className="text-sm font-medium text-gray-600">{aircraftComparisonData.aircraft1.name}</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{aircraftComparisonData.aircraft1.total}</p>
                  <p className="text-xs text-gray-500 mt-1">findings</p>
                  <p className="text-xs text-blue-600 mt-2">{aircraftComparisonData.dateRange}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="h-5 w-5 text-purple-600" />
                    <h3 className="text-sm font-medium text-gray-600">{aircraftComparisonData.aircraft2.name}</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">{aircraftComparisonData.aircraft2.total}</p>
                  <p className="text-xs text-gray-500 mt-1">findings</p>
                  <p className="text-xs text-purple-600 mt-2">{aircraftComparisonData.dateRange}</p>
                </div>
                <div className={`bg-white rounded-xl border border-gray-200 p-6 ${aircraftComparisonData.aircraft2.total > aircraftComparisonData.aircraft1.total ? 'border-red-200 bg-red-50' : aircraftComparisonData.aircraft2.total < aircraftComparisonData.aircraft1.total ? 'border-green-200 bg-green-50' : ''}`}>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Difference</h3>
                  <div className="flex items-center gap-2">
                    {aircraftComparisonData.aircraft2.total > aircraftComparisonData.aircraft1.total ? (
                      <TrendingUp className="h-6 w-6 text-red-600" />
                    ) : aircraftComparisonData.aircraft2.total < aircraftComparisonData.aircraft1.total ? (
                      <TrendingDown className="h-6 w-6 text-green-600" />
                    ) : (
                      <Minus className="h-6 w-6 text-gray-600" />
                    )}
                    <div>
                      <p className={`text-3xl font-bold ${aircraftComparisonData.aircraft2.total > aircraftComparisonData.aircraft1.total ? 'text-red-600' : aircraftComparisonData.aircraft2.total < aircraftComparisonData.aircraft1.total ? 'text-green-600' : 'text-gray-600'}`}>
                        {aircraftComparisonData.aircraft2.total - aircraftComparisonData.aircraft1.total > 0 ? '+' : ''}{aircraftComparisonData.aircraft2.total - aircraftComparisonData.aircraft1.total}
                      </p>
                      <p className="text-xs text-gray-600">
                        Aircraft 2 vs Aircraft 1
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Problem Type Radar */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Problem Type Comparison</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={aircraftComparisonData.radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="problemType" style={{ fontSize: '11px' }} />
                      <PolarRadiusAxis style={{ fontSize: '10px' }} />
                      <Radar name={aircraft1} dataKey={aircraft1} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Radar name={aircraft2} dataKey={aircraft2} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Component Comparison */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Component Comparison</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aircraftComparisonData.componentComparison}>
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
                      <Bar dataKey="aircraft1" fill="#3b82f6" name={aircraft1} />
                      <Bar dataKey="aircraft2" fill="#8b5cf6" name={aircraft2} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Differences */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{aircraft1} Has More</h3>
                  <div className="space-y-2">
                    {aircraftComparisonData.higher.length > 0 ? (
                      aircraftComparisonData.higher.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.component}</p>
                            <p className="text-xs text-gray-600">{item.aircraft1} vs {item.aircraft2}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">+{Math.abs(item.difference)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No differences</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{aircraft2} Has More</h3>
                  <div className="space-y-2">
                    {aircraftComparisonData.lower.length > 0 ? (
                      aircraftComparisonData.lower.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.component}</p>
                            <p className="text-xs text-gray-600">{item.aircraft1} vs {item.aircraft2}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">+{Math.abs(item.difference)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No differences</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {!aircraftComparisonData && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Plane className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a period and two aircraft to compare</p>
              <p className="text-xs text-gray-400 mt-2">Date format: dd/mm/yyyy (e.g., 01/01/2024)</p>
            </div>
          )}
        </>
      )}

      {/* NG FLEET vs MAX FLEET */}
      {comparisonMode === 'fleet' && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Fleet Comparison</h2>
            
            {/* Period Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Period (dd/mm/yyyy)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Start: 01/01/2024"
                  value={selectedPeriodStart}
                  onChange={(e) => setSelectedPeriodStart(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="End: 31/12/2024"
                  value={selectedPeriodEnd}
                  onChange={(e) => setSelectedPeriodEnd(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Fleet Comparison Results */}
          {fleetComparisonData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="h-5 w-5 text-blue-600" />
                    <h3 className="text-sm font-medium text-gray-600">B737-NG Fleet</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{fleetComparisonData.ng.total}</p>
                  <p className="text-xs text-gray-500 mt-1">findings</p>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">{fleetComparisonData.ng.aircraftCount} aircraft</p>
                    <p className="text-xs font-semibold text-blue-600">{fleetComparisonData.ng.avgPerAircraft} avg/aircraft</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="h-5 w-5 text-purple-600" />
                    <h3 className="text-sm font-medium text-gray-600">B737-MAX Fleet</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">{fleetComparisonData.max.total}</p>
                  <p className="text-xs text-gray-500 mt-1">findings</p>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">{fleetComparisonData.max.aircraftCount} aircraft</p>
                    <p className="text-xs font-semibold text-purple-600">{fleetComparisonData.max.avgPerAircraft} avg/aircraft</p>
                  </div>
                </div>
                <div className={`bg-white rounded-xl border border-gray-200 p-6 ${fleetComparisonData.max.total > fleetComparisonData.ng.total ? 'border-red-200 bg-red-50' : fleetComparisonData.max.total < fleetComparisonData.ng.total ? 'border-green-200 bg-green-50' : ''}`}>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Difference</h3>
                  <div className="flex items-center gap-2">
                    {fleetComparisonData.max.total > fleetComparisonData.ng.total ? (
                      <TrendingUp className="h-6 w-6 text-red-600" />
                    ) : fleetComparisonData.max.total < fleetComparisonData.ng.total ? (
                      <TrendingDown className="h-6 w-6 text-green-600" />
                    ) : (
                      <Minus className="h-6 w-6 text-gray-600" />
                    )}
                    <div>
                      <p className={`text-3xl font-bold ${fleetComparisonData.max.total > fleetComparisonData.ng.total ? 'text-red-600' : fleetComparisonData.max.total < fleetComparisonData.ng.total ? 'text-green-600' : 'text-gray-600'}`}>
                        {fleetComparisonData.max.total - fleetComparisonData.ng.total > 0 ? '+' : ''}{fleetComparisonData.max.total - fleetComparisonData.ng.total}
                      </p>
                      <p className="text-xs text-gray-600">
                        MAX vs NG
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Problem Type Radar */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Problem Type Distribution</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={fleetComparisonData.radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="problemType" style={{ fontSize: '11px' }} />
                      <PolarRadiusAxis style={{ fontSize: '10px' }} />
                      <Radar name="B737-NG" dataKey="B737-NG" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Radar name="B737-MAX" dataKey="B737-MAX" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Component Comparison */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Component Comparison</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fleetComparisonData.componentComparison}>
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
                      <Bar dataKey="ng" fill="#3b82f6" name="B737-NG" />
                      <Bar dataKey="max" fill="#8b5cf6" name="B737-MAX" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Differences */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">NG Fleet Has More</h3>
                  <div className="space-y-2">
                    {fleetComparisonData.ngHigher.length > 0 ? (
                      fleetComparisonData.ngHigher.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.component}</p>
                            <p className="text-xs text-gray-600">NG: {item.ng} vs MAX: {item.max}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">+{Math.abs(item.difference)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No differences</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">MAX Fleet Has More</h3>
                  <div className="space-y-2">
                    {fleetComparisonData.maxHigher.length > 0 ? (
                      fleetComparisonData.maxHigher.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.component}</p>
                            <p className="text-xs text-gray-600">NG: {item.ng} vs MAX: {item.max}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">+{Math.abs(item.difference)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No differences</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {!fleetComparisonData && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Plane className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a period to compare B737-NG and B737-MAX fleets</p>
              <p className="text-xs text-gray-400 mt-2">Date format: dd/mm/yyyy (e.g., 01/01/2024)</p>
            </div>
          )}
        </>
      )}

      {/* Empty State for Period Mode */}
      {comparisonMode === 'period' && !periodComparisonData && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Use the quick select buttons above or enter custom date ranges to compare periods</p>
          <p className="text-xs text-gray-400 mt-2">Date format: dd/mm/yyyy (e.g., 01/01/2024)</p>
        </div>
      )}
    </div>
  );
}
