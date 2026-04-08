'use client';

import { SAFARecord, EODRecord, SigmaSettings } from '@/lib/types';
import { useMemo, useState } from 'react';
import { DetailModal } from './DetailModal';
import { format, parseISO, startOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { computeWeightedStats, getAlertLevelSigma } from '@/lib/eodProcessor';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';

interface ComponentHeatmapProps {
  records: SAFARecord[];
  eodRecords?: EODRecord[];
  sigmaSettings?: SigmaSettings;
}

const DEFAULT_SIGMA: SigmaSettings = { multiplier: 2 };

export function ComponentHeatmap({ records, eodRecords, sigmaSettings = DEFAULT_SIGMA }: ComponentHeatmapProps) {
  const [selectedRecords, setSelectedRecords] = useState<SAFARecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [viewMode, setViewMode] = useState<'count' | 'rate'>('count');
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCount, setShowCount] = useState<number>(10);

  const hasEOD = eodRecords && eodRecords.length > 0;

  const heatmapData = useMemo(() => {
    const componentByMonth: Record<string, Record<string, number>> = {};
    const detailData: Record<string, Record<string, SAFARecord[]>> = {};

    records.forEach(record => {
      const month = format(new Date(record.date), 'yyyy-MM');
      const component = record.component || 'OTHER';

      if (!componentByMonth[component]) {
        componentByMonth[component] = {};
        detailData[component] = {};
      }

      componentByMonth[component][month] = (componentByMonth[component][month] || 0) + 1;

      if (!detailData[component][month]) {
        detailData[component][month] = [];
      }
      detailData[component][month].push(record);
    });

    const allMonths = Array.from(
      new Set(records.map(r => format(new Date(r.date), 'yyyy-MM')))
    ).sort();

    const allComponents = Object.entries(
      records.reduce((acc, r) => {
        const component = r.component || 'OTHER';
        acc[component] = (acc[component] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .sort(([, a], [, b]) => b - a)
      .map(([component]) => component);

    const maxCount = Math.max(
      ...allComponents.slice(0, 10).flatMap(component =>
        Object.values(componentByMonth[component] || {})
      ),
      1
    );

    return {
      allComponents,
      months: allMonths,
      data: componentByMonth,
      detailData,
      maxCount,
    };
  }, [records]);

  const filteredComponents = useMemo(() => {
    if (!searchTerm.trim()) return heatmapData.allComponents;
    const term = searchTerm.trim().toUpperCase();
    return heatmapData.allComponents.filter(comp =>
      comp.toUpperCase().includes(term) ||
      comp.replace(/_/g, ' ').toUpperCase().includes(term)
    );
  }, [heatmapData.allComponents, searchTerm]);

  const displayedComponents = showAll ? filteredComponents : filteredComponents.slice(0, showCount);
  const totalComponents = filteredComponents.length;
  const hasMore = totalComponents > showCount;

  const eodPerMonth = useMemo(() => {
    if (!hasEOD) return {};
    const map: Record<string, number> = {};
    eodRecords!.forEach(e => {
      const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
      map[month] = (map[month] || 0) + 1;
    });
    return map;
  }, [eodRecords, hasEOD]);

  const rateData = useMemo(() => {
    if (!hasEOD) return {};
    const rates: Record<string, Record<string, number>> = {};
    heatmapData.allComponents.forEach(comp => {
      rates[comp] = {};
      heatmapData.months.forEach(month => {
        const findings = heatmapData.data[comp]?.[month] || 0;
        const eods = eodPerMonth[month] || 0;
        rates[comp][month] = eods > 0 ? findings / eods : -1;
      });
    });
    return rates;
  }, [heatmapData, eodPerMonth, hasEOD]);

  const compWeightedStats = useMemo(() => {
    if (!hasEOD) return {};
    const stats: Record<string, { weightedAvg: number; weightedSigma: number }> = {};
    heatmapData.allComponents.forEach(comp => {
      const rates: number[] = [];
      const weights: number[] = [];
      heatmapData.months.forEach(month => {
        const eodCount = eodPerMonth[month] || 0;
        if (eodCount > 0) {
          const compFindings = heatmapData.data[comp]?.[month] || 0;
          rates.push(compFindings / eodCount);
          weights.push(eodCount);
        }
      });
      stats[comp] = computeWeightedStats(rates, weights);
    });
    return stats;
  }, [heatmapData, eodPerMonth, hasEOD]);

  const getColor = (count: number) => {
    if (!count) return 'bg-gray-50';
    const intensity = Math.min(count / heatmapData.maxCount, 1);
    if (intensity > 0.7) return 'bg-red-600 text-white';
    if (intensity > 0.5) return 'bg-orange-500 text-white';
    if (intensity > 0.3) return 'bg-yellow-400 text-gray-900';
    if (intensity > 0.1) return 'bg-green-300 text-gray-900';
    return 'bg-blue-200 text-gray-900';
  };

  const getRateColor = (rate: number, comp: string) => {
    if (rate < 0) return 'bg-gray-100 text-gray-400';
    if (rate === 0) return 'bg-gray-50';
    const stats = compWeightedStats[comp] || { weightedAvg: 0, weightedSigma: 0 };
    const level = getAlertLevelSigma(rate, stats.weightedAvg, stats.weightedSigma, sigmaSettings);
    if (level === 'alert') return 'bg-red-500 text-white';
    return 'bg-green-200 text-gray-900';
  };

  const formatComponentName = (component: string) => {
    return component.replace(/_/g, ' ');
  };

  const handleCellClick = (component: string, month: string, count: number) => {
    if (count === 0) return;
    const recs = heatmapData.detailData[component]?.[month] || [];
    const monthName = format(parseISO(month + '-01'), 'MMMM yyyy', { locale: enUS });
    setSelectedRecords(recs);
    setModalTitle(`${formatComponentName(component)} - ${monthName}`);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Component - Time Heatmap</h2>
            <p className="text-sm text-gray-600 mt-1">
              Monthly problem density by component ({showAll ? `All ${totalComponents}` : `Top ${Math.min(showCount, totalComponents)} of ${heatmapData.allComponents.length}`}{searchTerm ? `, filtered by "${searchTerm}"` : ''})
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
                    ? 'bg-amber-500 text-white shadow-sm'
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
              placeholder="Search component (e.g. PLACARD, SEAT)"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowAll(false); }}
              className="pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent w-60"
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
          <span className="text-xs text-gray-400 ml-auto">{totalComponents} component{totalComponents !== 1 ? 's' : ''}{searchTerm ? ' matched' : ' total'}</span>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <table className="border-collapse w-full">
              <thead>
                <tr>
                  <th className="text-left align-top h-16 whitespace-nowrap"></th>
                  {heatmapData.months.map((month) => (
                    <th key={month} className="h-16 align-bottom p-0">
                      <div className="flex items-end justify-center h-full pb-1">
                        <div className="transform -rotate-45 origin-bottom-left text-xs font-medium text-gray-600 whitespace-nowrap">
                          {format(parseISO(month + '-01'), 'MMM yy', { locale: enUS })}
                        </div>
                      </div>
                    </th>
                  ))}
                  {viewMode === 'rate' && hasEOD && (
                    <th className="h-16 align-bottom p-0">
                      <div className="flex items-end justify-center h-full pb-1">
                        <span className="text-xs font-semibold text-amber-700">Avg</span>
                      </div>
                    </th>
                  )}
                  {viewMode === 'rate' && hasEOD && (
                    <th className="h-16 align-bottom p-0">
                      <div className="flex items-end justify-center h-full pb-1">
                        <span className="text-xs font-semibold text-red-700">Threshold</span>
                      </div>
                    </th>
                  )}
                  <th className="h-16 align-bottom p-0">
                    <div className="flex items-end justify-center h-full pb-1">
                      <span className="text-xs font-semibold text-gray-700">Total</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedComponents.map((component) => {
                  const totalCount = heatmapData.months.reduce(
                    (sum, m) => sum + (heatmapData.data[component]?.[m] || 0),
                    0
                  );
                  const stats = compWeightedStats[component] || { weightedAvg: 0, weightedSigma: 0 };
                  const threshold = stats.weightedAvg + sigmaSettings.multiplier * stats.weightedSigma;
                  return (
                    <tr key={component}>
                      <td className="pr-2 py-1 text-xs whitespace-nowrap font-medium text-gray-700 align-middle">
                        {formatComponentName(component)}
                      </td>
                      {heatmapData.months.map((month) => {
                        const count = heatmapData.data[component]?.[month] || 0;
                        const rate = rateData[component]?.[month];
                        const isRateMode = viewMode === 'rate' && hasEOD;
                        const eodCount = eodPerMonth[month] || 0;

                        const colorClass = isRateMode
                          ? getRateColor(rate ?? -1, component)
                          : getColor(count);

                        const displayValue = isRateMode
                          ? (rate !== undefined && rate >= 0 ? rate.toFixed(2) : (count > 0 ? `${count}*` : ''))
                          : (count > 0 ? count : '');

                        const title = isRateMode
                          ? `${formatComponentName(component)} - ${month}: ${count} findings / ${eodCount} total EODs = Rate ${rate !== undefined && rate >= 0 ? rate.toFixed(3) : 'N/A'} (avg: ${stats.weightedAvg.toFixed(3)}, threshold: ${threshold.toFixed(3)})`
                          : `${formatComponentName(component)} - ${format(parseISO(month + '-01'), 'MMMM yyyy', { locale: enUS })}: ${count} records`;

                        return (
                          <td key={`${component}-${month}`} className="p-0.5">
                            <button
                              onClick={() => handleCellClick(component, month, count)}
                              className={`w-full h-10 ${colorClass} rounded flex items-center justify-center text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${count === 0 ? 'cursor-default' : ''}`}
                              title={title}
                            >
                              {displayValue}
                            </button>
                          </td>
                        );
                      })}
                      {viewMode === 'rate' && hasEOD && (
                        <td className="p-0.5">
                          <div className="w-full h-10 bg-amber-50 border border-amber-200 rounded flex items-center justify-center text-xs font-bold text-amber-800">
                            {stats.weightedAvg > 0 ? stats.weightedAvg.toFixed(3) : '—'}
                          </div>
                        </td>
                      )}
                      {viewMode === 'rate' && hasEOD && (
                        <td className="p-0.5">
                          <div className="w-full h-10 bg-red-50 border border-red-200 rounded flex items-center justify-center text-xs font-bold text-red-800">
                            {threshold > 0 ? threshold.toFixed(3) : '—'}
                          </div>
                        </td>
                      )}
                      <td className="p-0.5">
                        <div className="w-full h-10 bg-gray-50 rounded flex items-center justify-center text-xs font-bold text-gray-900">
                          {totalCount}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {displayedComponents.length === 0 && (
                  <tr>
                    <td colSpan={heatmapData.months.length + (viewMode === 'rate' && hasEOD ? 4 : 2)} className="text-center py-8 text-sm text-gray-400">
                      No components found{searchTerm ? ` matching "${searchTerm}"` : ''}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {hasMore && !showAll && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setShowAll(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Show All {totalComponents} Components
            </button>
          </div>
        )}
        {showAll && totalComponents > 10 && (
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
            <p className="text-xs font-semibold text-amber-900 mb-2">📊 Rate View (Findings / Total EODs per month) — Weighted Avg + Threshold</p>
            <p className="text-xs text-amber-800 mb-2">
              Each component uses EOD-weighted average across all months. Threshold = Avg + {sigmaSettings.multiplier}σ. Change σ multiplier from the control above.
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
            <p className="text-xs text-amber-600 mt-2">* Value with asterisk means findings exist but no EOD data for that month</p>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-6 text-xs flex-wrap">
            <span className="text-gray-600 font-medium">Density (sorted by total findings):</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
              <span className="text-gray-600">None</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 rounded"></div>
              <span className="text-gray-600">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-300 rounded"></div>
              <span className="text-gray-600">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span className="text-gray-600">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-gray-600">Very High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-gray-600">Critical</span>
            </div>
          </div>
        )}
      </div>

      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        records={selectedRecords}
      />
    </>
  );
}
