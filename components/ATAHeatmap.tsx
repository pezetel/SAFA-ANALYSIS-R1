'use client';

import { SAFARecord, EODRecord, SigmaSettings } from '@/lib/types';
import { format, startOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { DetailModal } from './DetailModal';
import { computeWeightedStats, getAlertLevelSigma } from '@/lib/eodProcessor';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';

interface ATAHeatmapProps {
  records: SAFARecord[];
  eodRecords?: EODRecord[];
  sigmaSettings?: SigmaSettings;
}

const DEFAULT_SIGMA: SigmaSettings = { multiplier: 2 };

export function ATAHeatmap({ records, eodRecords, sigmaSettings = DEFAULT_SIGMA }: ATAHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<{ ata: string; month: string } | null>(null);
  const [modalRecords, setModalRecords] = useState<SAFARecord[]>([]);
  const [viewMode, setViewMode] = useState<'count' | 'rate'>('count');
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCount, setShowCount] = useState<number>(10);

  const hasEOD = eodRecords && eodRecords.length > 0;

  const getATA2 = (ata: string): string => {
    if (!ata) return 'XX';
    const clean = ata.replace(/[^0-9]/g, '');
    return clean.substring(0, 2) || 'XX';
  };

  const ata2List = useMemo(() => {
    return Array.from(new Set(records.map(r => getATA2(r.ata)))).sort();
  }, [records]);

  const months = useMemo(() => {
    return Array.from(
      new Set(records.map(r => format(startOfMonth(new Date(r.date)), 'yyyy-MM')))
    ).sort();
  }, [records]);

  const heatmapData = useMemo(() => {
    const data: Record<string, Record<string, number>> = {};
    ata2List.forEach(ata2 => {
      data[ata2] = {};
      months.forEach(month => {
        data[ata2][month] = 0;
      });
    });

    records.forEach(record => {
      const month = format(startOfMonth(new Date(record.date)), 'yyyy-MM');
      const ata2 = getATA2(record.ata);
      if (data[ata2] && data[ata2][month] !== undefined) {
        data[ata2][month]++;
      }
    });

    return data;
  }, [records, ata2List, months]);

  const detailData = useMemo(() => {
    const data: Record<string, Record<string, SAFARecord[]>> = {};
    records.forEach(record => {
      const month = format(startOfMonth(new Date(record.date)), 'yyyy-MM');
      const ata2 = getATA2(record.ata);
      if (!data[ata2]) data[ata2] = {};
      if (!data[ata2][month]) data[ata2][month] = [];
      data[ata2][month].push(record);
    });
    return data;
  }, [records]);

  const maxValue = useMemo(() => {
    return Math.max(
      ...Object.values(heatmapData).flatMap(monthData => Object.values(monthData)),
      1
    );
  }, [heatmapData]);

  const eodPerMonth = useMemo(() => {
    if (!hasEOD) return {};
    const map: Record<string, number> = {};
    eodRecords!.forEach(e => {
      const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
      map[month] = (map[month] || 0) + 1;
    });
    return map;
  }, [eodRecords, hasEOD]);

  const sortedATA = useMemo(() => {
    return Object.entries(heatmapData)
      .map(([ata2, data]) => [ata2, Object.values(data).reduce((a, b) => a + b, 0)] as [string, number])
      .sort((a, b) => b[1] - a[1])
      .map(([ata2]) => ata2);
  }, [heatmapData]);

  const rateData = useMemo(() => {
    if (!hasEOD) return {};
    const rates: Record<string, Record<string, number>> = {};
    sortedATA.forEach(ata2 => {
      rates[ata2] = {};
      months.forEach(month => {
        const findings = heatmapData[ata2]?.[month] || 0;
        const eods = eodPerMonth[month] || 0;
        rates[ata2][month] = eods > 0 ? findings / eods : -1;
      });
    });
    return rates;
  }, [sortedATA, months, heatmapData, eodPerMonth, hasEOD]);

  const ataWeightedStats = useMemo(() => {
    if (!hasEOD) return {};
    const stats: Record<string, { weightedAvg: number; weightedSigma: number }> = {};
    sortedATA.forEach(ata2 => {
      const rates: number[] = [];
      const weights: number[] = [];
      months.forEach(month => {
        const eodCount = eodPerMonth[month] || 0;
        if (eodCount > 0) {
          const ataFindings = heatmapData[ata2]?.[month] || 0;
          rates.push(ataFindings / eodCount);
          weights.push(eodCount);
        }
      });
      stats[ata2] = computeWeightedStats(rates, weights);
    });
    return stats;
  }, [sortedATA, months, heatmapData, eodPerMonth, hasEOD]);

  const ataNames: Record<string, string> = {
    '05': 'Time Limits', '06': 'Dimensions', '07': 'Lifting & Shoring',
    '08': 'Leveling & Weighing', '09': 'Towing & Taxiing', '10': 'Parking & Mooring',
    '11': 'Placards', '12': 'Servicing', '20': 'Standard Practices',
    '21': 'Air Conditioning', '22': 'Auto Flight', '23': 'Communications',
    '24': 'Electrical Power', '25': 'Equipment/Furnishings', '26': 'Fire Protection',
    '27': 'Flight Controls', '28': 'Fuel', '29': 'Hydraulic Power',
    '30': 'Ice & Rain Protection', '31': 'Instruments', '32': 'Landing Gear',
    '33': 'Lights', '34': 'Navigation', '35': 'Oxygen', '36': 'Pneumatic',
    '38': 'Water/Waste', '45': 'Central Maint System', '49': 'Airborne APU',
    '51': 'Structures', '52': 'Doors', '53': 'Fuselage',
    '54': 'Nacelles/Pylons', '55': 'Stabilizers', '56': 'Windows', '57': 'Wings',
    '71': 'Power Plant', '72': 'Engine', '73': 'Engine Fuel & Control',
    '74': 'Ignition', '75': 'Air', '76': 'Engine Controls',
    '77': 'Engine Indicating', '78': 'Exhaust', '79': 'Oil', '80': 'Starting',
  };

  const getATALabel = (ata2: string): string => {
    const name = ataNames[ata2];
    return name ? `${ata2} - ${name}` : ata2;
  };

  const filteredATA = useMemo(() => {
    if (!searchTerm.trim()) return sortedATA;
    const term = searchTerm.trim().toUpperCase();
    return sortedATA.filter(ata2 => {
      const label = getATALabel(ata2).toUpperCase();
      return label.includes(term) || ata2.includes(term);
    });
  }, [sortedATA, searchTerm]);

  const displayedATA = showAll ? filteredATA : filteredATA.slice(0, showCount);
  const totalATACount = filteredATA.length;
  const hasMore = totalATACount > showCount;

  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-50';
    const intensity = value / maxValue;
    if (intensity > 0.75) return 'bg-red-500 text-white';
    if (intensity > 0.5) return 'bg-orange-400 text-white';
    if (intensity > 0.25) return 'bg-yellow-300';
    return 'bg-green-200';
  };

  const getRateColor = (rate: number, ata2: string) => {
    if (rate < 0) return 'bg-gray-100 text-gray-400';
    if (rate === 0) return 'bg-gray-50';
    const stats = ataWeightedStats[ata2] || { weightedAvg: 0, weightedSigma: 0 };
    const level = getAlertLevelSigma(rate, stats.weightedAvg, stats.weightedSigma, sigmaSettings);
    if (level === 'alert') return 'bg-red-500 text-white';
    return 'bg-green-200 text-gray-900';
  };

  const handleCellClick = (ata2: string, month: string) => {
    const filtered = detailData[ata2]?.[month] || [];
    if (filtered.length > 0) {
      setModalRecords(filtered);
      setSelectedCell({ ata: ata2, month });
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">ATA Chapter - Time Heat Map</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              2-digit ATA grouped ({showAll ? `All ${totalATACount}` : `Top ${Math.min(showCount, totalATACount)} of ${sortedATA.length}`}{searchTerm ? `, filtered by "${searchTerm}"` : ''})
              {hasEOD && viewMode === 'rate' && ` — Threshold: Avg + ${sigmaSettings.multiplier}σ`}
            </p>
          </div>
          {hasEOD && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('count')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'count'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Count
              </button>
              <button
                onClick={() => setViewMode('rate')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'rate'
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Rate (F/EOD)
              </button>
            </div>
          )}
        </div>

        {/* Search & Show Count Controls */}
        <div className="mb-3 flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search ATA (e.g. 25, Landing Gear)"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowAll(false); }}
              className="pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent w-56"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Show:</span>
            {[10, 20, 50].map(n => (
              <button
                key={n}
                onClick={() => { setShowCount(n); setShowAll(false); }}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  showCount === n && !showAll
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setShowAll(true)}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                showAll
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
          <span className="text-xs text-gray-400 ml-auto">{totalATACount} ATA chapter{totalATACount !== 1 ? 's' : ''}{searchTerm ? ' matched' : ' total'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-1.5 font-semibold text-gray-700 border-b-2 border-gray-200 min-w-[160px]">
                  ATA Chapter
                </th>
                {months.map(month => (
                  <th key={month} className="p-1.5 text-center font-medium text-gray-700 border-b-2 border-gray-200">
                    {format(new Date(month + '-01'), 'MMM yy', { locale: enUS })}
                  </th>
                ))}
                {viewMode === 'rate' && hasEOD && (
                  <th className="p-1.5 text-center font-semibold text-amber-700 border-b-2 border-gray-200">
                    Avg
                  </th>
                )}
                {viewMode === 'rate' && hasEOD && (
                  <th className="p-1.5 text-center font-semibold text-red-700 border-b-2 border-gray-200">
                    Threshold
                  </th>
                )}
                <th className="p-1.5 text-center font-semibold text-gray-700 border-b-2 border-gray-200">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedATA.map(ata2 => {
                const total = Object.values(heatmapData[ata2]).reduce((a, b) => a + b, 0);
                const stats = ataWeightedStats[ata2] || { weightedAvg: 0, weightedSigma: 0 };
                const threshold = stats.weightedAvg + sigmaSettings.multiplier * stats.weightedSigma;
                return (
                  <tr key={ata2} className="hover:bg-gray-50">
                    <td className="p-1.5 font-medium text-gray-900 border-b border-gray-100 whitespace-nowrap">
                      {getATALabel(ata2)}
                    </td>
                    {months.map(month => {
                      const value = heatmapData[ata2][month];
                      const rate = rateData[ata2]?.[month];
                      const isRateMode = viewMode === 'rate' && hasEOD;
                      const eodCount = eodPerMonth[month] || 0;

                      const colorClass = isRateMode
                        ? getRateColor(rate ?? -1, ata2)
                        : getColor(value);

                      const displayValue = isRateMode
                        ? (rate !== undefined && rate >= 0 ? rate.toFixed(2) : (value > 0 ? `${value}*` : ''))
                        : (value > 0 ? value : '');

                      const title = isRateMode
                        ? `ATA ${ata2} - ${month}: ${value} findings / ${eodCount} total EODs = Rate ${rate !== undefined && rate >= 0 ? rate.toFixed(3) : 'N/A'} (avg: ${stats.weightedAvg.toFixed(3)}, threshold: ${threshold.toFixed(3)})`
                        : `ATA ${ata2} - ${month}: ${value} findings`;

                      return (
                        <td key={month} className="p-0.5 border-b border-gray-100">
                          <button
                            onClick={() => handleCellClick(ata2, month)}
                            disabled={value === 0}
                            title={title}
                            className={`w-full h-8 flex items-center justify-center rounded font-semibold text-xs transition-all ${
                              colorClass
                            } ${
                              value > 0 ? 'hover:ring-2 hover:ring-purple-400 cursor-pointer' : 'cursor-default'
                            }`}
                          >
                            {displayValue}
                          </button>
                        </td>
                      );
                    })}
                    {viewMode === 'rate' && hasEOD && (
                      <td className="p-0.5 border-b border-gray-100">
                        <div className="w-full h-8 bg-amber-50 border border-amber-200 rounded flex items-center justify-center text-xs font-bold text-amber-800">
                          {stats.weightedAvg > 0 ? stats.weightedAvg.toFixed(3) : '—'}
                        </div>
                      </td>
                    )}
                    {viewMode === 'rate' && hasEOD && (
                      <td className="p-0.5 border-b border-gray-100">
                        <div className="w-full h-8 bg-red-50 border border-red-200 rounded flex items-center justify-center text-xs font-bold text-red-800">
                          {threshold > 0 ? threshold.toFixed(3) : '—'}
                        </div>
                      </td>
                    )}
                    <td className="p-1.5 text-center font-bold text-gray-900 border-b border-gray-100 bg-gray-50">
                      {total}
                    </td>
                  </tr>
                );
              })}
              {displayedATA.length === 0 && (
                <tr>
                  <td colSpan={months.length + (viewMode === 'rate' && hasEOD ? 4 : 2)} className="text-center py-8 text-sm text-gray-400">
                    No ATA chapters found{searchTerm ? ` matching "${searchTerm}"` : ''}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {hasMore && !showAll && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setShowAll(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Show All {totalATACount} ATA Chapters
            </button>
          </div>
        )}
        {showAll && totalATACount > 10 && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setShowAll(false)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              Collapse to {showCount}
            </button>
          </div>
        )}

        {/* Color Legend */}
        {viewMode === 'rate' && hasEOD ? (
          <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-purple-900 mb-2">📊 Rate View (Findings / Total EODs per month) — Weighted Avg + Threshold</p>
            <p className="text-xs text-purple-800 mb-2">
              ATA chapters grouped by 2-digit code. Threshold = Avg + {sigmaSettings.multiplier}σ. Change σ multiplier from the control above.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-700 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-4 bg-green-200 rounded border border-green-300"></div>
                <span><strong>Normal:</strong> ≤ Threshold</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-4 bg-red-500 rounded border border-red-600"></div>
                <span><strong>Alert:</strong> &gt; Threshold</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-4 bg-gray-100 rounded border border-gray-300"></div>
                <span><strong>N/A:</strong> No EOD data</span>
              </div>
            </div>
            <p className="text-xs text-purple-600 mt-2">* Value with asterisk means findings exist but no EOD data for that month</p>
          </div>
        ) : (
          <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-xs font-semibold text-purple-900">📊 Color Scale (2-digit ATA grouped, sorted by total findings):</span>
              <span className="text-xs text-purple-700">Shows the number of findings per system per month</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-700 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-4 bg-green-200 rounded border border-green-300"></div>
                <span><strong>Low:</strong> 1-{Math.ceil(maxValue * 0.25)} findings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-4 bg-yellow-300 rounded border border-yellow-400"></div>
                <span><strong>Medium:</strong> {Math.ceil(maxValue * 0.25) + 1}-{Math.ceil(maxValue * 0.5)} findings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-4 bg-orange-400 rounded border border-orange-500"></div>
                <span><strong>High:</strong> {Math.ceil(maxValue * 0.5) + 1}-{Math.ceil(maxValue * 0.75)} findings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-4 bg-red-500 rounded border border-red-600"></div>
                <span><strong>Very High:</strong> {Math.ceil(maxValue * 0.75) + 1}+ findings</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedCell && (
        <DetailModal
          isOpen={!!selectedCell}
          onClose={() => setSelectedCell(null)}
          title={`ATA ${getATALabel(selectedCell.ata)} - ${format(new Date(selectedCell.month + '-01'), 'MMMM yyyy', { locale: enUS })}`}
          records={modalRecords}
        />
      )}
    </>
  );
}
