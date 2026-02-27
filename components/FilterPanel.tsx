'use client';

import { useState, useEffect } from 'react';
import { AnalysisResult } from '@/lib/types';
import { Filter, X, Search } from 'lucide-react';

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

  const applyFilters = () => {
    const filters: any = {};

    if (startDate || endDate) {
      filters.dateRange = [
        startDate ? new Date(startDate) : new Date(data.statistics.dateRange.start),
        endDate ? new Date(endDate) : new Date(data.statistics.dateRange.end),
      ];
    }

    // Ucak tipi filtresini uygula
    let aircraftToFilter = [...selectedAircraft];
    if (selectedAircraftTypes.length > 0) {
      const typeAircraft = selectedAircraftTypes.flatMap(type => AIRCRAFT_TYPES[type as keyof typeof AIRCRAFT_TYPES] || []);
      aircraftToFilter = [...new Set([...aircraftToFilter, ...typeAircraft])];
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

  useEffect(() => {
    applyFilters();
  }, [selectedAircraftTypes, selectedAircraft, selectedATA, selectedProblemTypes, selectedComponents, startDate, endDate]);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-900">Filtreler</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              {activeFiltersCount}
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
              Temizle
            </button>
          )}
          <X className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-gray-200 space-y-3">
          {/* Aircraft Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Ucak Tipi ({selectedAircraftTypes.length}/2)
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
                Ucak ({selectedAircraft.length}/{aircraft.length})
              </label>
              <div className="border border-gray-300 rounded-lg">
                <div className="p-1.5 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Ara..."
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
                    <p className="text-xs text-gray-400 text-center py-1">Sonuc yok</p>
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
                      placeholder="Ara..."
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
                    <p className="text-xs text-gray-400 text-center py-1">Sonuc yok</p>
                  )}
                </div>
              </div>
            </div>

            {/* Problem Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Problem Tipi ({selectedProblemTypes.length}/{problemTypes.length})
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
                Komponent ({selectedComponents.length}/{components.length})
              </label>
              <div className="border border-gray-300 rounded-lg">
                <div className="p-1.5 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Ara..."
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
                    <p className="text-xs text-gray-400 text-center py-1">Sonuc yok</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Date Range at bottom */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Baslangic Tarihi</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Bitis Tarihi</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
