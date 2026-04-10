'use client';

import { SAFARecord, EODRecord, SigmaSettings } from '@/lib/types';
import { format, startOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { DetailModal } from './DetailModal';
import { computeWeightedStats, getAlertLevelSigma } from '@/lib/eodProcessor';
import { ChevronDown, ChevronUp, Search, X, Plane, AlertTriangle, TrendingUp } from 'lucide-react';

interface AircraftHeatmapProps {
  records: SAFARecord[];
  eodRecords?: EODRecord[];
  sigmaSettings?: SigmaSettings;
}

const DEFAULT_SIGMA: SigmaSettings = { multiplier: 2 };

export function AircraftHeatmap({ records, eodRecords, sigmaSettings = DEFAULT_SIGMA }: AircraftHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<{ aircraft: string; label: string } | null>(null);
  const [modalRecords, setModalRecords] = useState<SAFARecord[]>([]);
  const [viewMode, setViewMode] = useState<'rate' | 'count'>('rate');
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCount, setShowCount] = useState<number>(10);
  const [sortBy, setSortBy] = useState<'findings' | 'rate' | 'deviation'>('findings');
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  const hasEOD = eodRecords && eodRecords.length > 0;

  // Determine period label from data
  const periodLabel = useMemo(() => {
    if (records.length === 0) return '';
    const dates = records.map(r => new Date(r.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    return `${format(minDate, 'MMM yyyy', { locale: enUS })} – ${format(maxDate, 'MMM yyyy', { locale: enUS })}`;
  }, [records]);

  const months = useMemo(() => {
    return Array.from(
      new Set(records.map(r => format(startOfMonth(new Date(r.date)), 'yyyy-MM')))
    ).sort();
  }, [records]);

  const aircraft = useMemo(() => {
    return Array.from(new Set(records.map(r => r.aircraft))).sort();
  }, [records]);

  // Total findings per aircraft across entire period
  const acTotalFindings = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach(r => {
      map[r.aircraft] = (map[r.aircraft] || 0) + 1;
    });
    return map;
  }, [records]);

  // Findings per aircraft per month (for detail modal)
  const acMonthFindings = useMemo(() => {
    const data: Record<string, Record<string, number>> = {};
    records.forEach(r => {
      const month = format(startOfMonth(new Date(r.date)), 'yyyy-MM');
      if (!data[r.aircraft]) data[r.aircraft] = {};
      data[r.aircraft][month] = (data[r.aircraft][month] || 0) + 1;
    });
    return data;
  }, [records]);

  // EOD per aircraft across entire period
  const acTotalEOD = useMemo(() => {
    if (!hasEOD) return {};
    const map: Record<string, number> = {};
    eodRecords!.forEach(e => {
      map[e.aircraft] = (map[e.aircraft] || 0) + 1;
    });
    return map;
  }, [eodRecords, hasEOD]);

  // EOD per aircraft per month
  const acMonthEOD = useMemo(() => {
    if (!hasEOD) return {};
    const map: Record<string, Record<string, number>> = {};
    eodRecords!.forEach(e => {
      const month = format(startOfMonth(new Date(e.perfDate)), 'yyyy-MM');
      if (!map[e.aircraft]) map[e.aircraft] = {};
      map[e.aircraft][month] = (map[e.aircraft][month] || 0) + 1;
    });
    return map;
  }, [eodRecords, hasEOD]);

  // All aircraft that have either findings or EOD
  const allAircraft = useMemo(() => {
    return Array.from(new Set([
      ...Object.keys(acTotalFindings),
      ...Object.keys(acTotalEOD),
    ])).sort();
  }, [acTotalFindings, acTotalEOD]);

  // Period rate per aircraft: totalFindings / totalEODs across entire period
  const acPeriodRate = useMemo(() => {
    if (!hasEOD) return {};
    const rates: Record<string, number> = {};
    allAircraft.forEach(ac => {
      const findings = acTotalFindings[ac] || 0;
      const eods = acTotalEOD[ac] || 0;
      rates[ac] = eods > 0 ? findings / eods : -1; // -1 = no EOD
    });
    return rates;
  }, [allAircraft, acTotalFindings, acTotalEOD, hasEOD]);

  // Fleet-wide weighted stats:
  // Each aircraft is a data point. Rate = acFindings/acEODs. Weight = acEODs.
  // weightedAvg = Sum(rate_i * eod_i) / Sum(eod_i) = Sum(findings_i) / Sum(eod_i)
  // weightedSigma = sqrt( Sum(eod_i * (rate_i - weightedAvg)^2) / Sum(eod_i) )
  const fleetWeightedStats = useMemo(() => {
    if (!hasEOD) return { weightedAvg: 0, weightedSigma: 0 };
    const rates: number[] = [];
    const weights: number[] = [];
    allAircraft.forEach(ac => {
      const eods = acTotalEOD[ac] || 0;
      if (eods > 0) {
        const findings = acTotalFindings[ac] || 0;
        rates.push(findings / eods);
        weights.push(eods);
      }
    });
    return computeWeightedStats(rates, weights);
  }, [allAircraft, acTotalFindings, acTotalEOD, hasEOD]);

  const threshold = fleetWeightedStats.weightedAvg + sigmaSettings.multiplier * fleetWeightedStats.weightedSigma;

  // Determine alert level per aircraft
  const acAlertLevel = useMemo(() => {
    if (!hasEOD) return {};
    const levels: Record<string, 'normal' | 'alert'> = {};
    allAircraft.forEach(ac => {
      const rate = acPeriodRate[ac];
      if (rate === undefined || rate < 0) {
        levels[ac] = 'normal';
      } else {
        levels[ac] = getAlertLevelSigma(rate, fleetWeightedStats.weightedAvg, fleetWeightedStats.weightedSigma, sigmaSettings);
      }
    });
    return levels;
  }, [allAircraft, acPeriodRate, fleetWeightedStats, sigmaSettings, hasEOD]);

  // Deviation from threshold for each aircraft (rate - threshold)
  const acDeviation = useMemo(() => {
    if (!hasEOD) return {};
    const devs: Record<string, number> = {};
    allAircraft.forEach(ac => {
      const rate = acPeriodRate[ac];
      if (rate !== undefined && rate >= 0) {
        devs[ac] = rate - threshold;
      } else {
        devs[ac] = -Infinity;
      }
    });
    return devs;
  }, [allAircraft, acPeriodRate, threshold, hasEOD]);

  // Sort aircraft
  const sortedAircraft = useMemo(() => {
    const acList = allAircraft.filter(ac => (acTotalFindings[ac] || 0) > 0 || (acTotalEOD[ac] || 0) > 0);

    if (sortBy === 'rate' && hasEOD) {
      return [...acList].sort((a, b) => {
        const ra = acPeriodRate[a] ?? -1;
        const rb = acPeriodRate[b] ?? -1;
        return rb - ra;
      });
    }
    if (sortBy === 'deviation' && hasEOD) {
      return [...acList].sort((a, b) => {
        const da = acDeviation[a] ?? -Infinity;
        const db = acDeviation[b] ?? -Infinity;
        return db - da;
      });
    }
    // default: findings
    return [...acList].sort((a, b) => {
      return (acTotalFindings[b] || 0) - (acTotalFindings[a] || 0);
    });
  }, [allAircraft, acTotalFindings, acTotalEOD, acPeriodRate, acDeviation, sortBy, hasEOD]);

  // Search filter
  const filteredAircraft = useMemo(() => {
    let list = sortedAircraft;
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toUpperCase();
      list = list.filter(ac => ac.toUpperCase().includes(term));
    }
    if (showOnlyAlerts && hasEOD) {
      list = list.filter(ac => acAlertLevel[ac] === 'alert');
    }
    return list;
  }, [sortedAircraft, searchTerm, showOnlyAlerts, acAlertLevel, hasEOD]);

  const displayedAircraft = showAll ? filteredAircraft : filteredAircraft.slice(0, showCount);
  const totalAircraft = filteredAircraft.length;
  const hasMore = totalAircraft > showCount;
  const alertCountTotal = useMemo(() => {
    if (!hasEOD) return 0;
    return allAircraft.filter(ac => acAlertLevel[ac] === 'alert').length;
  }, [allAircraft, acAlertLevel, hasEOD]);

  const maxFindingCount = Math.max(...Object.values(acTotalFindings), 1);

  const getCountColor = (value: number) => {
    if (value === 0) return 'bg-gray-50';
    const intensity = value / maxFindingCount;
    if (intensity > 0.75) return 'bg-red-500 text-white';
    if (intensity > 0.5) return 'bg-orange-400 text-white';
    if (intensity > 0.25) return 'bg-yellow-300';
    return 'bg-green-200';
  };

  const getRateBarColor = (ac: string) => {
    const level = acAlertLevel[ac];
    if (level === 'alert') return 'bg-red-500';
    return 'bg-emerald-500';
  };

  const getRateTextColor = (ac: string) => {
    const level = acAlertLevel[ac];
    if (level === 'alert') return 'text-red-700 font-bold';
    return 'text-gray-700';
  };

  const handleAircraftClick = (ac: string) => {
    const filtered = records.filter(r => r.aircraft === ac);
    if (filtered.length > 0) {
      setModalRecords(filtered);
      setSelectedCell({ aircraft: ac, label: `${ac} — Full Period (${periodLabel})` });
    }
  };

  const handleMonthCellClick = (ac: string, month: string) => {
    const filtered = records.filter(r => {
      const recordMonth = format(startOfMonth(new Date(r.date)), 'yyyy-MM');
      return r.aircraft === ac && recordMonth === month;
    });
    if (filtered.length > 0) {
      setModalRecords(filtered);
      setSelectedCell({ aircraft: ac, label: `${ac} — ${format(new Date(month + '-01'), 'MMMM yyyy', { locale: enUS })}` });
    }
  };

  // Max rate for bar chart scaling
  const maxRate = useMemo(() => {
    if (!hasEOD) return 1;
    const rates = Object.values(acPeriodRate).filter(r => r >= 0);
    return rates.length > 0 ? Math.max(...rates, threshold * 1.1) : 1;
  }, [acPeriodRate, threshold, hasEOD]);

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Plane className="h-5 w-5 text-amber-600" />
              Aircraft Period Analysis
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Full period rate per aircraft ({periodLabel})
              {hasEOD && (
                <span className="ml-1">
                  — Fleet Weighted Avg: <strong>{fleetWeightedStats.weightedAvg.toFixed(3)}</strong>
                  , σ: <strong>{fleetWeightedStats.weightedSigma.toFixed(3)}</strong>
                  , Threshold (Avg+{sigmaSettings.multiplier}σ): <strong>{threshold.toFixed(3)}</strong>
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasEOD && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
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
              </div>
            )}
          </div>
        </div>

        {/* Search, Show Count & Filter Controls */}
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
          {hasEOD && viewMode === 'rate' && (
            <>
              <div className="h-4 w-px bg-gray-300" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Sort:</span>
                {[
                  { key: 'findings' as const, label: 'Findings' },
                  { key: 'rate' as const, label: 'Rate' },
                  { key: 'deviation' as const, label: 'Deviation' },
                ].map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key)}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                      sortBy === s.key
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <button
                onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  showOnlyAlerts
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                Alerts Only ({alertCountTotal})
              </button>
            </>
          )}
          <span className="text-xs text-gray-400 ml-auto">{totalAircraft} aircraft{searchTerm ? ' matched' : ''}{showOnlyAlerts ? ' (alerts)' : ''}</span>
        </div>

        {/* ── RATE VIEW (default): Period analysis with bar chart ── */}
        {viewMode === 'rate' && hasEOD && (
          <>
            {/* Fleet summary cards */}
            <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-600 font-medium">Fleet Wt. Avg</p>
                <p className="text-lg font-bold text-blue-900">{fleetWeightedStats.weightedAvg.toFixed(3)}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                <p className="text-xs text-purple-600 font-medium">Fleet Wt. σ</p>
                <p className="text-lg font-bold text-purple-900">{fleetWeightedStats.weightedSigma.toFixed(3)}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <p className="text-xs text-red-600 font-medium">Threshold (Avg+{sigmaSettings.multiplier}σ)</p>
                <p className="text-lg font-bold text-red-900">{threshold.toFixed(3)}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <p className="text-xs text-amber-600 font-medium">Aircraft in Alert</p>
                <p className="text-lg font-bold text-amber-900">{alertCountTotal} / {allAircraft.filter(ac => (acTotalEOD[ac] || 0) > 0).length}</p>
              </div>
            </div>

            {/* Rate table with inline bar chart */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left p-2 font-semibold text-gray-700 border-b-2 border-gray-200 w-28">Aircraft</th>
                    <th className="text-center p-2 font-semibold text-gray-700 border-b-2 border-gray-200 w-16">Findings</th>
                    <th className="text-center p-2 font-semibold text-gray-700 border-b-2 border-gray-200 w-16">EODs</th>
                    <th className="text-center p-2 font-semibold text-amber-700 border-b-2 border-gray-200 w-20">Period Rate</th>
                    <th className="p-2 font-semibold text-gray-700 border-b-2 border-gray-200">Rate vs Threshold</th>
                    <th className="text-center p-2 font-semibold text-gray-700 border-b-2 border-gray-200 w-20">Deviation</th>
                    <th className="text-center p-2 font-semibold text-gray-700 border-b-2 border-gray-200 w-20">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedAircraft.map(ac => {
                    const findings = acTotalFindings[ac] || 0;
                    const eods = acTotalEOD[ac] || 0;
                    const rate = acPeriodRate[ac] ?? -1;
                    const isAlert = acAlertLevel[ac] === 'alert';
                    const dev = rate >= 0 ? rate - threshold : 0;
                    const barWidth = rate >= 0 ? Math.min((rate / maxRate) * 100, 100) : 0;
                    const thresholdPos = Math.min((threshold / maxRate) * 100, 100);

                    return (
                      <tr key={ac} className={`hover:bg-gray-50 ${isAlert ? 'bg-red-50/50' : ''}`}>
                        <td className="p-2 font-medium text-gray-900 border-b border-gray-100 whitespace-nowrap">
                          <button
                            onClick={() => handleAircraftClick(ac)}
                            className="hover:text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            {isAlert && <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />}
                            {ac}
                          </button>
                        </td>
                        <td className="p-2 text-center font-semibold text-gray-900 border-b border-gray-100">
                          {findings}
                        </td>
                        <td className="p-2 text-center text-gray-600 border-b border-gray-100">
                          {eods > 0 ? eods : <span className="text-gray-400">—</span>}
                        </td>
                        <td className={`p-2 text-center border-b border-gray-100 ${getRateTextColor(ac)}`}>
                          {rate >= 0 ? rate.toFixed(3) : 'N/A'}
                        </td>
                        <td className="p-2 border-b border-gray-100">
                          {rate >= 0 ? (
                            <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                              {/* Rate bar */}
                              <div
                                className={`absolute left-0 top-0 h-full rounded-full transition-all ${getRateBarColor(ac)}`}
                                style={{ width: `${barWidth}%`, opacity: 0.7 }}
                              />
                              {/* Threshold line */}
                              <div
                                className="absolute top-0 h-full w-0.5 bg-red-600 z-10"
                                style={{ left: `${thresholdPos}%` }}
                                title={`Threshold: ${threshold.toFixed(3)}`}
                              />
                              {/* Avg line */}
                              <div
                                className="absolute top-0 h-full w-0.5 bg-blue-500 z-10"
                                style={{ left: `${Math.min((fleetWeightedStats.weightedAvg / maxRate) * 100, 100)}%`, opacity: 0.6 }}
                                title={`Fleet Avg: ${fleetWeightedStats.weightedAvg.toFixed(3)}`}
                              />
                              {/* Rate value label */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-[10px] font-bold ${isAlert ? 'text-red-900' : 'text-gray-700'} drop-shadow-sm`}>
                                  {rate.toFixed(3)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-6 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 text-[10px]">
                              No EOD data
                            </div>
                          )}
                        </td>
                        <td className={`p-2 text-center border-b border-gray-100 text-xs font-mono ${
                          rate >= 0 && dev > 0 ? 'text-red-600 font-bold' : rate >= 0 ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {rate >= 0 ? (dev > 0 ? `+${dev.toFixed(3)}` : dev.toFixed(3)) : '—'}
                        </td>
                        <td className="p-2 text-center border-b border-gray-100">
                          {rate >= 0 ? (
                            isAlert ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                ALERT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                OK
                              </span>
                            )
                          ) : (
                            <span className="text-gray-400 text-[10px]">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {displayedAircraft.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-sm text-gray-400">
                        No aircraft found{searchTerm ? ` matching "${searchTerm}"` : ''}{showOnlyAlerts ? ' with alerts' : ''}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Rate view legend */}
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs font-semibold text-amber-900">Aircraft Period Analysis — Fleet Weighted Avg + {sigmaSettings.multiplier}σ Threshold</span>
              </div>
              <p className="text-xs text-amber-800 mb-2">
                Each aircraft&apos;s <strong>Period Rate</strong> = Total Findings / Total EODs across the entire analysis period ({periodLabel}).
                The <strong>Fleet Weighted Average</strong> and <strong>σ</strong> are computed across all aircraft, weighted by each aircraft&apos;s total EODs.
                Threshold = Fleet Avg + {sigmaSettings.multiplier} × Fleet σ.
                Aircraft flying more have higher weight in the fleet statistics.
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-700 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-4 bg-emerald-500 rounded border border-emerald-600" style={{ opacity: 0.7 }}></div>
                  <span><strong>Normal:</strong> Rate ≤ Threshold</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-4 bg-red-500 rounded border border-red-600" style={{ opacity: 0.7 }}></div>
                  <span><strong>Alert:</strong> Rate &gt; Threshold</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-4 bg-blue-500 rounded"></div>
                  <span>Fleet Avg line</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-4 bg-red-600 rounded"></div>
                  <span>Threshold line</span>
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-2">Click any aircraft name to view its detailed findings. Use &quot;Alerts Only&quot; to filter to problematic aircraft.</p>
            </div>
          </>
        )}

        {/* ── RATE VIEW fallback when no EOD ── */}
        {viewMode === 'rate' && !hasEOD && (
          <div className="text-center py-8 text-sm text-gray-400">
            EOD data is required for Rate view. Please upload EOD data or switch to Count view.
          </div>
        )}

        {/* ── COUNT VIEW: monthly breakdown table ── */}
        {viewMode === 'count' && (
          <>
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
                      </th>
                    ))}
                    <th className="p-1.5 text-center font-semibold text-gray-700 border-b-2 border-gray-200">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedAircraft.map(ac => {
                    const total = acTotalFindings[ac] || 0;
                    return (
                      <tr key={ac} className="hover:bg-gray-50">
                        <td className="p-1.5 font-medium text-gray-900 border-b border-gray-100 whitespace-nowrap">
                          <button
                            onClick={() => handleAircraftClick(ac)}
                            className="hover:text-blue-600 hover:underline cursor-pointer"
                          >
                            {ac}
                          </button>
                        </td>
                        {months.map(month => {
                          const value = acMonthFindings[ac]?.[month] || 0;
                          const colorClass = getCountColor(value);
                          return (
                            <td key={month} className="p-0.5 border-b border-gray-100">
                              <button
                                onClick={() => handleMonthCellClick(ac, month)}
                                disabled={value === 0}
                                title={`${ac} - ${month}: ${value} findings`}
                                className={`w-full h-8 flex items-center justify-center rounded font-semibold text-xs transition-all ${
                                  colorClass
                                } ${
                                  value > 0 ? 'hover:ring-2 hover:ring-blue-400 cursor-pointer' : 'cursor-default'
                                }`}
                              >
                                {value > 0 ? value : ''}
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

            {/* Count view legend */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xs font-semibold text-blue-900">Color Scale (sorted by total findings):</span>
                <span className="text-xs text-blue-700">Click aircraft name to view all findings; click cells for monthly detail</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-700 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-4 bg-green-200 rounded border border-green-300"></div>
                  <span><strong>Low</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-4 bg-yellow-300 rounded border border-yellow-400"></div>
                  <span><strong>Medium</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-4 bg-orange-400 rounded border border-orange-500"></div>
                  <span><strong>High</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-4 bg-red-500 rounded border border-red-600"></div>
                  <span><strong>Very High</strong></span>
                </div>
              </div>
            </div>
          </>
        )}

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
      </div>

      {selectedCell && (
        <DetailModal
          isOpen={!!selectedCell}
          onClose={() => setSelectedCell(null)}
          title={selectedCell.label}
          records={modalRecords}
        />
      )}
    </>
  );
}
