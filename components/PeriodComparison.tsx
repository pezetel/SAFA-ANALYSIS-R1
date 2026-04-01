'use client';

import { SAFARecord } from '@/lib/types';
import { useState, useMemo, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Plane, Search, X, ChevronDown, Calendar, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface PeriodComparisonProps {
  records: SAFARecord[];
}

const AIRCRAFT_TYPES: Record<string, string[]> = {
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

function getAircraftType(reg: string): string {
  if (AIRCRAFT_TYPES['B737-NG'].includes(reg)) return 'B737-NG';
  if (AIRCRAFT_TYPES['B737-MAX'].includes(reg)) return 'B737-MAX';
  return 'Unknown';
}

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

// Searchable multi-select dropdown component
function AircraftSelector({
  label,
  selectedAircraft,
  onSelect,
  allAircraft,
  aircraftCounts,
  colorScheme = 'blue'
}: {
  label: string;
  selectedAircraft: string[];
  onSelect: (aircraft: string[]) => void;
  allAircraft: string[];
  aircraftCounts: Record<string, number>;
  colorScheme?: 'blue' | 'purple';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAircraft = useMemo(() => {
    let list = allAircraft;
    if (selectedType) {
      const typeRegs = AIRCRAFT_TYPES[selectedType] || [];
      list = list.filter(ac => typeRegs.includes(ac));
    }
    if (search) {
      list = list.filter(ac => ac.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }, [allAircraft, search, selectedType]);

  const toggleAircraft = (ac: string) => {
    if (selectedAircraft.includes(ac)) {
      onSelect(selectedAircraft.filter(a => a !== ac));
    } else {
      onSelect([...selectedAircraft, ac]);
    }
  };

  const selectAllFiltered = () => {
    const newSelection = Array.from(new Set([...selectedAircraft, ...filteredAircraft]));
    onSelect(newSelection);
  };

  const clearAll = () => {
    onSelect([]);
  };

  const selectFleetType = (type: string) => {
    const typeRegs = AIRCRAFT_TYPES[type] || [];
    const inData = typeRegs.filter(r => allAircraft.includes(r));
    onSelect(inData);
    setSelectedType(type);
  };

  const colors = colorScheme === 'blue'
    ? { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', ring: 'focus:ring-blue-500', badge: 'bg-blue-100 text-blue-800', hoverBg: 'hover:bg-blue-50', activeBg: 'bg-blue-600', tagBg: 'bg-blue-100 text-blue-700' }
    : { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', ring: 'focus:ring-purple-500', badge: 'bg-purple-100 text-purple-800', hoverBg: 'hover:bg-purple-50', activeBg: 'bg-purple-600', tagBg: 'bg-purple-100 text-purple-700' };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2.5 border ${colors.border} rounded-lg ${colors.bg} hover:brightness-95 transition-all text-sm`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Plane className={`h-4 w-4 ${colors.text} shrink-0`} />
          {selectedAircraft.length === 0 ? (
            <span className="text-gray-400 text-xs">Select aircraft...</span>
          ) : selectedAircraft.length <= 3 ? (
            <div className="flex gap-1 flex-wrap">
              {selectedAircraft.map(ac => (
                <span key={ac} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${colors.tagBg}`}>
                  {ac}
                  <X
                    className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAircraft(ac);
                    }}
                  />
                </span>
              ))}
            </div>
          ) : (
            <span className={`text-xs font-medium ${colors.text}`}>
              {selectedAircraft.length} aircraft selected
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 ${colors.text} shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden" style={{ minWidth: '320px' }}>
          {/* Fleet Type Buttons */}
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="flex gap-1.5 mb-2">
              <button
                onClick={() => { setSelectedType(''); }}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === '' ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                All ({allAircraft.length})
              </button>
              <button
                onClick={() => setSelectedType(selectedType === 'B737-NG' ? '' : 'B737-NG')}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === 'B737-NG' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'
                }`}
              >
                B737-NG
              </button>
              <button
                onClick={() => setSelectedType(selectedType === 'B737-MAX' ? '' : 'B737-MAX')}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === 'B737-MAX' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-purple-50 border border-gray-200'
                }`}
              >
                B737-MAX
              </button>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search registration..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-2 py-1.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex gap-1">
              <button
                onClick={selectAllFiltered}
                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded font-medium transition-colors"
              >
                Select All ({filteredAircraft.length})
              </button>
              <button
                onClick={clearAll}
                className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded font-medium transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => selectFleetType('B737-NG')}
                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded font-medium transition-colors"
              >
                All NG
              </button>
              <button
                onClick={() => selectFleetType('B737-MAX')}
                className="px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded font-medium transition-colors"
              >
                All MAX
              </button>
            </div>
          </div>

          {/* Aircraft List */}
          <div className="max-h-56 overflow-y-auto p-1">
            {filteredAircraft.length > 0 ? (
              filteredAircraft.map(ac => {
                const type = getAircraftType(ac);
                const isSelected = selectedAircraft.includes(ac);
                return (
                  <label
                    key={ac}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? (colorScheme === 'blue' ? 'bg-blue-50' : 'bg-purple-50') : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAircraft(ac)}
                      className={`rounded text-blue-600 ${colors.ring} w-3.5 h-3.5`}
                    />
                    <span className="text-xs font-medium text-gray-800 flex-1">{ac}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      type === 'B737-NG' ? 'bg-blue-100 text-blue-600' : type === 'B737-MAX' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {type === 'B737-NG' ? 'NG' : type === 'B737-MAX' ? 'MAX' : '?'}
                    </span>
                    <span className="text-xs text-gray-400 tabular-nums">{aircraftCounts[ac] || 0}</span>
                  </label>
                );
              })
            ) : (
              <div className="py-6 text-center">
                <Search className="h-5 w-5 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-400">No aircraft found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {selectedAircraft.length > 0 && (
            <div className="p-2 border-t border-gray-100 bg-gray-50">
              <div className="flex flex-wrap gap-1">
                {selectedAircraft.slice(0, 8).map(ac => (
                  <span
                    key={ac}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${colors.tagBg}`}
                  >
                    {ac}
                    <X
                      className="h-2.5 w-2.5 cursor-pointer opacity-60 hover:opacity-100"
                      onClick={() => toggleAircraft(ac)}
                    />
                  </span>
                ))}
                {selectedAircraft.length > 8 && (
                  <span className="text-xs text-gray-400 py-0.5">+{selectedAircraft.length - 8} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PeriodComparison({ records }: PeriodComparisonProps) {
  const [comparisonMode, setComparisonMode] = useState<'period' | 'aircraft' | 'fleet'>('period');

  // Period comparison state
  const [period1Start, setPeriod1Start] = useState('');
  const [period1End, setPeriod1End] = useState('');
  const [period2Start, setPeriod2Start] = useState('');
  const [period2End, setPeriod2End] = useState('');
  const [periodAircraftFilter, setPeriodAircraftFilter] = useState<string[]>([]);

  // Aircraft comparison state
  const [selectedPeriodStart, setSelectedPeriodStart] = useState('');
  const [selectedPeriodEnd, setSelectedPeriodEnd] = useState('');
  const [aircraft1List, setAircraft1List] = useState<string[]>([]);
  const [aircraft2List, setAircraft2List] = useState<string[]>([]);

  const allAircraft = useMemo(() => {
    return Array.from(new Set(records.map(r => r.aircraft))).sort();
  }, [records]);

  const aircraftCounts = useMemo(() => {
    return records.reduce((acc, r) => {
      acc[r.aircraft] = (acc[r.aircraft] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [records]);

  const dateRange = useMemo(() => {
    if (records.length === 0) return { min: new Date(), max: new Date() };
    const dates = records.map(r => new Date(r.date).getTime());
    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates))
    };
  }, [records]);

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set(records.map(r => new Date(r.date).getFullYear()));
    return Array.from(years).sort();
  }, [records]);

  const quickSelect = (type: string) => {
    const currentYear = availableYears.length > 0 ? availableYears[availableYears.length - 1] : new Date().getFullYear();
    const prevYear = currentYear - 1;

    switch (type) {
      case 'first6-last6': {
        const midYear = new Date(dateRange.min.getFullYear(), 5, 30);
        setPeriod1Start(formatDateForInput(dateRange.min));
        setPeriod1End(formatDateForInput(midYear));
        setPeriod2Start(formatDateForInput(new Date(midYear.getTime() + 86400000)));
        setPeriod2End(formatDateForInput(dateRange.max));
        break;
      }
      case 'yoy': {
        setPeriod1Start(`01/01/${prevYear}`);
        setPeriod1End(`31/12/${prevYear}`);
        setPeriod2Start(`01/01/${currentYear}`);
        setPeriod2End(`31/12/${currentYear}`);
        break;
      }
      case 'q1-q2': {
        setPeriod1Start(`01/01/${currentYear}`);
        setPeriod1End(`31/03/${currentYear}`);
        setPeriod2Start(`01/04/${currentYear}`);
        setPeriod2End(`30/06/${currentYear}`);
        break;
      }
      case 'q3-q4': {
        setPeriod1Start(`01/07/${currentYear}`);
        setPeriod1End(`30/09/${currentYear}`);
        setPeriod2Start(`01/10/${currentYear}`);
        setPeriod2End(`31/12/${currentYear}`);
        break;
      }
      case 'q1-q1-yoy': {
        setPeriod1Start(`01/01/${prevYear}`);
        setPeriod1End(`31/03/${prevYear}`);
        setPeriod2Start(`01/01/${currentYear}`);
        setPeriod2End(`31/03/${currentYear}`);
        break;
      }
      case 'q2-q2-yoy': {
        setPeriod1Start(`01/04/${prevYear}`);
        setPeriod1End(`30/06/${prevYear}`);
        setPeriod2Start(`01/04/${currentYear}`);
        setPeriod2End(`30/06/${currentYear}`);
        break;
      }
      case 'h1-h2': {
        setPeriod1Start(`01/01/${currentYear}`);
        setPeriod1End(`30/06/${currentYear}`);
        setPeriod2Start(`01/07/${currentYear}`);
        setPeriod2End(`31/12/${currentYear}`);
        break;
      }
      case 'last3m-prev3m': {
        const now = dateRange.max;
        const last3Start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const prev3End = new Date(last3Start.getTime() - 86400000);
        const prev3Start = new Date(prev3End.getFullYear(), prev3End.getMonth() - 2, 1);
        setPeriod1Start(formatDateForInput(prev3Start));
        setPeriod1End(formatDateForInput(prev3End));
        setPeriod2Start(formatDateForInput(last3Start));
        setPeriod2End(formatDateForInput(now));
        break;
      }
      case 'last6m-prev6m': {
        const now2 = dateRange.max;
        const last6Start = new Date(now2.getFullYear(), now2.getMonth() - 5, 1);
        const prev6End = new Date(last6Start.getTime() - 86400000);
        const prev6Start = new Date(prev6End.getFullYear(), prev6End.getMonth() - 5, 1);
        setPeriod1Start(formatDateForInput(prev6Start));
        setPeriod1End(formatDateForInput(prev6End));
        setPeriod2Start(formatDateForInput(last6Start));
        setPeriod2End(formatDateForInput(now2));
        break;
      }
      case 'summer-winter': {
        setPeriod1Start(`01/04/${currentYear}`);
        setPeriod1End(`30/09/${currentYear}`);
        setPeriod2Start(`01/10/${prevYear}`);
        setPeriod2End(`31/03/${currentYear}`);
        break;
      }
      case 'full-range': {
        const mid = new Date((dateRange.min.getTime() + dateRange.max.getTime()) / 2);
        setPeriod1Start(formatDateForInput(dateRange.min));
        setPeriod1End(formatDateForInput(mid));
        setPeriod2Start(formatDateForInput(new Date(mid.getTime() + 86400000)));
        setPeriod2End(formatDateForInput(dateRange.max));
        break;
      }
    }
  };

  const quickSelectFleet = (type: string) => {
    const currentYear = availableYears.length > 0 ? availableYears[availableYears.length - 1] : new Date().getFullYear();
    switch (type) {
      case 'full':
        setSelectedPeriodStart(formatDateForInput(dateRange.min));
        setSelectedPeriodEnd(formatDateForInput(dateRange.max));
        break;
      case 'ytd':
        setSelectedPeriodStart(`01/01/${currentYear}`);
        setSelectedPeriodEnd(formatDateForInput(dateRange.max));
        break;
      case 'last12m': {
        const start = new Date(dateRange.max);
        start.setFullYear(start.getFullYear() - 1);
        setSelectedPeriodStart(formatDateForInput(start));
        setSelectedPeriodEnd(formatDateForInput(dateRange.max));
        break;
      }
      case 'last6m': {
        const s6 = new Date(dateRange.max);
        s6.setMonth(s6.getMonth() - 6);
        setSelectedPeriodStart(formatDateForInput(s6));
        setSelectedPeriodEnd(formatDateForInput(dateRange.max));
        break;
      }
      case 'last3m': {
        const s3 = new Date(dateRange.max);
        s3.setMonth(s3.getMonth() - 3);
        setSelectedPeriodStart(formatDateForInput(s3));
        setSelectedPeriodEnd(formatDateForInput(dateRange.max));
        break;
      }
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

    let baseRecords = records;
    if (periodAircraftFilter.length > 0) {
      baseRecords = records.filter(r => periodAircraftFilter.includes(r.aircraft));
    }

    const period1Records = baseRecords.filter(r => {
      const date = new Date(r.date);
      return date >= p1Start && date <= p1End;
    });

    const period2Records = baseRecords.filter(r => {
      const date = new Date(r.date);
      return date >= p2Start && date <= p2End;
    });

    const p1Components = period1Records.reduce((acc, r) => {
      acc[r.component] = (acc[r.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const p2Components = period2Records.reduce((acc, r) => {
      acc[r.component] = (acc[r.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
  }, [records, period1Start, period1End, period2Start, period2End, periodAircraftFilter]);

  const aircraftComparisonData = useMemo(() => {
    const pStart = parseInputDate(selectedPeriodStart);
    const pEnd = parseInputDate(selectedPeriodEnd);

    if (!pStart || !pEnd || aircraft1List.length === 0 || aircraft2List.length === 0) {
      return null;
    }

    const periodRecords = records.filter(r => {
      const date = new Date(r.date);
      return date >= pStart && date <= pEnd;
    });

    const ac1Records = periodRecords.filter(r => aircraft1List.includes(r.aircraft));
    const ac2Records = periodRecords.filter(r => aircraft2List.includes(r.aircraft));

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

    const ac1Problems = ac1Records.reduce((acc, r) => {
      acc[r.problemType] = (acc[r.problemType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ac2Problems = ac2Records.reduce((acc, r) => {
      acc[r.problemType] = (acc[r.problemType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const allProblemTypes = Array.from(new Set([...Object.keys(ac1Problems), ...Object.keys(ac2Problems)]));

    const group1Label = aircraft1List.length === 1 ? aircraft1List[0] : `Group A (${aircraft1List.length})`;
    const group2Label = aircraft2List.length === 1 ? aircraft2List[0] : `Group B (${aircraft2List.length})`;

    const radarData = allProblemTypes.map(type => ({
      problemType: type,
      [group1Label]: ac1Problems[type] || 0,
      [group2Label]: ac2Problems[type] || 0
    }));

    return {
      aircraft1: {
        name: group1Label,
        total: ac1Records.length,
        records: ac1Records,
        count: aircraft1List.length
      },
      aircraft2: {
        name: group2Label,
        total: ac2Records.length,
        records: ac2Records,
        count: aircraft2List.length
      },
      dateRange: `${selectedPeriodStart} - ${selectedPeriodEnd}`,
      componentComparison: componentComparison.slice(0, 10),
      radarData,
      group1Label,
      group2Label,
      higher: componentComparison.filter(c => c.difference < 0).slice(0, 5),
      lower: componentComparison.filter(c => c.difference > 0).slice(0, 5)
    };
  }, [records, selectedPeriodStart, selectedPeriodEnd, aircraft1List, aircraft2List]);

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
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📅 Period vs Period
          </button>
          <button
            onClick={() => setComparisonMode('aircraft')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              comparisonMode === 'aircraft'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✈️ Aircraft vs Aircraft
          </button>
          <button
            onClick={() => setComparisonMode('fleet')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              comparisonMode === 'fleet'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🛩️ NG Fleet vs MAX Fleet
          </button>
        </div>
      </div>

      {/* ========== PERIOD vs PERIOD ========== */}
      {comparisonMode === 'period' && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Period Selection
              </h2>
              {(period1Start || period2Start) && (
                <button
                  onClick={() => {
                    setPeriod1Start(''); setPeriod1End('');
                    setPeriod2Start(''); setPeriod2End('');
                    setPeriodAircraftFilter([]);
                  }}
                  className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <X className="h-3 w-3" /> Clear All
                </button>
              )}
            </div>

            {/* Quick Select Buttons */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Quick Select</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
                {[
                  { key: 'yoy', label: `${availableYears.length >= 2 ? availableYears[availableYears.length - 2] : '—'} vs ${availableYears.length >= 1 ? availableYears[availableYears.length - 1] : '—'}`, icon: '📆' },
                  { key: 'h1-h2', label: 'H1 vs H2', icon: '📊' },
                  { key: 'q1-q2', label: 'Q1 vs Q2', icon: '🔢' },
                  { key: 'q3-q4', label: 'Q3 vs Q4', icon: '🔢' },
                  { key: 'q1-q1-yoy', label: 'Q1 YoY', icon: '📈' },
                  { key: 'q2-q2-yoy', label: 'Q2 YoY', icon: '📈' },
                  { key: 'last3m-prev3m', label: 'Last 3M vs Prev 3M', icon: '🕐' },
                  { key: 'last6m-prev6m', label: 'Last 6M vs Prev 6M', icon: '🕐' },
                  { key: 'first6-last6', label: 'First Half vs Last Half', icon: '⚖️' },
                  { key: 'summer-winter', label: 'Summer vs Winter', icon: '🌡️' },
                  { key: 'full-range', label: 'Split Full Range', icon: '📏' },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => quickSelect(item.key)}
                    className="px-2.5 py-2 text-xs font-medium bg-gradient-to-b from-gray-50 to-gray-100 text-gray-700 rounded-lg hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all border border-gray-200 hover:border-blue-200 hover:shadow-sm text-left"
                  >
                    <span className="mr-1">{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aircraft Filter for Period Comparison */}
            <div className="mb-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Plane className="h-3.5 w-3.5" /> Aircraft Filter (Optional)
                </span>
                {periodAircraftFilter.length > 0 && (
                  <button
                    onClick={() => setPeriodAircraftFilter([])}
                    className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Clear ({periodAircraftFilter.length})
                  </button>
                )}
              </div>
              <AircraftSelector
                label=""
                selectedAircraft={periodAircraftFilter}
                onSelect={setPeriodAircraftFilter}
                allAircraft={allAircraft}
                aircraftCounts={aircraftCounts}
                colorScheme="blue"
              />
              {periodAircraftFilter.length > 0 && (
                <p className="text-xs text-blue-600 mt-1.5">
                  Filtering by {periodAircraftFilter.length} aircraft
                </p>
              )}
            </div>

            {/* Custom Date Selection */}
            <div className="grid grid-cols-2 gap-6">
              <div className="border border-blue-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-blue-50/30">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Period 1
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Start (dd/mm/yyyy)</label>
                    <input
                      type="text"
                      placeholder="01/01/2024"
                      value={period1Start}
                      onChange={(e) => setPeriod1Start(e.target.value)}
                      className="w-full px-2.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">End (dd/mm/yyyy)</label>
                    <input
                      type="text"
                      placeholder="31/12/2024"
                      value={period1End}
                      onChange={(e) => setPeriod1End(e.target.value)}
                      className="w-full px-2.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
              <div className="border border-purple-200 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-purple-50/30">
                <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  Period 2
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Start (dd/mm/yyyy)</label>
                    <input
                      type="text"
                      placeholder="01/01/2025"
                      value={period2Start}
                      onChange={(e) => setPeriod2Start(e.target.value)}
                      className="w-full px-2.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">End (dd/mm/yyyy)</label>
                    <input
                      type="text"
                      placeholder="31/12/2025"
                      value={period2End}
                      onChange={(e) => setPeriod2End(e.target.value)}
                      className="w-full px-2.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Data range info */}
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Calendar className="h-3 w-3" />
              Data range: {formatDateForInput(dateRange.min)} — {formatDateForInput(dateRange.max)}
            </div>
          </div>

          {/* Period Comparison Results */}
          {periodComparisonData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Period 1 Total
                  </h3>
                  <p className="text-3xl font-bold text-blue-600">{periodComparisonData.period1.total}</p>
                  <p className="text-xs text-gray-500 mt-1">findings</p>
                  <p className="text-xs text-blue-600 mt-2">{periodComparisonData.period1.dateRange}</p>
                  {periodAircraftFilter.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">({periodAircraftFilter.length} aircraft filtered)</p>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    Period 2 Total
                  </h3>
                  <p className="text-3xl font-bold text-purple-600">{periodComparisonData.period2.total}</p>
                  <p className="text-xs text-gray-500 mt-1">findings</p>
                  <p className="text-xs text-purple-600 mt-2">{periodComparisonData.period2.dateRange}</p>
                  {periodAircraftFilter.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">({periodAircraftFilter.length} aircraft filtered)</p>
                  )}
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
                      <Bar dataKey="period1" fill="#3b82f6" name="Period 1" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="period2" fill="#8b5cf6" name="Period 2" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* Empty State for Period Mode */}
          {!periodComparisonData && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Use the quick select buttons above or enter custom date ranges</p>
              <p className="text-xs text-gray-400 mt-2">Date format: dd/mm/yyyy (e.g., 01/01/2024)</p>
            </div>
          )}
        </>
      )}

      {/* ========== AIRCRAFT vs AIRCRAFT ========== */}
      {comparisonMode === 'aircraft' && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-600" />
              Aircraft Comparison
            </h2>

            {/* Period Selection with quick buttons */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Select Period (dd/mm/yyyy)
                </label>
                <div className="flex gap-1">
                  {[
                    { key: 'full', label: 'Full Range' },
                    { key: 'ytd', label: 'YTD' },
                    { key: 'last12m', label: 'Last 12M' },
                    { key: 'last6m', label: 'Last 6M' },
                    { key: 'last3m', label: 'Last 3M' },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => quickSelectFleet(item.key)}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
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
              <div className="mt-1 text-center text-xs text-gray-400">
                Data range: {formatDateForInput(dateRange.min)} — {formatDateForInput(dateRange.max)}
              </div>
            </div>

            {/* Aircraft Selection with searchable dropdowns */}
            <div className="grid grid-cols-2 gap-6">
              <div className="border border-blue-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-blue-50/30">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Group A
                </h3>
                <AircraftSelector
                  label="Select Aircraft"
                  selectedAircraft={aircraft1List}
                  onSelect={setAircraft1List}
                  allAircraft={allAircraft}
                  aircraftCounts={aircraftCounts}
                  colorScheme="blue"
                />
              </div>
              <div className="border border-purple-200 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-purple-50/30">
                <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  Group B
                </h3>
                <AircraftSelector
                  label="Select Aircraft"
                  selectedAircraft={aircraft2List}
                  onSelect={setAircraft2List}
                  allAircraft={allAircraft}
                  aircraftCounts={aircraftCounts}
                  colorScheme="purple"
                />
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
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <h3 className="text-sm font-medium text-gray-600">{aircraftComparisonData.aircraft1.name}</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{aircraftComparisonData.aircraft1.total}</p>
                  <p className="text-xs text-gray-500 mt-1">findings ({aircraftComparisonData.aircraft1.count} aircraft)</p>
                  <p className="text-xs text-blue-600 mt-2">{aircraftComparisonData.dateRange}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <h3 className="text-sm font-medium text-gray-600">{aircraftComparisonData.aircraft2.name}</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">{aircraftComparisonData.aircraft2.total}</p>
                  <p className="text-xs text-gray-500 mt-1">findings ({aircraftComparisonData.aircraft2.count} aircraft)</p>
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
                        Group B vs Group A
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
                      <Radar name={aircraftComparisonData.group1Label} dataKey={aircraftComparisonData.group1Label} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Radar name={aircraftComparisonData.group2Label} dataKey={aircraftComparisonData.group2Label} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
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
                      <Bar dataKey="aircraft1" fill="#3b82f6" name={aircraftComparisonData.group1Label} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="aircraft2" fill="#8b5cf6" name={aircraftComparisonData.group2Label} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Differences */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{aircraftComparisonData.group1Label} Has More</h3>
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
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{aircraftComparisonData.group2Label} Has More</h3>
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
              <p className="text-gray-500 font-medium">Select a period and aircraft for both groups to compare</p>
              <p className="text-xs text-gray-400 mt-2">You can select multiple aircraft per group — use search, fleet type filters, or &quot;Select All&quot;</p>
            </div>
          )}
        </>
      )}

      {/* ========== NG FLEET vs MAX FLEET ========== */}
      {comparisonMode === 'fleet' && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-600" />
              Fleet Comparison
            </h2>

            {/* Period Selection with quick buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Select Period (dd/mm/yyyy)
                </label>
                <div className="flex gap-1">
                  {[
                    { key: 'full', label: 'Full Range' },
                    { key: 'ytd', label: 'YTD' },
                    { key: 'last12m', label: 'Last 12M' },
                    { key: 'last6m', label: 'Last 6M' },
                    { key: 'last3m', label: 'Last 3M' },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => quickSelectFleet(item.key)}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
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
              <div className="mt-1 text-center text-xs text-gray-400">
                Data range: {formatDateForInput(dateRange.min)} — {formatDateForInput(dateRange.max)}
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
                      <p className="text-xs text-gray-600">MAX vs NG</p>
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
                      <Bar dataKey="ng" fill="#3b82f6" name="B737-NG" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="max" fill="#8b5cf6" name="B737-MAX" radius={[2, 2, 0, 0]} />
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
              <p className="text-gray-500 font-medium">Select a period to compare B737-NG and B737-MAX fleets</p>
              <p className="text-xs text-gray-400 mt-2">Use quick buttons above or enter dates manually (dd/mm/yyyy)</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
