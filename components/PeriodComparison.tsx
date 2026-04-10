'use client';

import { SAFARecord, EODRecord, SigmaSettings } from '@/lib/types';
import { AircraftPeriodTracker } from './AircraftPeriodTracker';
import { useState, useMemo, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Plane, Search, X, ChevronDown, Calendar, Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { DetailModal } from './DetailModal';

interface PeriodComparisonProps {
  records: SAFARecord[];
  eodRecords?: EODRecord[];
  sigmaSettings?: SigmaSettings;
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

// ── Horizontal paired bar chart for problem type comparison ──
function ProblemTypeComparisonChart({
  data,
  label1,
  label2,
  color1 = '#3b82f6',
  color2 = '#8b5cf6',
  onClickItem,
}: {
  data: { type: string; count1: number; count2: number; pct1: number; pct2: number }[];
  label1: string;
  label2: string;
  color1?: string;
  color2?: string;
  onClickItem?: (type: string, group: 'group1' | 'group2' | 'both') => void;
}) {
  if (data.length === 0) return <p className="text-sm text-gray-400 text-center py-8">No problem type data</p>;

  const maxCount = Math.max(...data.flatMap(d => [d.count1, d.count2]), 1);

  return (
    <div className="space-y-1">
      {/* Legend */}
      <div className="flex items-center justify-center gap-8 mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color1 }} />
          <span className="text-xs font-semibold text-gray-700">{label1}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color2 }} />
          <span className="text-xs font-semibold text-gray-700">{label2}</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_80px_60px] gap-2 px-1 mb-1">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Problem Type</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Count</span>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">% of Group</span>
      </div>

      {data.map((item, idx) => {
        const diff = item.count2 - item.count1;
        const clickable = !!onClickItem;
        return (
          <div key={idx} className="rounded-lg hover:bg-gray-50 transition-colors px-1 py-2 border-b border-gray-50 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-bold text-gray-800 ${clickable ? 'cursor-pointer hover:text-blue-600 hover:underline' : ''}`}
                onClick={() => clickable && onClickItem!(item.type, 'both')}
              >
                {item.type}
                {clickable && <span className="ml-1 text-[10px] text-gray-400">🔍</span>}
              </span>
              {diff > 0 ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                  <TrendingUp className="h-2.5 w-2.5" />
                  {label2} +{diff}
                </span>
              ) : diff < 0 ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-600">
                  <TrendingDown className="h-2.5 w-2.5" />
                  {label1} +{Math.abs(diff)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
                  Equal
                </span>
              )}
            </div>

            {/* Bar for group 1 */}
            <div
              className={`grid grid-cols-[1fr_80px_60px] gap-2 items-center mb-1 ${clickable ? 'cursor-pointer rounded-md hover:ring-2 hover:ring-blue-200 transition-all' : ''}`}
              onClick={() => clickable && onClickItem!(item.type, 'group1')}
            >
              <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 flex items-center px-2"
                  style={{
                    width: `${Math.max((item.count1 / maxCount) * 100, item.count1 > 0 ? 8 : 0)}%`,
                    backgroundColor: color1,
                  }}
                >
                  {(item.count1 / maxCount) * 100 > 15 && (
                    <span className="text-[10px] font-bold text-white whitespace-nowrap">{label1}</span>
                  )}
                </div>
              </div>
              <span className="text-xs font-bold text-gray-700 text-center tabular-nums">{item.count1}</span>
              <span className="text-xs font-semibold text-center tabular-nums" style={{ color: color1 }}>{item.pct1.toFixed(1)}%</span>
            </div>

            {/* Bar for group 2 */}
            <div
              className={`grid grid-cols-[1fr_80px_60px] gap-2 items-center ${clickable ? 'cursor-pointer rounded-md hover:ring-2 hover:ring-purple-200 transition-all' : ''}`}
              onClick={() => clickable && onClickItem!(item.type, 'group2')}
            >
              <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 flex items-center px-2"
                  style={{
                    width: `${Math.max((item.count2 / maxCount) * 100, item.count2 > 0 ? 8 : 0)}%`,
                    backgroundColor: color2,
                  }}
                >
                  {(item.count2 / maxCount) * 100 > 15 && (
                    <span className="text-[10px] font-bold text-white whitespace-nowrap">{label2}</span>
                  )}
                </div>
              </div>
              <span className="text-xs font-bold text-gray-700 text-center tabular-nums">{item.count2}</span>
              <span className="text-xs font-semibold text-center tabular-nums" style={{ color: color2 }}>{item.pct2.toFixed(1)}%</span>
            </div>
          </div>
        );
      })}

      {/* Explanation */}
      <div className="mt-4 pt-3 border-t border-gray-200 flex items-start gap-2 bg-gray-50 rounded-lg p-3">
        <span className="text-gray-400 text-sm">ℹ️</span>
        <div className="text-[11px] text-gray-500 leading-relaxed">
          <p><strong>Count:</strong> Number of findings for each problem type.</p>
          <p><strong>% of Group:</strong> The proportion of that problem type within its own group. E.g., if {label1} has 100 findings and 20 are &quot;Defect&quot; → {label1} Defect = 20%.</p>
          <p><strong>Badge:</strong> Shows the count difference between the two groups. The group with more findings is displayed with the difference.</p>
          {onClickItem && <p className="mt-1"><strong>💡 Tip:</strong> Click on the problem type name to see all records, or click on a specific bar to see only that group&apos;s records.</p>}
        </div>
      </div>
    </div>
  );
}

