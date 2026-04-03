'use client';

import { SAFARecord, EODRecord } from '@/lib/types';
import { format, startOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { DetailModal } from './DetailModal';
import { getAlertLevel } from '@/lib/eodProcessor';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';

interface AircraftHeatmapProps {
  records: SAFARecord[];
  eodRecords?: EODRecord[];
}

export function AircraftHeatmap({ records, eodRecords }: AircraftHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<{ aircraft: string; month: string } | null>(null);
  const [modalRecords, setModalRecords] = useState<SAFARecord[]>([]);
  const [viewMode, setViewMode] = useState<'count' | 'rate'>('count');
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCount, setShowCount] = useState<number>(10);

  const hasEOD = eodRecords && eodRecords.length > 0;

  const aircraft = Array.from(new Set(records.map(r => r.aircraft))).sort();
  const months = Array.from(
    new Set(records.map(r => format(startOfMonth(new Date(r.date)), 'yyyy-MM')))
  ).sort();

  const heatmapData: Record<string, Record<string, number>> = {};

  aircraft.forEach(ac => {
    heatmapData[ac] = {};
    months.forEach(month => {
      heatmapData[ac][month] = 0;
    });
  });

  records.forEach(record => {
    const month = format(startOfMonth(new Date(record.date)), 'yyyy-MM');
    if (heatmapData[record.aircraft] && heatmapData[record.aircraft][month] !== undefined) {
      heatmapData[record.aircraft][month]++;
    }
  });

  // EOD data by aircraft by month
  const eodByAircraftMonth = useMemo(() => {
    if (!hasEOD) return {};
    const map: Record<string, Record<string, number>> = {};
    eodRecords!.forEach(e => {
      const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
      if (!map[e.aircraft]) map[e.aircraft] = {};
      map[e.aircraft][month] = (map[e.aircraft][month] || 0) + 1;
    });
    return map;
  }, [eodRecords, hasEOD]);

  // Total EOD per month (fleet-wide) for monthly average calculation
  const totalEODPerMonth = useMemo(() => {
    if (!hasEOD) return {};
    const map: Record<string, number> = {};
    eodRecords!.forEach(e => {
      const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
      map[month] = (map[month] || 0) + 1;
    });
    return map;
  }, [eodRecords, hasEOD]);

  // Total findings per month (fleet-wide)
  const totalFindingsPerMonth = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach(r => {
      const month = format(startOfMonth(new Date(r.date)), 'yyyy-MM');
      map[month] = (map[month] || 0) + 1;
    });
    return map;
  }, [records]);

  // Rate data: aircraft finding count / aircraft EOD count for that month
  const rateData = useMemo(() => {
    if (!hasEOD) return {};
    const rates: Record<string, Record<string, number>> = {};
    aircraft.forEach(ac => {
      rates[ac] = {};
      months.forEach(month => {
        const findings = heatmapData[ac][month] || 0;
        const eods = eodByAircraftMonth[ac]?.[month] || 0;
        rates[ac][month] = eods > 0 ? findings / eods : -1;
      });
    });
    return rates;
  }, [aircraft, months, heatmapData, eodByAircraftMonth, hasEOD]);

  // Monthly average rate: total findings that month / total EODs that month
  // This is the "fleet average for the month" used as the baseline for each aircraft
  const monthlyAvgRate = useMemo(() => {
    if (!hasEOD) return {};
    const avgs: Record<string, number> = {};
    months.forEach(month => {
      const totalFindings = totalFindingsPerMonth[month] || 0;
      const totalEODs = totalEODPerMonth[month] || 0;
      avgs[month] = totalEODs > 0 ? totalFindings / totalEODs : 0;
    });
    return avgs;
  }, [months, totalFindingsPerMonth, totalEODPerMonth, hasEOD]);

  // Overall fleet average (for display/stats purposes)
  const overallAvgRate = useMemo(() => {
    if (!hasEOD) return 0;
    const validRates = months
      .map(m => monthlyAvgRate[m])
      .filter(r => r !== undefined && r > 0);
    if (validRates.length === 0) return 0;
    return validRates.reduce((a, b) => a + b, 0) / validRates.length;
  }, [monthlyAvgRate, months, hasEOD]);

  const maxValue = Math.max(
    ...Object.values(heatmapData).flatMap(monthData => Object.values(monthData)),
    1
  );

  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-50';
    const intensity = value / maxValue;
    if (intensity > 0.75) return 'bg-red-500 text-white';
    if (intensity > 0.5) return 'bg-orange-400 text-white';
    if (intensity > 0.25) return 'bg-yellow-300';
    return 'bg-green-200';
  };

  const getRateColor = (rate: number, month: string) => {
    if (rate < 0) return 'bg-gray-100 text-gray-400';
    if (rate === 0) return 'bg-gray-50';
    const avgForMonth = monthlyAvgRate[month] || 0;
    const level = getAlertLevel(rate, avgForMonth);
    if (level === 'alert') return 'bg-red-500 text-white';
    if (level === 'watch') return 'bg-yellow-300 text-gray-900';
    return 'bg-green-200 text-gray-900';
  };

  // Sorted by total findings descending
  const sortedAircraft = useMemo(() => {
    return Object.entries(heatmapData)
      .map(([ac, data]) => [ac, Object.values(data).reduce((a, b) => a + b, 0)] as [string, number])
      .sort((a, b) => b[1] - a[1])
      .map(([ac]) => ac);
  }, [heatmapData]);

  // Apply search filter
  const filteredAircraft = useMemo(() => {
    if (!searchTerm.trim()) return sortedAircraft;
    const term = searchTerm.trim().toUpperCase();
    return sortedAircraft.filter(ac => ac.toUpperCase().includes(term));
  }, [sortedAircraft, searchTerm]);

  const displayedAircraft = showAll ? filteredAircraft : filteredAircraft.slice(0, showCount);
  const totalAircraft = filteredAircraft.length;
  const hasMore = totalAircraft > showCount;

  const handleCellClick = (aircraft: string, month: string) => {
    const filtered = records.filter(r => {
      const recordMonth = format(startOfMonth(new Date(r.date)), 'yyyy-MM');
      return r.aircraft === aircraft && recordMonth === month;
    });

    if (filtered.length > 0) {
      setModalRecords(filtered);
      setSelectedCell({ aircraft, month });
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Aircraft - Time Heat Map</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Monthly finding density ({showAll ? `All ${totalAircraft}` : `Top ${Math.min(showCount, totalAircraft)} of ${sortedAircraft.length}`} aircraft{searchTerm ? `, filtered by "${searchTerm}"` : ''}) - Click cells to view details
              {hasEOD && viewMode === 'rate' && ' — Each aircraft compared to that month\'s fleet average'}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Rate (F/EOD)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search & Show Count Controls */}
        <div className="mb-3 flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search aircraft (e.g. SEK, TC-SOH)"
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
          <span className="text-xs text-gray-400 ml-auto">{totalAircraft} aircraft{searchTerm ? ' matched' : ' total'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-1.5 font-semibold text-gray-700 border-b-2 border-gray-200">
                  Aircraft
                </th>
                {months.map(month => (
                  <th key={month} className="p-1.5 text-center font-medium text-gray-700 border-b-2 border-gray-200">
                    <div>{format(new Date(month + '-01'), 'MMM yy', { locale: enUS })}</div>
                    {viewMode === 'rate' && hasEOD && (
                      <div className="text-[9px] font-normal text-amber-600 mt-0.5"
                           title={`Fleet avg for ${month}: ${(monthlyAvgRate[month] || 0).toFixed(3)}`}>
                        avg {(monthlyAvgRate[month] || 0).toFixed(2)}
                      </div>
                    )}
                  </th>
                ))}
                <th className="p-1.5 text-center font-semibold text-gray-700 border-b-2 border-gray-200">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedAircraft.map(ac => {
                const total = Object.values(heatmapData[ac]).reduce((a, b) => a + b, 0);
                return (
                  <tr key={ac} className="hover:bg-gray-50">
                    <td className="p-1.5 font-medium text-gray-900 border-b border-gray-100">
                      {ac}
                    </td>
                    {months.map(month => {
                      const value = heatmapData[ac][month];
                      const rate = rateData[ac]?.[month];
                      const isRateMode = viewMode === 'rate' && hasEOD;
                      const eodCount = eodByAircraftMonth[ac]?.[month] || 0;
                      const avgForMonth = monthlyAvgRate[month] || 0;

                      const colorClass = isRateMode
                        ? getRateColor(rate ?? -1, month)
                        : getColor(value);

                      const displayValue = isRateMode
                        ? (rate !== undefined && rate >= 0 ? rate.toFixed(2) : (value > 0 ? `${value}*` : ''))
                        : (value > 0 ? value : '');

                      const title = isRateMode
                        ? `${ac} - ${month}: ${value} findings / ${eodCount} EODs = Rate ${rate !== undefined && rate >= 0 ? rate.toFixed(3) : 'N/A'} (month fleet avg: ${avgForMonth.toFixed(3)})`
                        : `${ac} - ${month}: ${value} findings`;

                      return (
                        <td key={month} className="p-0.5 border-b border-gray-100">
                          <button
                            onClick={() => handleCellClick(ac, month)}
                            disabled={value === 0}
                            title={title}
                            className={`w-full h-8 flex items-center justify-center rounded font-semibold text-xs transition-all ${
                              colorClass
                            } ${
                              value > 0 ? 'hover:ring-2 hover:ring-blue-400 cursor-pointer' : 'cursor-default'
                            }`}
                          >
                            {displayValue}
                          </button>
                        </td>
                      );
                    })}
                    <td className="p-1.5 text-center font-bold text-gray-900 border-b border-gray-100 bg-gray-50">
                      {total}
                    </td>
                  </tr>
                );
              })}
              {displayedAircraft.length === 0 && (
                <tr>
                  <td colSpan={months.length + 2} className="text-center py-8 text-sm text-gray-400">
                    No aircraft found{searchTerm ? ` matching "${searchTerm}"` : ''}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Show More/Less toggle */}
        {hasMore && !showAll && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setShowAll(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Show All {totalAircraft} Aircraft
            </button>
          </div>
        )}
        {showAll && totalAircraft > 10 && (
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
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-xs font-semibold text-amber-900">📊 Rate View (Aircraft Findings / Aircraft EOD per month):</span>
            </div>
            <p className="text-xs text-amber-800 mb-2">
              Each aircraft&apos;s rate = <strong>that aircraft&apos;s findings ÷ that aircraft&apos;s EOD count</strong> for the given month.
              This is compared to the <strong>fleet-wide monthly average</strong> (total findings ÷ total EODs for that same month).
              For example: if the fleet had 100 findings and 50 EODs in August, the August avg is 2.00.
              An aircraft with rate &gt; 2.00 is above average for that month.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-700 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-4 bg-green-200 rounded border border-green-300"></div>
                <span><strong>Normal:</strong> ≤ month avg</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-4 bg-yellow-300 rounded border border-yellow-400"></div>
                <span><strong>Watch:</strong> &gt; month avg &amp; ≤ 1.5×</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-4 bg-red-500 rounded border border-red-600"></div>
                <span><strong>Alert:</strong> &gt; 1.5× month avg</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-4 bg-gray-100 rounded border border-gray-300"></div>
                <span><strong>N/A:</strong> No EOD data</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-amber-700">
              <span>Overall fleet avg rate: <strong>{overallAvgRate.toFixed(3)}</strong></span>
              <span>•</span>
              <span>* Value with asterisk means findings exist but no EOD data for that aircraft/month</span>
            </div>
          </div>
        ) : (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-xs font-semibold text-blue-900">📊 Color Scale (sorted by total findings):</span>
              <span className="text-xs text-blue-700">Each cell number represents the finding count for that month</span>
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
                <span className="text-gray-700"><strong>Very High:</strong> {Math.ceil(maxValue * 0.75) + 1}+ findings</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedCell && (
        <DetailModal
          isOpen={!!selectedCell}
          onClose={() => setSelectedCell(null)}
          title={`${selectedCell.aircraft} - ${format(new Date(selectedCell.month + '-01'), 'MMMM yyyy', { locale: enUS })}`}
          records={modalRecords}
        />
      )}
    </>
  );
}
