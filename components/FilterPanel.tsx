'use client';

import { useState, useEffect } from 'react';
import { AnalysisResult } from '@/lib/types';
import { Filter, X } from 'lucide-react';

interface FilterPanelProps {
  data: AnalysisResult;
  onFilter: (filters: any) => void;
}

export function FilterPanel({ data, onFilter }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<string[]>([]);
  const [selectedATA, setSelectedATA] = useState<string[]>([]);
  const [selectedProblemTypes, setSelectedProblemTypes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const aircraft = Object.keys(data.aircraftCounts).sort();
  const ataCodes = Object.keys(data.ataCounts).sort();
  const problemTypes = Object.keys(data.problemTypeCounts).sort();

  const applyFilters = () => {
    const filters: any = {};

    if (startDate || endDate) {
      filters.dateRange = [
        startDate ? new Date(startDate) : new Date(data.statistics.dateRange.start),
        endDate ? new Date(endDate) : new Date(data.statistics.dateRange.end),
      ];
    }

    if (selectedAircraft.length > 0) {
      filters.aircraft = selectedAircraft;
    }

    if (selectedATA.length > 0) {
      filters.ata = selectedATA;
    }

    if (selectedProblemTypes.length > 0) {
      filters.problemType = selectedProblemTypes;
    }

    onFilter(filters);
  };

  const resetFilters = () => {
    setSelectedAircraft([]);
    setSelectedATA([]);
    setSelectedProblemTypes([]);
    setStartDate('');
    setEndDate('');
    onFilter({});
  };

  const activeFiltersCount = 
    selectedAircraft.length + 
    selectedATA.length + 
    selectedProblemTypes.length + 
    (startDate ? 1 : 0) + 
    (endDate ? 1 : 0);

  useEffect(() => {
    applyFilters();
  }, [selectedAircraft, selectedATA, selectedProblemTypes, startDate, endDate]);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="font-semibold text-gray-900">Filtreler</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              {activeFiltersCount} aktif
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
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Temizle
            </button>
          )}
          <X className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-gray-200 space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Tarihi</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Aircraft */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uçak ({selectedAircraft.length}/{aircraft.length})
              </label>
              <div className="border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto text-sm">
                {aircraft.slice(0, 10).map(ac => (
                  <label key={ac} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
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
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{ac}</span>
                    <span className="text-gray-400 text-xs ml-auto">({data.aircraftCounts[ac]})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ATA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ATA Chapter ({selectedATA.length}/{ataCodes.length})
              </label>
              <div className="border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto text-sm">
                {ataCodes.slice(0, 10).map(ata => (
                  <label key={ata} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
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
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{ata}</span>
                    <span className="text-gray-400 text-xs ml-auto">({data.ataCounts[ata]})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