// ── Searchable multi-select aircraft dropdown ──
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

  const clearAll = () => onSelect([]);

  const selectFleetType = (type: string) => {
    const typeRegs = AIRCRAFT_TYPES[type] || [];
    const inData = typeRegs.filter(r => allAircraft.includes(r));
    onSelect(inData);
    setSelectedType(type);
  };

  const colors = colorScheme === 'blue'
    ? { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', ring: 'focus:ring-blue-500', tagBg: 'bg-blue-100 text-blue-700' }
    : { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', ring: 'focus:ring-purple-500', tagBg: 'bg-purple-100 text-purple-700' };

  return (
    <div ref={dropdownRef} className="relative">
      {label && <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>}

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
                  <X className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); toggleAircraft(ac); }} />
                </span>
              ))}
            </div>
          ) : (
            <span className={`text-xs font-medium ${colors.text}`}>{selectedAircraft.length} aircraft selected</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 ${colors.text} shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden" style={{ minWidth: '320px' }}>
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="flex gap-1.5 mb-2">
              <button onClick={() => setSelectedType('')} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedType === '' ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>All ({allAircraft.length})</button>
              <button onClick={() => setSelectedType(selectedType === 'B737-NG' ? '' : 'B737-NG')} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedType === 'B737-NG' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'}`}>B737-NG</button>
              <button onClick={() => setSelectedType(selectedType === 'B737-MAX' ? '' : 'B737-MAX')} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedType === 'B737-MAX' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-purple-50 border border-gray-200'}`}>B737-MAX</button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
              <input type="text" placeholder="Search registration..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white" autoFocus />
            </div>
          </div>

          <div className="px-2 py-1.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex gap-1">
              <button onClick={selectAllFiltered} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded font-medium">Select All ({filteredAircraft.length})</button>
              <button onClick={clearAll} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded font-medium">Clear</button>
            </div>
            <div className="flex gap-1">
              <button onClick={() => selectFleetType('B737-NG')} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded font-medium">All NG</button>
              <button onClick={() => selectFleetType('B737-MAX')} className="px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded font-medium">All MAX</button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1">
            {filteredAircraft.length > 0 ? filteredAircraft.map(ac => {
              const type = getAircraftType(ac);
              const isSelected = selectedAircraft.includes(ac);
              return (
                <label key={ac} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${isSelected ? (colorScheme === 'blue' ? 'bg-blue-50' : 'bg-purple-50') : 'hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleAircraft(ac)} className={`rounded text-blue-600 ${colors.ring} w-3.5 h-3.5`} />
                  <span className="text-xs font-medium text-gray-800 flex-1">{ac}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${type === 'B737-NG' ? 'bg-blue-100 text-blue-600' : type === 'B737-MAX' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                    {type === 'B737-NG' ? 'NG' : type === 'B737-MAX' ? 'MAX' : '?'}
                  </span>
                  <span className="text-xs text-gray-400 tabular-nums">{aircraftCounts[ac] || 0}</span>
                </label>
              );
            }) : (
              <div className="py-6 text-center">
                <Search className="h-5 w-5 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-400">No aircraft found</p>
              </div>
            )}
          </div>

          {selectedAircraft.length > 0 && (
            <div className="p-2 border-t border-gray-100 bg-gray-50">
              <div className="flex flex-wrap gap-1">
                {selectedAircraft.slice(0, 8).map(ac => (
                  <span key={ac} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${colors.tagBg}`}>
                    {ac}
                    <X className="h-2.5 w-2.5 cursor-pointer opacity-60 hover:opacity-100" onClick={() => toggleAircraft(ac)} />
                  </span>
                ))}
                {selectedAircraft.length > 8 && <span className="text-xs text-gray-400 py-0.5">+{selectedAircraft.length - 8} more</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helper: build problem type comparison data ──
function buildProblemTypeData(records1: SAFARecord[], records2: SAFARecord[]) {
  const p1 = records1.reduce((acc, r) => { acc[r.problemType] = (acc[r.problemType] || 0) + 1; return acc; }, {} as Record<string, number>);
  const p2 = records2.reduce((acc, r) => { acc[r.problemType] = (acc[r.problemType] || 0) + 1; return acc; }, {} as Record<string, number>);
  const total1 = records1.length || 1;
  const total2 = records2.length || 1;
  const allTypes = Array.from(new Set([...Object.keys(p1), ...Object.keys(p2)]));
  return allTypes.map(type => ({
    type,
    count1: p1[type] || 0,
    count2: p2[type] || 0,
    pct1: ((p1[type] || 0) / total1) * 100,
    pct2: ((p2[type] || 0) / total2) * 100,
  })).sort((a, b) => (b.count1 + b.count2) - (a.count1 + a.count2));
}

const DEFAULT_SIGMA_PC: SigmaSettings = { multiplier: 2 };

export function PeriodComparison({ records, eodRecords, sigmaSettings = DEFAULT_SIGMA_PC }: PeriodComparisonProps) {
  const hasEOD = eodRecords && eodRecords.length > 0;
  const [comparisonMode, setComparisonMode] = useState<'period' | 'aircraft' | 'fleet'>('period');

  // Period comparison state
  const [period1Start, setPeriod1Start] = useState('');
  const [period1End, setPeriod1End] = useState('');
  const [period2Start, setPeriod2Start] = useState('');
  const [period2End, setPeriod2End] = useState('');

  // Aircraft comparison state
  const [selectedPeriodStart, setSelectedPeriodStart] = useState('');
  const [selectedPeriodEnd, setSelectedPeriodEnd] = useState('');
  const [aircraft1List, setAircraft1List] = useState<string[]>([]);
  const [aircraft2List, setAircraft2List] = useState<string[]>([]);

  // Fleet: per-aircraft normalization toggle
  const [fleetNormalize, setFleetNormalize] = useState(false);

  // Detail modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalRecords, setModalRecords] = useState<SAFARecord[]>([]);

  const openModal = (title: string, recs: SAFARecord[]) => {
    setModalTitle(title);
    setModalRecords(recs);
    setModalOpen(true);
  };

  const allAircraft = useMemo(() => Array.from(new Set(records.map(r => r.aircraft))).sort(), [records]);

  const aircraftCounts = useMemo(() => records.reduce((acc, r) => { acc[r.aircraft] = (acc[r.aircraft] || 0) + 1; return acc; }, {} as Record<string, number>), [records]);

  const dateRange = useMemo(() => {
    if (records.length === 0) return { min: new Date(), max: new Date() };
    const dates = records.map(r => new Date(r.date).getTime());
    return { min: new Date(Math.min(...dates)), max: new Date(Math.max(...dates)) };
  }, [records]);

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
      case 'yoy':
        setPeriod1Start(`01/01/${prevYear}`); setPeriod1End(`31/12/${prevYear}`);
        setPeriod2Start(`01/01/${currentYear}`); setPeriod2End(`31/12/${currentYear}`);
        break;
      case 'q1-q2':
        setPeriod1Start(`01/01/${currentYear}`); setPeriod1End(`31/03/${currentYear}`);
        setPeriod2Start(`01/04/${currentYear}`); setPeriod2End(`30/06/${currentYear}`);
        break;
      case 'q3-q4':
        setPeriod1Start(`01/07/${currentYear}`); setPeriod1End(`30/09/${currentYear}`);
        setPeriod2Start(`01/10/${currentYear}`); setPeriod2End(`31/12/${currentYear}`);
        break;
      case 'q1-q1-yoy':
        setPeriod1Start(`01/01/${prevYear}`); setPeriod1End(`31/03/${prevYear}`);
        setPeriod2Start(`01/01/${currentYear}`); setPeriod2End(`31/03/${currentYear}`);
        break;
      case 'q2-q2-yoy':
        setPeriod1Start(`01/04/${prevYear}`); setPeriod1End(`30/06/${prevYear}`);
        setPeriod2Start(`01/04/${currentYear}`); setPeriod2End(`30/06/${currentYear}`);
        break;
      case 'h1-h2':
        setPeriod1Start(`01/01/${currentYear}`); setPeriod1End(`30/06/${currentYear}`);
        setPeriod2Start(`01/07/${currentYear}`); setPeriod2End(`31/12/${currentYear}`);
        break;
      case 'last3m-prev3m': {
        const now = dateRange.max;
        const last3Start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const prev3End = new Date(last3Start.getTime() - 86400000);
        const prev3Start = new Date(prev3End.getFullYear(), prev3End.getMonth() - 2, 1);
        setPeriod1Start(formatDateForInput(prev3Start)); setPeriod1End(formatDateForInput(prev3End));
        setPeriod2Start(formatDateForInput(last3Start)); setPeriod2End(formatDateForInput(now));
        break;
      }
      case 'last6m-prev6m': {
        const now2 = dateRange.max;
        const last6Start = new Date(now2.getFullYear(), now2.getMonth() - 5, 1);
        const prev6End = new Date(last6Start.getTime() - 86400000);
        const prev6Start = new Date(prev6End.getFullYear(), prev6End.getMonth() - 5, 1);
        setPeriod1Start(formatDateForInput(prev6Start)); setPeriod1End(formatDateForInput(prev6End));
        setPeriod2Start(formatDateForInput(last6Start)); setPeriod2End(formatDateForInput(now2));
        break;
      }
      case 'summer-winter':
        setPeriod1Start(`01/04/${currentYear}`); setPeriod1End(`30/09/${currentYear}`);
        setPeriod2Start(`01/10/${prevYear}`); setPeriod2End(`31/03/${currentYear}`);
        break;
      case 'full-range': {
        const mid = new Date((dateRange.min.getTime() + dateRange.max.getTime()) / 2);
        setPeriod1Start(formatDateForInput(dateRange.min)); setPeriod1End(formatDateForInput(mid));
        setPeriod2Start(formatDateForInput(new Date(mid.getTime() + 86400000))); setPeriod2End(formatDateForInput(dateRange.max));
        break;
      }
    }
  };

  const quickSelectFleet = (type: string) => {
    const currentYear = availableYears.length > 0 ? availableYears[availableYears.length - 1] : new Date().getFullYear();
    switch (type) {
      case 'full': setSelectedPeriodStart(formatDateForInput(dateRange.min)); setSelectedPeriodEnd(formatDateForInput(dateRange.max)); break;
      case 'ytd': setSelectedPeriodStart(`01/01/${currentYear}`); setSelectedPeriodEnd(formatDateForInput(dateRange.max)); break;
      case 'last12m': { const s = new Date(dateRange.max); s.setFullYear(s.getFullYear() - 1); setSelectedPeriodStart(formatDateForInput(s)); setSelectedPeriodEnd(formatDateForInput(dateRange.max)); break; }
      case 'last6m': { const s = new Date(dateRange.max); s.setMonth(s.getMonth() - 6); setSelectedPeriodStart(formatDateForInput(s)); setSelectedPeriodEnd(formatDateForInput(dateRange.max)); break; }
      case 'last3m': { const s = new Date(dateRange.max); s.setMonth(s.getMonth() - 3); setSelectedPeriodStart(formatDateForInput(s)); setSelectedPeriodEnd(formatDateForInput(dateRange.max)); break; }
    }
  };

  // ── Period comparison data ──
  const periodComparisonData = useMemo(() => {
    const p1Start = parseInputDate(period1Start);
    const p1End = parseInputDate(period1End);
    const p2Start = parseInputDate(period2Start);
    const p2End = parseInputDate(period2End);
    if (!p1Start || !p1End || !p2Start || !p2End) return null;

    const period1Records = records.filter(r => { const d = new Date(r.date); return d >= p1Start && d <= p1End; });
    const period2Records = records.filter(r => { const d = new Date(r.date); return d >= p2Start && d <= p2End; });

    const p1Comp = period1Records.reduce((a, r) => { a[r.component] = (a[r.component] || 0) + 1; return a; }, {} as Record<string, number>);
    const p2Comp = period2Records.reduce((a, r) => { a[r.component] = (a[r.component] || 0) + 1; return a; }, {} as Record<string, number>);
    const allComp = Array.from(new Set([...Object.keys(p1Comp), ...Object.keys(p2Comp)]));

    const componentComparison = allComp.map(comp => {
      const c1 = p1Comp[comp] || 0, c2 = p2Comp[comp] || 0;
      const change = c2 - c1;
      const changePercent = c1 > 0 ? (change / c1) * 100 : (c2 > 0 ? 100 : 0);
      return { component: comp.replace(/_/g, ' '), rawComponent: comp, period1: c1, period2: c2, change, changePercent };
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    const problemTypeData = buildProblemTypeData(period1Records, period2Records);

    // EOD counts per period
    const p1EODCount = hasEOD ? eodRecords!.filter(e => { const d = new Date(e.perfDate); return d >= p1Start && d <= p1End; }).length : 0;
    const p2EODCount = hasEOD ? eodRecords!.filter(e => { const d = new Date(e.perfDate); return d >= p2Start && d <= p2End; }).length : 0;

    return {
      period1: { total: period1Records.length, records: period1Records, dateRange: `${period1Start} - ${period1End}`, eodCount: p1EODCount },
      period2: { total: period2Records.length, records: period2Records, dateRange: `${period2Start} - ${period2End}`, eodCount: p2EODCount },
      totalChange: period2Records.length - period1Records.length,
      totalChangePercent: period1Records.length > 0 ? ((period2Records.length - period1Records.length) / period1Records.length) * 100 : 0,
      componentComparison: componentComparison.slice(0, 10),
      increased: componentComparison.filter(c => c.change > 0).slice(0, 5),
      decreased: componentComparison.filter(c => c.change < 0).slice(0, 5),
      problemTypeData,
    };
  }, [records, eodRecords, hasEOD, period1Start, period1End, period2Start, period2End]);

  // ── Aircraft comparison data ──
  const aircraftComparisonData = useMemo(() => {
    const pStart = parseInputDate(selectedPeriodStart);
    const pEnd = parseInputDate(selectedPeriodEnd);
    if (!pStart || !pEnd || aircraft1List.length === 0 || aircraft2List.length === 0) return null;

    const periodRecords = records.filter(r => { const d = new Date(r.date); return d >= pStart && d <= pEnd; });
    const ac1Records = periodRecords.filter(r => aircraft1List.includes(r.aircraft));
    const ac2Records = periodRecords.filter(r => aircraft2List.includes(r.aircraft));

    const ac1Comp = ac1Records.reduce((a, r) => { a[r.component] = (a[r.component] || 0) + 1; return a; }, {} as Record<string, number>);
    const ac2Comp = ac2Records.reduce((a, r) => { a[r.component] = (a[r.component] || 0) + 1; return a; }, {} as Record<string, number>);
    const allComp = Array.from(new Set([...Object.keys(ac1Comp), ...Object.keys(ac2Comp)]));

    const componentComparison = allComp.map(comp => {
      const c1 = ac1Comp[comp] || 0, c2 = ac2Comp[comp] || 0;
      return { component: comp.replace(/_/g, ' '), rawComponent: comp, aircraft1: c1, aircraft2: c2, difference: c2 - c1 };
    }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

    const group1Label = aircraft1List.length === 1 ? aircraft1List[0] : `Group A (${aircraft1List.length})`;
    const group2Label = aircraft2List.length === 1 ? aircraft2List[0] : `Group B (${aircraft2List.length})`;

    const problemTypeData = buildProblemTypeData(ac1Records, ac2Records);

    return {
      aircraft1: { name: group1Label, total: ac1Records.length, records: ac1Records, count: aircraft1List.length },
      aircraft2: { name: group2Label, total: ac2Records.length, records: ac2Records, count: aircraft2List.length },
      dateRange: `${selectedPeriodStart} - ${selectedPeriodEnd}`,
      componentComparison: componentComparison.slice(0, 10),
      group1Label, group2Label, problemTypeData,
      higher: componentComparison.filter(c => c.difference < 0).slice(0, 5),
      lower: componentComparison.filter(c => c.difference > 0).slice(0, 5)
    };
  }, [records, selectedPeriodStart, selectedPeriodEnd, aircraft1List, aircraft2List]);

  // ── Fleet comparison data ──
  const fleetComparisonData = useMemo(() => {
    const pStart = parseInputDate(selectedPeriodStart);
    const pEnd = parseInputDate(selectedPeriodEnd);
    if (!pStart || !pEnd) return null;

    const periodRecords = records.filter(r => { const d = new Date(r.date); return d >= pStart && d <= pEnd; });
    const ngRecords = periodRecords.filter(r => AIRCRAFT_TYPES['B737-NG'].includes(r.aircraft));
    const maxRecords = periodRecords.filter(r => AIRCRAFT_TYPES['B737-MAX'].includes(r.aircraft));

    // Unique aircraft counts per fleet that actually have findings in this period
    const ngUniqueAC = new Set(ngRecords.map(r => r.aircraft)).size;
    const maxUniqueAC = new Set(maxRecords.map(r => r.aircraft)).size;

    const ngCompMap: Record<string, { count: number; aircraft: Set<string> }> = {};
    ngRecords.forEach(r => {
      const c = r.component;
      if (!ngCompMap[c]) ngCompMap[c] = { count: 0, aircraft: new Set() };
      ngCompMap[c].count++;
      ngCompMap[c].aircraft.add(r.aircraft);
    });

    const maxCompMap: Record<string, { count: number; aircraft: Set<string> }> = {};
    maxRecords.forEach(r => {
      const c = r.component;
      if (!maxCompMap[c]) maxCompMap[c] = { count: 0, aircraft: new Set() };
      maxCompMap[c].count++;
      maxCompMap[c].aircraft.add(r.aircraft);
    });

    const allComp = Array.from(new Set([...Object.keys(ngCompMap), ...Object.keys(maxCompMap)]));

    const componentComparisonRaw = allComp.map(comp => {
      const ngCount = ngCompMap[comp]?.count || 0;
      const maxCount = maxCompMap[comp]?.count || 0;
      const ngAcCount = ngCompMap[comp]?.aircraft.size || 0;
      const maxAcCount = maxCompMap[comp]?.aircraft.size || 0;
      return {
        rawComponent: comp,
        component: comp.replace(/_/g, ' '),
        ngRaw: ngCount,
        maxRaw: maxCount,
        ngAcCount,
        maxAcCount,
        ngAvg: ngAcCount > 0 ? ngCount / ngAcCount : 0,
        maxAvg: maxAcCount > 0 ? maxCount / maxAcCount : 0,
      };
    });

    const componentComparisonForChart = componentComparisonRaw.map(c => ({
      ...c,
      ng: fleetNormalize ? parseFloat(c.ngAvg.toFixed(2)) : c.ngRaw,
      max: fleetNormalize ? parseFloat(c.maxAvg.toFixed(2)) : c.maxRaw,
      difference: fleetNormalize ? parseFloat((c.maxAvg - c.ngAvg).toFixed(2)) : (c.maxRaw - c.ngRaw),
    })).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

    const problemTypeData = buildProblemTypeData(ngRecords, maxRecords);

    const ngTotalNorm = ngUniqueAC > 0 ? ngRecords.length / ngUniqueAC : 0;
    const maxTotalNorm = maxUniqueAC > 0 ? maxRecords.length / maxUniqueAC : 0;

    return {
      ng: {
        total: ngRecords.length,
        records: ngRecords,
        aircraftCount: ngUniqueAC,
        avgPerAircraft: ngUniqueAC > 0 ? (ngRecords.length / ngUniqueAC).toFixed(1) : '0'
      },
      max: {
        total: maxRecords.length,
        records: maxRecords,
        aircraftCount: maxUniqueAC,
        avgPerAircraft: maxUniqueAC > 0 ? (maxRecords.length / maxUniqueAC).toFixed(1) : '0'
      },
      ngTotalNorm,
      maxTotalNorm,
      dateRange: `${selectedPeriodStart} - ${selectedPeriodEnd}`,
      componentComparison: componentComparisonForChart.slice(0, 10),
      problemTypeData,
      ngHigher: componentComparisonForChart.filter(c => c.difference < 0).slice(0, 5),
      maxHigher: componentComparisonForChart.filter(c => c.difference > 0).slice(0, 5)
    };
  }, [records, selectedPeriodStart, selectedPeriodEnd, fleetNormalize]);

  // ── Click handlers for drilldown ──

  // Period mode: component chart click
  const handlePeriodComponentClick = (componentName: string, group: 'period1' | 'period2' | 'both') => {
    if (!periodComparisonData) return;
    const rawComp = componentName.replace(/ /g, '_');
    let recs: SAFARecord[] = [];
    let title = '';
    if (group === 'period1' || group === 'both') {
      recs = [...recs, ...periodComparisonData.period1.records.filter(r => r.component === rawComp || r.component.replace(/_/g, ' ') === componentName)];
    }
    if (group === 'period2' || group === 'both') {
      recs = [...recs, ...periodComparisonData.period2.records.filter(r => r.component === rawComp || r.component.replace(/_/g, ' ') === componentName)];
    }
    if (group === 'both') {
      title = `${componentName} — Both Periods (${recs.length} records)`;
    } else if (group === 'period1') {
      title = `${componentName} — Period 1 (${recs.length} records)`;
    } else {
      title = `${componentName} — Period 2 (${recs.length} records)`;
    }
    openModal(title, recs);
  };

  // Period mode: problem type click
  const handlePeriodProblemTypeClick = (problemType: string, group: 'group1' | 'group2' | 'both') => {
    if (!periodComparisonData) return;
    let recs: SAFARecord[] = [];
    let title = '';
    if (group === 'group1' || group === 'both') {
      recs = [...recs, ...periodComparisonData.period1.records.filter(r => r.problemType === problemType)];
    }
    if (group === 'group2' || group === 'both') {
      recs = [...recs, ...periodComparisonData.period2.records.filter(r => r.problemType === problemType)];
    }
    if (group === 'both') {
      title = `${problemType} — Both Periods (${recs.length} records)`;
    } else if (group === 'group1') {
      title = `${problemType} — Period 1 (${recs.length} records)`;
    } else {
      title = `${problemType} — Period 2 (${recs.length} records)`;
    }
    openModal(title, recs);
  };

  // Aircraft mode: component click
  const handleAircraftComponentClick = (componentName: string, group: 'group1' | 'group2' | 'both') => {
    if (!aircraftComparisonData) return;
    const rawComp = componentName.replace(/ /g, '_');
    let recs: SAFARecord[] = [];
    let title = '';
    if (group === 'group1' || group === 'both') {
      recs = [...recs, ...aircraftComparisonData.aircraft1.records.filter(r => r.component === rawComp || r.component.replace(/_/g, ' ') === componentName)];
    }
    if (group === 'group2' || group === 'both') {
      recs = [...recs, ...aircraftComparisonData.aircraft2.records.filter(r => r.component === rawComp || r.component.replace(/_/g, ' ') === componentName)];
    }
    if (group === 'both') {
      title = `${componentName} — Both Groups (${recs.length} records)`;
    } else if (group === 'group1') {
      title = `${componentName} — ${aircraftComparisonData.group1Label} (${recs.length} records)`;
    } else {
      title = `${componentName} — ${aircraftComparisonData.group2Label} (${recs.length} records)`;
    }
    openModal(title, recs);
  };

  // Aircraft mode: problem type click
  const handleAircraftProblemTypeClick = (problemType: string, group: 'group1' | 'group2' | 'both') => {
    if (!aircraftComparisonData) return;
    let recs: SAFARecord[] = [];
    let title = '';
    if (group === 'group1' || group === 'both') {
      recs = [...recs, ...aircraftComparisonData.aircraft1.records.filter(r => r.problemType === problemType)];
    }
    if (group === 'group2' || group === 'both') {
      recs = [...recs, ...aircraftComparisonData.aircraft2.records.filter(r => r.problemType === problemType)];
    }
    if (group === 'both') {
      title = `${problemType} — Both Groups (${recs.length} records)`;
    } else if (group === 'group1') {
      title = `${problemType} — ${aircraftComparisonData.group1Label} (${recs.length} records)`;
    } else {
      title = `${problemType} — ${aircraftComparisonData.group2Label} (${recs.length} records)`;
    }
    openModal(title, recs);
  };

  // Fleet mode: component click
  const handleFleetComponentClick = (componentName: string, group: 'ng' | 'max' | 'both') => {
    if (!fleetComparisonData) return;
    const rawComp = componentName.replace(/ /g, '_');
    let recs: SAFARecord[] = [];
    let title = '';
    if (group === 'ng' || group === 'both') {
      recs = [...recs, ...fleetComparisonData.ng.records.filter(r => r.component === rawComp || r.component.replace(/_/g, ' ') === componentName)];
    }
    if (group === 'max' || group === 'both') {
      recs = [...recs, ...fleetComparisonData.max.records.filter(r => r.component === rawComp || r.component.replace(/_/g, ' ') === componentName)];
    }
    if (group === 'both') {
      title = `${componentName} — NG + MAX (${recs.length} records)`;
    } else if (group === 'ng') {
      title = `${componentName} — B737-NG (${recs.length} records)`;
    } else {
      title = `${componentName} — B737-MAX (${recs.length} records)`;
    }
    openModal(title, recs);
  };

  // Fleet mode: problem type click
  const handleFleetProblemTypeClick = (problemType: string, group: 'group1' | 'group2' | 'both') => {
    if (!fleetComparisonData) return;
    let recs: SAFARecord[] = [];
    let title = '';
    if (group === 'group1' || group === 'both') {
      recs = [...recs, ...fleetComparisonData.ng.records.filter(r => r.problemType === problemType)];
    }
    if (group === 'group2' || group === 'both') {
      recs = [...recs, ...fleetComparisonData.max.records.filter(r => r.problemType === problemType)];
    }
    if (group === 'both') {
      title = `${problemType} — NG + MAX (${recs.length} records)`;
    } else if (group === 'group1') {
      title = `${problemType} — B737-NG (${recs.length} records)`;
    } else {
      title = `${problemType} — B737-MAX (${recs.length} records)`;
    }
    openModal(title, recs);
  };

  // ── Custom bar click handler for recharts ──
  const ClickableBar = (props: any) => {
    const { x, y, width, height, fill, onClick } = props;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={2}
        ry={2}
        className="cursor-pointer transition-opacity hover:opacity-80"
        onClick={onClick}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Detail Modal */}
      <DetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        records={modalRecords}
      />

      {/* Mode Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-2">
          {[
            { key: 'period' as const, label: '📅 Period vs Period' },
            { key: 'aircraft' as const, label: '✈️ Aircraft vs Aircraft' },
            { key: 'fleet' as const, label: '🛩️ NG Fleet vs MAX Fleet' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setComparisonMode(tab.key)}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                comparisonMode === tab.key ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════ PERIOD vs PERIOD ═══════════ */}
      {comparisonMode === 'period' && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" /> Period Selection
              </h2>
              {(period1Start || period2Start) && (
                <button onClick={() => { setPeriod1Start(''); setPeriod1End(''); setPeriod2Start(''); setPeriod2End(''); }} className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear All
                </button>
              )}
            </div>

            {/* Quick Select */}
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
                  <button key={item.key} onClick={() => quickSelect(item.key)} className="px-2.5 py-2 text-xs font-medium bg-gradient-to-b from-gray-50 to-gray-100 text-gray-700 rounded-lg hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all border border-gray-200 hover:border-blue-200 hover:shadow-sm text-left">
                    <span className="mr-1">{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-2 gap-6">
              <div className="border border-blue-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-blue-50/30">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Period 1</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Start (dd/mm/yyyy)</label>
                    <input type="text" placeholder="01/01/2024" value={period1Start} onChange={(e) => setPeriod1Start(e.target.value)} className="w-full px-2.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">End (dd/mm/yyyy)</label>
                    <input type="text" placeholder="31/12/2024" value={period1End} onChange={(e) => setPeriod1End(e.target.value)} className="w-full px-2.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white" />
                  </div>
                </div>
              </div>
              <div className="border border-purple-200 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-purple-50/30">
                <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /> Period 2</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Start (dd/mm/yyyy)</label>
                    <input type="text" placeholder="01/01/2025" value={period2Start} onChange={(e) => setPeriod2Start(e.target.value)} className="w-full px-2.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-xs bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">End (dd/mm/yyyy)</label>
                    <input type="text" placeholder="31/12/2025" value={period2End} onChange={(e) => setPeriod2End(e.target.value)} className="w-full px-2.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-xs bg-white" />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Calendar className="h-3 w-3" /> Data range: {formatDateForInput(dateRange.min)} — {formatDateForInput(dateRange.max)}
            </div>
          </div>

          {periodComparisonData && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Period 1 Total</h3>
                  <p className="text-3xl font-bold text-blue-600">{periodComparisonData.period1.total}</p>
                  <p className="text-xs text-gray-500 mt-1">findings</p>
                  {periodComparisonData.period1.eodCount > 0 && (
                    <p className="text-xs text-amber-600 mt-1">{periodComparisonData.period1.eodCount} EOD applications</p>
                  )}
                  <p className="text-xs text-blue-600 mt-2">{periodComparisonData.period1.dateRange}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /> Period 2 Total</h3>
                  <p className="text-3xl font-bold text-purple-600">{periodComparisonData.period2.total}</p>
                  <p className="text-xs text-gray-500 mt-1">findings</p>
                  {periodComparisonData.period2.eodCount > 0 && (
                    <p className="text-xs text-amber-600 mt-1">{periodComparisonData.period2.eodCount} EOD applications</p>
                  )}
                  <p className="text-xs text-purple-600 mt-2">{periodComparisonData.period2.dateRange}</p>
                </div>
                <div className={`bg-white rounded-xl border border-gray-200 p-6 ${periodComparisonData.totalChange > 0 ? 'border-red-200 bg-red-50' : periodComparisonData.totalChange < 0 ? 'border-green-200 bg-green-50' : ''}`}>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Change</h3>
                  <div className="flex items-center gap-2">
                    {periodComparisonData.totalChange > 0 ? <TrendingUp className="h-6 w-6 text-red-600" /> : periodComparisonData.totalChange < 0 ? <TrendingDown className="h-6 w-6 text-green-600" /> : <Minus className="h-6 w-6 text-gray-600" />}
                    <div>
                      <p className={`text-3xl font-bold ${periodComparisonData.totalChange > 0 ? 'text-red-600' : periodComparisonData.totalChange < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {periodComparisonData.totalChange > 0 ? '+' : ''}{periodComparisonData.totalChange}
                      </p>
                      <p className="text-xs text-gray-600">{periodComparisonData.totalChangePercent > 0 ? '+' : ''}{periodComparisonData.totalChangePercent.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aircraft Period Tracker */}
              {hasEOD && (() => {
                const p1S = parseInputDate(period1Start);
                const p1E = parseInputDate(period1End);
                const p2S = parseInputDate(period2Start);
                const p2E = parseInputDate(period2End);
                if (!p1S || !p1E || !p2S || !p2E) return null;
                return (
                  <AircraftPeriodTracker
                    records={records}
                    eodRecords={eodRecords!}
                    period1Start={p1S}
                    period1End={p1E}
                    period2Start={p2S}
                    period2End={p2E}
                    period1Label={`P1 (${period1Start} - ${period1End})`}
                    period2Label={`P2 (${period2Start} - ${period2End})`}
                    sigmaSettings={sigmaSettings}
                  />
                );
              })()}

              {/* Problem Type Comparison for Period mode */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Problem Type Comparison</h3>
                <ProblemTypeComparisonChart
                  data={periodComparisonData.problemTypeData}
                  label1="Period 1"
                  label2="Period 2"
                  color1="#3b82f6"
                  color2="#8b5cf6"
                  onClickItem={handlePeriodProblemTypeClick}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-red-600" /> Most Increased</h3>
                  <div className="space-y-2">
                    {periodComparisonData.increased.length > 0 ? periodComparisonData.increased.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 hover:shadow-sm transition-all" onClick={() => handlePeriodComponentClick(item.component, 'both')}>
                        <div><p className="text-sm font-semibold text-gray-900">{item.component} <span className="text-[10px] text-gray-400">🔍</span></p><p className="text-xs text-gray-600">{item.period1} → {item.period2}</p></div>
                        <div className="text-right"><p className="text-lg font-bold text-red-600">+{item.change}</p><p className="text-xs text-red-600">+{item.changePercent.toFixed(0)}%</p></div>
                      </div>
                    )) : <p className="text-sm text-gray-500 text-center py-4">No increased problems</p>}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingDown className="h-5 w-5 text-green-600" /> Most Decreased</h3>
                  <div className="space-y-2">
                    {periodComparisonData.decreased.length > 0 ? periodComparisonData.decreased.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 hover:shadow-sm transition-all" onClick={() => handlePeriodComponentClick(item.component, 'both')}>
                        <div><p className="text-sm font-semibold text-gray-900">{item.component} <span className="text-[10px] text-gray-400">🔍</span></p><p className="text-xs text-gray-600">{item.period1} → {item.period2}</p></div>
                        <div className="text-right"><p className="text-lg font-bold text-green-600">{item.change}</p><p className="text-xs text-green-600">{item.changePercent.toFixed(0)}%</p></div>
                      </div>
                    )) : <p className="text-sm text-gray-500 text-center py-4">No decreased problems</p>}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Component Comparison</h3>
                  <span className="text-xs text-gray-400 flex items-center gap-1">💡 Click bars to view records</span>
                </div>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={periodComparisonData.componentComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="component" angle={-45} textAnchor="end" height={100} stroke="#6b7280" style={{ fontSize: '10px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="period1" fill="#3b82f6" name="Period 1" radius={[2, 2, 0, 0]}
                        onClick={(data: any) => handlePeriodComponentClick(data.component, 'period1')}
                        className="cursor-pointer"
                      />
                      <Bar dataKey="period2" fill="#8b5cf6" name="Period 2" radius={[2, 2, 0, 0]}
                        onClick={(data: any) => handlePeriodComponentClick(data.component, 'period2')}
                        className="cursor-pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {!periodComparisonData && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Use the quick select buttons above or enter custom date ranges</p>
              <p className="text-xs text-gray-400 mt-2">Date format: dd/mm/yyyy (e.g., 01/01/2024)</p>
            </div>
          )}
        </>
      )}

      {/* ═══════════ AIRCRAFT vs AIRCRAFT ═══════════ */}
      {comparisonMode === 'aircraft' && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Plane className="h-5 w-5 text-blue-600" /> Aircraft Comparison</h2>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Select Period (dd/mm/yyyy)</label>
                <div className="flex gap-1">
                  {[{ key: 'full', label: 'Full Range' }, { key: 'ytd', label: 'YTD' }, { key: 'last12m', label: 'Last 12M' }, { key: 'last6m', label: 'Last 6M' }, { key: 'last3m', label: 'Last 3M' }].map(item => (
                    <button key={item.key} onClick={() => quickSelectFleet(item.key)} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors">{item.label}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Start: 01/01/2024" value={selectedPeriodStart} onChange={(e) => setSelectedPeriodStart(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                <input type="text" placeholder="End: 31/12/2024" value={selectedPeriodEnd} onChange={(e) => setSelectedPeriodEnd(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="mt-1 text-center text-xs text-gray-400">Data range: {formatDateForInput(dateRange.min)} — {formatDateForInput(dateRange.max)}</div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-blue-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-blue-50/30">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Group A</h3>
                <AircraftSelector label="Select Aircraft" selectedAircraft={aircraft1List} onSelect={setAircraft1List} allAircraft={allAircraft} aircraftCounts={aircraftCounts} colorScheme="blue" />
              </div>
              <div className="border border-purple-200 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-purple-50/30">
                <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /> Group B</h3>
                <AircraftSelector label="Select Aircraft" selectedAircraft={aircraft2List} onSelect={setAircraft2List} allAircraft={allAircraft} aircraftCounts={aircraftCounts} colorScheme="purple" />
              </div>
            </div>
          </div>

          {aircraftComparisonData && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-blue-500" /><h3 className="text-sm font-medium text-gray-600">{aircraftComparisonData.aircraft1.name}</h3></div>
                  <p className="text-3xl font-bold text-blue-600">{aircraftComparisonData.aircraft1.total}</p>
                  <p className="text-xs text-gray-500 mt-1">findings ({aircraftComparisonData.aircraft1.count} aircraft)</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-purple-500" /><h3 className="text-sm font-medium text-gray-600">{aircraftComparisonData.aircraft2.name}</h3></div>
                  <p className="text-3xl font-bold text-purple-600">{aircraftComparisonData.aircraft2.total}</p>
                  <p className="text-xs text-gray-500 mt-1">findings ({aircraftComparisonData.aircraft2.count} aircraft)</p>
                </div>
                <div className={`bg-white rounded-xl border border-gray-200 p-6 ${aircraftComparisonData.aircraft2.total > aircraftComparisonData.aircraft1.total ? 'border-red-200 bg-red-50' : aircraftComparisonData.aircraft2.total < aircraftComparisonData.aircraft1.total ? 'border-green-200 bg-green-50' : ''}`}>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Difference</h3>
                  <div className="flex items-center gap-2">
                    {aircraftComparisonData.aircraft2.total > aircraftComparisonData.aircraft1.total ? <TrendingUp className="h-6 w-6 text-red-600" /> : aircraftComparisonData.aircraft2.total < aircraftComparisonData.aircraft1.total ? <TrendingDown className="h-6 w-6 text-green-600" /> : <Minus className="h-6 w-6 text-gray-600" />}
                    <div>
                      <p className={`text-3xl font-bold ${aircraftComparisonData.aircraft2.total > aircraftComparisonData.aircraft1.total ? 'text-red-600' : aircraftComparisonData.aircraft2.total < aircraftComparisonData.aircraft1.total ? 'text-green-600' : 'text-gray-600'}`}>
                        {aircraftComparisonData.aircraft2.total - aircraftComparisonData.aircraft1.total > 0 ? '+' : ''}{aircraftComparisonData.aircraft2.total - aircraftComparisonData.aircraft1.total}
                      </p>
                      <p className="text-xs text-gray-600">Group B vs Group A</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Problem Type Comparison</h3>
                <ProblemTypeComparisonChart
                  data={aircraftComparisonData.problemTypeData}
                  label1={aircraftComparisonData.group1Label}
                  label2={aircraftComparisonData.group2Label}
                  color1="#3b82f6"
                  color2="#8b5cf6"
                  onClickItem={handleAircraftProblemTypeClick}
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Component Comparison</h3>
                  <span className="text-xs text-gray-400 flex items-center gap-1">💡 Click bars to view records</span>
                </div>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aircraftComparisonData.componentComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="component" angle={-45} textAnchor="end" height={100} stroke="#6b7280" style={{ fontSize: '10px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="aircraft1" fill="#3b82f6" name={aircraftComparisonData.group1Label} radius={[2, 2, 0, 0]}
                        onClick={(data: any) => handleAircraftComponentClick(data.component, 'group1')}
                        className="cursor-pointer"
                      />
                      <Bar dataKey="aircraft2" fill="#8b5cf6" name={aircraftComparisonData.group2Label} radius={[2, 2, 0, 0]}
                        onClick={(data: any) => handleAircraftComponentClick(data.component, 'group2')}
                        className="cursor-pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{aircraftComparisonData.group1Label} Has More</h3>
                  <div className="space-y-2">
                    {aircraftComparisonData.higher.length > 0 ? aircraftComparisonData.higher.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 hover:shadow-sm transition-all" onClick={() => handleAircraftComponentClick(item.component, 'group1')}>
                        <div><p className="text-sm font-semibold text-gray-900">{item.component} <span className="text-[10px] text-gray-400">🔍</span></p><p className="text-xs text-gray-600">{item.aircraft1} vs {item.aircraft2}</p></div>
                        <p className="text-lg font-bold text-blue-600">+{Math.abs(item.difference)}</p>
                      </div>
                    )) : <p className="text-sm text-gray-500 text-center py-4">No differences</p>}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{aircraftComparisonData.group2Label} Has More</h3>
                  <div className="space-y-2">
                    {aircraftComparisonData.lower.length > 0 ? aircraftComparisonData.lower.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 hover:shadow-sm transition-all" onClick={() => handleAircraftComponentClick(item.component, 'group2')}>
                        <div><p className="text-sm font-semibold text-gray-900">{item.component} <span className="text-[10px] text-gray-400">🔍</span></p><p className="text-xs text-gray-600">{item.aircraft1} vs {item.aircraft2}</p></div>
                        <p className="text-lg font-bold text-purple-600">+{Math.abs(item.difference)}</p>
                      </div>
                    )) : <p className="text-sm text-gray-500 text-center py-4">No differences</p>}
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

      {/* ═══════════ NG FLEET vs MAX FLEET ═══════════ */}
      {comparisonMode === 'fleet' && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Plane className="h-5 w-5 text-blue-600" /> Fleet Comparison</h2>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Select Period (dd/mm/yyyy)</label>
                <div className="flex gap-1">
                  {[{ key: 'full', label: 'Full Range' }, { key: 'ytd', label: 'YTD' }, { key: 'last12m', label: 'Last 12M' }, { key: 'last6m', label: 'Last 6M' }, { key: 'last3m', label: 'Last 3M' }].map(item => (
                    <button key={item.key} onClick={() => quickSelectFleet(item.key)} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors">{item.label}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Start: 01/01/2024" value={selectedPeriodStart} onChange={(e) => setSelectedPeriodStart(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                <input type="text" placeholder="End: 31/12/2024" value={selectedPeriodEnd} onChange={(e) => setSelectedPeriodEnd(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="mt-1 text-center text-xs text-gray-400">Data range: {formatDateForInput(dateRange.min)} — {formatDateForInput(dateRange.max)}</div>
            </div>
          </div>

          {fleetComparisonData && (
            <>
              {/* Normalize Toggle */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Plane className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Per-Aircraft Normalization</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        NG fleet has <strong>{fleetComparisonData.ng.aircraftCount}</strong> aircraft with findings, MAX fleet has <strong>{fleetComparisonData.max.aircraftCount}</strong> aircraft with findings in this period.
                        {!fleetNormalize
                          ? ' Enable to compare average findings per aircraft, removing fleet size bias.'
                          : ' Currently showing per-aircraft averages. Disable to return to total counts.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFleetNormalize(!fleetNormalize)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm ${
                      fleetNormalize
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {fleetNormalize ? (
                      <><ToggleRight className="h-5 w-5" /> Per A/C ON</>
                    ) : (
                      <><ToggleLeft className="h-5 w-5" /> Total Count</>
                    )}
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-2"><Plane className="h-5 w-5 text-blue-600" /><h3 className="text-sm font-medium text-gray-600">B737-NG Fleet</h3></div>
                  {fleetNormalize ? (
                    <>
                      <p className="text-3xl font-bold text-blue-600">{fleetComparisonData.ng.avgPerAircraft}</p>
                      <p className="text-xs text-gray-500 mt-1">avg findings / aircraft</p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-blue-600">{fleetComparisonData.ng.total}</p>
                      <p className="text-xs text-gray-500 mt-1">total findings</p>
                    </>
                  )}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">{fleetComparisonData.ng.aircraftCount} aircraft with findings</p>
                    {!fleetNormalize && <p className="text-xs font-semibold text-blue-600">{fleetComparisonData.ng.avgPerAircraft} avg/aircraft</p>}
                    {fleetNormalize && <p className="text-xs font-semibold text-blue-600">{fleetComparisonData.ng.total} total findings</p>}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-2"><Plane className="h-5 w-5 text-purple-600" /><h3 className="text-sm font-medium text-gray-600">B737-MAX Fleet</h3></div>
                  {fleetNormalize ? (
                    <>
                      <p className="text-3xl font-bold text-purple-600">{fleetComparisonData.max.avgPerAircraft}</p>
                      <p className="text-xs text-gray-500 mt-1">avg findings / aircraft</p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-purple-600">{fleetComparisonData.max.total}</p>
                      <p className="text-xs text-gray-500 mt-1">total findings</p>
                    </>
                  )}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">{fleetComparisonData.max.aircraftCount} aircraft with findings</p>
                    {!fleetNormalize && <p className="text-xs font-semibold text-purple-600">{fleetComparisonData.max.avgPerAircraft} avg/aircraft</p>}
                    {fleetNormalize && <p className="text-xs font-semibold text-purple-600">{fleetComparisonData.max.total} total findings</p>}
                  </div>
                </div>
                <div className={`bg-white rounded-xl border border-gray-200 p-6 ${
                  (fleetNormalize ? fleetComparisonData.maxTotalNorm > fleetComparisonData.ngTotalNorm : fleetComparisonData.max.total > fleetComparisonData.ng.total)
                    ? 'border-red-200 bg-red-50'
                    : (fleetNormalize ? fleetComparisonData.maxTotalNorm < fleetComparisonData.ngTotalNorm : fleetComparisonData.max.total < fleetComparisonData.ng.total)
                      ? 'border-green-200 bg-green-50' : ''
                }`}>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Difference</h3>
                  {fleetNormalize ? (
                    <div className="flex items-center gap-2">
                      {fleetComparisonData.maxTotalNorm > fleetComparisonData.ngTotalNorm ? <TrendingUp className="h-6 w-6 text-red-600" /> : fleetComparisonData.maxTotalNorm < fleetComparisonData.ngTotalNorm ? <TrendingDown className="h-6 w-6 text-green-600" /> : <Minus className="h-6 w-6 text-gray-600" />}
                      <div>
                        <p className={`text-3xl font-bold ${
                          fleetComparisonData.maxTotalNorm > fleetComparisonData.ngTotalNorm ? 'text-red-600' : fleetComparisonData.maxTotalNorm < fleetComparisonData.ngTotalNorm ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {(fleetComparisonData.maxTotalNorm - fleetComparisonData.ngTotalNorm) > 0 ? '+' : ''}{(fleetComparisonData.maxTotalNorm - fleetComparisonData.ngTotalNorm).toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-600">MAX vs NG (avg/aircraft)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {fleetComparisonData.max.total > fleetComparisonData.ng.total ? <TrendingUp className="h-6 w-6 text-red-600" /> : fleetComparisonData.max.total < fleetComparisonData.ng.total ? <TrendingDown className="h-6 w-6 text-green-600" /> : <Minus className="h-6 w-6 text-gray-600" />}
                      <div>
                        <p className={`text-3xl font-bold ${
                          fleetComparisonData.max.total > fleetComparisonData.ng.total ? 'text-red-600' : fleetComparisonData.max.total < fleetComparisonData.ng.total ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {fleetComparisonData.max.total - fleetComparisonData.ng.total > 0 ? '+' : ''}{fleetComparisonData.max.total - fleetComparisonData.ng.total}
                        </p>
                        <p className="text-xs text-gray-600">MAX vs NG (total)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Problem Type */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Problem Type Comparison</h3>
                <ProblemTypeComparisonChart
                  data={fleetComparisonData.problemTypeData}
                  label1="B737-NG"
                  label2="B737-MAX"
                  color1="#3b82f6"
                  color2="#8b5cf6"
                  onClickItem={handleFleetProblemTypeClick}
                />
              </div>

              {/* Component Comparison Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Component Comparison</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 flex items-center gap-1">💡 Click bars to view records</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      fleetNormalize ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {fleetNormalize ? '📊 Per-Aircraft Average' : '📊 Total Count'}
                    </span>
                  </div>
                </div>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fleetComparisonData.componentComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="component" angle={-45} textAnchor="end" height={100} stroke="#6b7280" style={{ fontSize: '10px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: number, name: string, props: any) => {
                          const item = props.payload;
                          if (fleetNormalize) {
                            const raw = name === 'B737-NG' ? item.ngRaw : item.maxRaw;
                            const acCount = name === 'B737-NG' ? item.ngAcCount : item.maxAcCount;
                            return [`${value.toFixed(2)} avg (${raw} findings ÷ ${acCount} aircraft with this component)`, name];
                          }
                          return [value, name];
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="ng" fill="#3b82f6" name="B737-NG" radius={[2, 2, 0, 0]}
                        onClick={(data: any) => handleFleetComponentClick(data.component, 'ng')}
                        className="cursor-pointer"
                      />
                      <Bar dataKey="max" fill="#8b5cf6" name="B737-MAX" radius={[2, 2, 0, 0]}
                        onClick={(data: any) => handleFleetComponentClick(data.component, 'max')}
                        className="cursor-pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {fleetNormalize && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-[11px] text-amber-800">
                      <strong>ℹ️ Per-Aircraft Average:</strong> Each component&apos;s total finding count is divided by the number of aircraft that had findings for <em>that specific component</em>, not the total fleet size.
                      E.g., if &quot;Cargo Tape&quot; was recorded 100 times across 25 different NG aircraft → 100 ÷ 25 = <strong>4.0 avg/aircraft</strong>.
                      This ensures a fair comparison independent of fleet size differences.
                      Aircraft counts shown in the tooltip reflect only aircraft with findings for each specific component.
                    </p>
                  </div>
                )}
              </div>

              {/* Top Differences */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">NG Fleet Has More</h3>
                  <p className="text-xs text-gray-500 mb-4">{fleetNormalize ? 'Per-aircraft average basis' : 'Total count basis'}</p>
                  <div className="space-y-2">
                    {fleetComparisonData.ngHigher.length > 0 ? fleetComparisonData.ngHigher.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 hover:shadow-sm transition-all" onClick={() => handleFleetComponentClick(item.component, 'ng')}>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.component} <span className="text-[10px] text-gray-400">🔍</span></p>
                          {fleetNormalize ? (
                            <p className="text-xs text-gray-500">NG: {item.ngAvg.toFixed(2)}/ac ({item.ngRaw} findings, {item.ngAcCount} ac) — MAX: {item.maxAvg.toFixed(2)}/ac ({item.maxRaw} findings, {item.maxAcCount} ac)</p>
                          ) : (
                            <p className="text-xs text-gray-600">NG: {item.ngRaw} vs MAX: {item.maxRaw}</p>
                          )}
                        </div>
                        <p className="text-lg font-bold text-blue-600">+{Math.abs(item.difference).toFixed(fleetNormalize ? 2 : 0)}</p>
                      </div>
                    )) : <p className="text-sm text-gray-500 text-center py-4">No differences</p>}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">MAX Fleet Has More</h3>
                  <p className="text-xs text-gray-500 mb-4">{fleetNormalize ? 'Per-aircraft average basis' : 'Total count basis'}</p>
                  <div className="space-y-2">
                    {fleetComparisonData.maxHigher.length > 0 ? fleetComparisonData.maxHigher.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 hover:shadow-sm transition-all" onClick={() => handleFleetComponentClick(item.component, 'max')}>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.component} <span className="text-[10px] text-gray-400">🔍</span></p>
                          {fleetNormalize ? (
                            <p className="text-xs text-gray-500">MAX: {item.maxAvg.toFixed(2)}/ac ({item.maxRaw} findings, {item.maxAcCount} ac) — NG: {item.ngAvg.toFixed(2)}/ac ({item.ngRaw} findings, {item.ngAcCount} ac)</p>
                          ) : (
                            <p className="text-xs text-gray-600">NG: {item.ngRaw} vs MAX: {item.maxRaw}</p>
                          )}
                        </div>
                        <p className="text-lg font-bold text-purple-600">+{Math.abs(item.difference).toFixed(fleetNormalize ? 2 : 0)}</p>
                      </div>
                    )) : <p className="text-sm text-gray-500 text-center py-4">No differences</p>}
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
