'use client';

import { useState, useEffect, useMemo } from 'react';
import { AnalysisResult } from '@/lib/types';
import { Filter, X, Search, Calendar, Clock } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear } from 'date-fns';

interface FilterPanelProps {
  data: AnalysisResult;
  onFilter: (filters: any) => void;
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

export function FilterPanel({ data, onFilter }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAircraftTypes, setSelectedAircraftTypes] = useState<string[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<string[]>([]);
  const [selectedATA, setSelectedATA] = useState<string[]>([]);
  const [selectedProblemTypes, setSelectedProblemTypes] = useState<string[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [aircraftSearch, setAircraftSearch] = useState('');
  const [ataSearch, setATASearch] = useState('');
  const [componentSearch, setComponentSearch] = useState('');

  const aircraft = Object.keys(data.aircraftCounts).sort();
  const ataCodes = Object.keys(data.ataCounts).sort();
  const problemTypes = Object.keys(data.problemTypeCounts).sort();
  const components = Object.keys(data.componentCounts).sort();

  const filteredAircraft = aircraft.filter(ac =>
    ac.toLowerCase().includes(aircraftSearch.toLowerCase())
  );

  const filteredATA = ataCodes.filter(ata =>
    ata.toLowerCase().includes(ataSearch.toLowerCase())
  );

  const filteredComponents = components.filter(comp =>
    comp.toLowerCase().includes(componentSearch.toLowerCase())
  );

  // Determine the latest date in the dataset for quick select reference
  const latestDate = useMemo(() => {
    return new Date(data.statistics.dateRange.end);
  }, [data.statistics.dateRange.end]);

  const earliestDate = useMemo(() => {
    return new Date(data.statistics.dateRange.start);
  }, [data.statistics.dateRange.start]);

  const quickSelectDate = (type: string) => {
    const now = latestDate;
    let start: Date;
    let end: Date = endOfMonth(now);

    switch (type) {
      case 'last1m':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last3m':
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case 'last6m':
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        break;
      case 'last12m':
        start = startOfMonth(subMonths(now, 11));
        end = endOfMonth(now);
        break;
      case 'ytd':
        start = startOfYear(now);
        end = endOfMonth(now);
        break;
      case 'full':
        start = earliestDate;
        end = endOfMonth(now);
        break;
      default:
        return;
    }

    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const applyFilters = () => {
    const filters: any = {};

    if (startDate || endDate) {
      filters.dateRange = [
        startDate ? new Date(startDate) : new Date(data.statistics.dateRange.start),
        endDate ? new Date(endDate) : new Date(data.statistics.dateRange.end),
      ];
    }

    let aircraftToFilter = [...selectedAircraft];
    if (selectedAircraftTypes.length > 0) {
      const typeAircraft = selectedAircraftTypes.flatMap(type => AIRCRAFT_TYPES[type as keyof typeof AIRCRAFT_TYPES] || []);
      const combined = aircraftToFilter.concat(typeAircraft);
      aircraftToFilter = Array.from(new Set(combined));
    }

    if (aircraftToFilter.length > 0) {
      filters.aircraft = aircraftToFilter;
    }

    if (selectedATA.length > 0) {
      filters.ata = selectedATA;
    }

    if (selectedProblemTypes.length > 0) {
      filters.problemType = selectedProblemTypes;
    }

    if (selectedComponents.length > 0) {
      filters.component = selectedComponents;
    }

    onFilter(filters);
  };

  const resetFilters = () => {
    setSelectedAircraftTypes([]);
    setSelectedAircraft([]);
    setSelectedATA([]);
    setSelectedProblemTypes([]);
    setSelectedComponents([]);
    setStartDate('');
    setEndDate('');
    setAircraftSearch('');
    setATASearch('');
    setComponentSearch('');
    onFilter({});
  };

  const activeFiltersCount =
    selectedAircraftTypes.length +
    selectedAircraft.length +
    selectedATA.length +
    selectedProblemTypes.length +
    selectedComponents.length +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  // Active date label for display
  const activeDateLabel = useMemo(() => {
    if (!startDate && !endDate) return null;
    const s = startDate ? format(new Date(startDate), 'dd MMM yyyy') : '...';
    const e = endDate ? format(new Date(endDate), 'dd MMM yyyy') : '...';
    return `${s} → ${e}`;
  }, [startDate, endDate]);

  useEffect(() => {
    applyFilters();
  }, [selectedAircraftTypes, selectedAircraft, selectedATA, selectedProblemTypes, selectedComponents, startDate, endDate]);

  const quickButtons = [
    { key: 'last1m', label: 'Last 1M', icon: '📅' },
    { key: 'last3m', label: 'Last 3M', icon: '📅' },
    { key: 'last6m', label: 'Last 6M', icon: '📅' },
    { key: 'last12m', label: 'Last 12M', icon: '📅' },
    { key: 'ytd', label: 'YTD', icon: '📆' },
    { key: 'full', label: 'Full Range', icon: '📋' },
  ];

  // Determine which quick button is "active" based on current dates
  const activeQuick = useMemo(() => {
    if (!startDate || !endDate) return null;
    const now = latestDate;
    const checks: Record<string, { start: Date; end: Date }> = {
      last1m: { start: startOfMonth(now), end: endOfMonth(now) },
      last3m: { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) },
      last6m: { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) },
      last12m: { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) },
      ytd: { start: startOfYear(now), end: endOfMonth(now) },
      full: { start: earliestDate, end: endOfMonth(now) },
    };
    for (const [key, range] of Object.entries(checks)) {
      if (
        format(range.start, 'yyyy-MM-dd') === startDate &&
        format(range.end, 'yyyy-MM-dd') === endDate
      ) {
        return key;
      }
    }
    return null;
  }, [startDate, endDate, latestDate, earliestDate]);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-900">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              {activeFiltersCount}
            </span>
          )}
          {activeDateLabel && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
              <Calendar className="h-3 w-3" />
              {activeDateLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetFilters();
              }}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              Clear
            </button>
          )}
          <X className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-gray-200 space-y-3">
          {/* Quick Date Select */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
              <Clock className="h-3.5 w-3.5 text-gray-500" />
              Quick Date Range
              <span className="text-gray-400 font-normal">(based on latest data: {format(latestDate, 'MMM yyyy')})</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {quickButtons.map(item => (
                <button
                  key={item.key}
                  onClick={() => quickSelectDate(item.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                    activeQuick === item.key
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-gradient-to-b from-gray-50 to-gray-100 text-gray-700 border-gray-200 hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 hover:border-blue-200 hover:shadow-sm'
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                >
                  ✕ Clear dates
                </button>
              )}
            </div>
          </div>

          {/* Aircraft Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Aircraft Type ({selectedAircraftTypes.length}/2)
            </label>
            <div className="flex gap-2">
              <label className="flex items-center gap-1.5 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={selectedAircraftTypes.includes('B737-NG')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAircraftTypes([...selectedAircraftTypes, 'B737-NG']);
                    } else {
                      setSelectedAircraftTypes(selectedAircraftTypes.filter(t => t !== 'B737-NG'));
                    }
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                />
                <span className="text-xs font-medium text-gray-700">B737-NG</span>
              </label>
              <label className="flex items-center gap-1.5 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={selectedAircraftTypes.includes('B737-MAX')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAircraftTypes([...selectedAircraftTypes, 'B737-MAX']);
                    } else {
                      setSelectedAircraftTypes(selectedAircraftTypes.filter(t => t !== 'B737-MAX'));
                    }
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                />
                <span className="text-xs font-medium text-gray-700">B737-MAX</span>
              </label>
            </div>
          </div>

          {/* Main Filters */}
          <div className="grid grid-cols-4 gap-3">
            {/* Aircraft with Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Aircraft ({selectedAircraft.length}/{aircraft.length})
              </label>
              <div className="border border-gray-300 rounded-lg">
                <div className="p-1.5 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={aircraftSearch}
                      onChange={(e) => setAircraftSearch(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="p-1.5 max-h-32 overflow-y-auto">
                  {filteredAircraft.length > 0 ? (
                    filteredAircraft.map(ac => (
                      <label key={ac} className="flex items-center gap-1.5 p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAircraft.includes(ac)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAircraft([...selectedAircraft, ac]);
                            } else {
                              setSelectedAircraft(selectedAircraft.filter(a => a !== ac));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-xs text-gray-700">{ac}</span>
                        <span className="text-gray-400 text-xs ml-auto">({data.aircraftCounts[ac]})</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-1">No results</p>
                  )}
                </div>
              </div>
            </div>

            {/* ATA with Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                ATA Chapter ({selectedATA.length}/{ataCodes.length})
              </label>
              <div className="border border-gray-300 rounded-lg">
                <div className="p-1.5 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={ataSearch}
                      onChange={(e) => setATASearch(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="p-1.5 max-h-32 overflow-y-auto">
                  {filteredATA.length > 0 ? (
                    filteredATA.map(ata => (
                      <label key={ata} className="flex items-center gap-1.5 p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedATA.includes(ata)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedATA([...selectedATA, ata]);
                            } else {
                              setSelectedATA(selectedATA.filter(a => a !== ata));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-xs text-gray-700">{ata}</span>
                        <span className="text-gray-400 text-xs ml-auto">({data.ataCounts[ata]})</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-1">No results</p>
                  )}
                </div>
              </div>
            </div>

            {/* Problem Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Problem Type ({selectedProblemTypes.length}/{problemTypes.length})
              </label>
              <div className="border border-gray-300 rounded-lg p-1.5 max-h-32 overflow-y-auto">
                {problemTypes.map(type => (
                  <label key={type} className="flex items-center gap-1.5 p-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProblemTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProblemTypes([...selectedProblemTypes, type]);
                        } else {
                          setSelectedProblemTypes(selectedProblemTypes.filter(t => t !== type));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                    />
                    <span className="text-xs text-gray-700">{type}</span>
                    <span className="text-gray-400 text-xs ml-auto">({data.problemTypeCounts[type]})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Component with Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Component ({selectedComponents.length}/{components.length})
              </label>
              <div className="border border-gray-300 rounded-lg">
                <div className="p-1.5 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={componentSearch}
                      onChange={(e) => setComponentSearch(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="p-1.5 max-h-32 overflow-y-auto">
                  {filteredComponents.length > 0 ? (
                    filteredComponents.map(comp => (
                      <label key={comp} className="flex items-center gap-1.5 p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedComponents.includes(comp)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedComponents([...selectedComponents, comp]);
                            } else {
                              setSelectedComponents(selectedComponents.filter(c => c !== comp));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-xs text-gray-700">{comp}</span>
                        <span className="text-gray-400 text-xs ml-auto">({data.componentCounts[comp]})</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-1">No results</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Manual Date Range at bottom */}
          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
              <Calendar className="h-3.5 w-3.5 text-gray-500" />
              Manual Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
