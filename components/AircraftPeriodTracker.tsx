'use client';

import { SAFARecord, EODRecord, SigmaSettings } from '@/lib/types';
import { computeWeightedStats } from '@/lib/eodProcessor';
import { useState, useMemo } from 'react';
import { Plane, AlertTriangle, Shield, TrendingUp, TrendingDown, Minus, Search, X, Info } from 'lucide-react';
import { DetailModal } from './DetailModal';

interface AircraftPeriodTrackerProps {
  records: SAFARecord[];
  eodRecords: EODRecord[];
  period1Start: Date;
  period1End: Date;
  period2Start: Date;
  period2End: Date;
  period1Label: string;
  period2Label: string;
  sigmaSettings?: SigmaSettings;
}

const DEFAULT_SIGMA: SigmaSettings = { multiplier: 2 };

type AlertStatus = 'both' | 'p1only' | 'p2only' | 'neither';

interface AircraftPeriodData {
  aircraft: string;
  p1Findings: number;
  p1EODs: number;
  p1Rate: number;
  p2Findings: number;
  p2EODs: number;
  p2Rate: number;
  p1Alert: boolean;
  p2Alert: boolean;
  status: AlertStatus;
  rateChange: number;
}

function computeFleetStats(records: SAFARecord[], eodRecords: EODRecord[]) {
  const acFindings: Record<string, number> = {};
  records.forEach(r => { acFindings[r.aircraft] = (acFindings[r.aircraft] || 0) + 1; });

  const acEODs: Record<string, number> = {};
  eodRecords.forEach(e => { acEODs[e.aircraft] = (acEODs[e.aircraft] || 0) + 1; });

  const allAC = Array.from(new Set([...Object.keys(acFindings), ...Object.keys(acEODs)]));

  const rates: number[] = [];
  const weights: number[] = [];
  const acRates: Record<string, number> = {};

  allAC.forEach(ac => {
    const eods = acEODs[ac] || 0;
    if (eods > 0) {
      const f = acFindings[ac] || 0;
      const rate = f / eods;
      acRates[ac] = rate;
      rates.push(rate);
      weights.push(eods);
    }
  });

  const stats = computeWeightedStats(rates, weights);
  return { acFindings, acEODs, acRates, stats };
}

export function AircraftPeriodTracker({
  records,
  eodRecords,
  period1Start,
  period1End,
  period2Start,
  period2End,
  period1Label,
  period2Label,
  sigmaSettings = DEFAULT_SIGMA,
}: AircraftPeriodTrackerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | AlertStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalRecords, setModalRecords] = useState<SAFARecord[]>([]);

  // Split records & EODs by period
  const p1Records = useMemo(() => records.filter(r => {
    const d = new Date(r.date);
    return d >= period1Start && d <= period1End;
  }), [records, period1Start, period1End]);

  const p2Records = useMemo(() => records.filter(r => {
    const d = new Date(r.date);
    return d >= period2Start && d <= period2End;
  }), [records, period2Start, period2End]);

  const p1EODs = useMemo(() => eodRecords.filter(e => {
    const d = new Date(e.perfDate);
    return d >= period1Start && d <= period1End;
  }), [eodRecords, period1Start, period1End]);

  const p2EODs = useMemo(() => eodRecords.filter(e => {
    const d = new Date(e.perfDate);
    return d >= period2Start && d <= period2End;
  }), [eodRecords, period2Start, period2End]);

  // Compute fleet stats per period
  const p1Stats = useMemo(() => computeFleetStats(p1Records, p1EODs), [p1Records, p1EODs]);
  const p2Stats = useMemo(() => computeFleetStats(p2Records, p2EODs), [p2Records, p2EODs]);

  const p1Threshold = p1Stats.stats.weightedAvg + sigmaSettings.multiplier * p1Stats.stats.weightedSigma;
  const p2Threshold = p2Stats.stats.weightedAvg + sigmaSettings.multiplier * p2Stats.stats.weightedSigma;

  // Build per-aircraft data
  const aircraftData = useMemo(() => {
    const allAC = Array.from(new Set([
      ...Object.keys(p1Stats.acRates),
      ...Object.keys(p2Stats.acRates),
    ])).sort();

    return allAC.map(ac => {
      const p1Rate = p1Stats.acRates[ac] ?? -1;
      const p2Rate = p2Stats.acRates[ac] ?? -1;
      const p1Alert = p1Rate >= 0 && p1Rate > p1Threshold;
      const p2Alert = p2Rate >= 0 && p2Rate > p2Threshold;

      let status: AlertStatus = 'neither';
      if (p1Alert && p2Alert) status = 'both';
      else if (p1Alert && !p2Alert) status = 'p1only';
      else if (!p1Alert && p2Alert) status = 'p2only';

      const rateChange = (p1Rate >= 0 && p2Rate >= 0) ? p2Rate - p1Rate : 0;

      return {
        aircraft: ac,
        p1Findings: p1Stats.acFindings[ac] || 0,
        p1EODs: p1Stats.acEODs[ac] || 0,
        p1Rate: p1Rate >= 0 ? p1Rate : -1,
        p2Findings: p2Stats.acFindings[ac] || 0,
        p2EODs: p2Stats.acEODs[ac] || 0,
        p2Rate: p2Rate >= 0 ? p2Rate : -1,
        p1Alert,
        p2Alert,
        status,
        rateChange,
      } as AircraftPeriodData;
    });
  }, [p1Stats, p2Stats, p1Threshold, p2Threshold]);

  // Filter & search
  const filteredData = useMemo(() => {
    let list = aircraftData;
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toUpperCase();
      list = list.filter(d => d.aircraft.toUpperCase().includes(term));
    }
    if (filterStatus !== 'all') {
      list = list.filter(d => d.status === filterStatus);
    }
    return list;
  }, [aircraftData, searchTerm, filterStatus]);

  // Counts
  const bothAlertCount = aircraftData.filter(d => d.status === 'both').length;
  const p1OnlyCount = aircraftData.filter(d => d.status === 'p1only').length;
  const p2OnlyCount = aircraftData.filter(d => d.status === 'p2only').length;
  const neitherCount = aircraftData.filter(d => d.status === 'neither').length;

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'both':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />BOTH ALERT</span>;
      case 'p1only':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />P1 ONLY</span>;
      case 'p2only':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" />P2 ONLY</span>;
      case 'neither':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />NORMAL</span>;
    }
  };

  const handleAircraftClick = (ac: string) => {
    const recs = records.filter(r => {
      const d = new Date(r.date);
      return r.aircraft === ac && (
        (d >= period1Start && d <= period1End) ||
        (d >= period2Start && d <= period2End)
      );
    });
    setModalTitle(`${ac} — ${period1Label} & ${period2Label}`);
    setModalRecords(recs);
    setModalOpen(true);
  };

  // Max rate across both periods for bar scaling
  const maxRate = useMemo(() => {
    const allRates = aircraftData.flatMap(d => [d.p1Rate, d.p2Rate]).filter(r => r >= 0);
    return Math.max(...allRates, p1Threshold, p2Threshold, 0.1);
  }, [aircraftData, p1Threshold, p2Threshold]);

  // Only show aircraft that have data in at least one period, sorted by status priority
  const sortedForChart = useMemo(() => {
    const statusOrder: Record<AlertStatus, number> = { both: 0, p2only: 1, p1only: 2, neither: 3 };
    return [...filteredData]
      .filter(d => d.p1Rate >= 0 || d.p2Rate >= 0)
      .sort((a, b) => {
        if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
        return (b.p1Rate + b.p2Rate) - (a.p1Rate + a.p2Rate);
      });
  }, [filteredData]);

  const getBarColor = (rate: number, threshold: number, isP1: boolean) => {
    if (rate < 0) return 'bg-gray-200';
    if (rate > threshold) return isP1 ? 'bg-blue-500' : 'bg-purple-500';
    return isP1 ? 'bg-blue-200' : 'bg-purple-200';
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2.5 rounded-xl">
              <Plane className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Aircraft Period Tracker</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Compare aircraft alert status across two periods — identify persistent problem aircraft
              </p>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>How it works:</strong> Each period{"'"} Fleet Weighted Avg and {sigmaSettings.multiplier}{"σ"} threshold are calculated independently.
              Aircraft marked <span className="font-bold text-red-700">BOTH ALERT</span> exceeded the threshold in both periods — these are persistent problem aircraft. Consider restricting them from specific stations.
            </div>
          </div>
        </div>

        {/* Period Stats Side by Side */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-blue-900">{period1Label}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-[10px] text-gray-500">Fleet Avg</p><p className="text-sm font-bold text-blue-700">{p1Stats.stats.weightedAvg.toFixed(3)}</p></div>
              <div><p className="text-[10px] text-gray-500">Fleet σ</p><p className="text-sm font-bold text-blue-700">{p1Stats.stats.weightedSigma.toFixed(3)}</p></div>
              <div><p className="text-[10px] text-gray-500">Threshold ({sigmaSettings.multiplier}σ)</p><p className="text-sm font-bold text-red-600">{p1Threshold.toFixed(3)}</p></div>
            </div>
          </div>
          <div className="border border-purple-200 rounded-lg p-3 bg-purple-50/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-xs font-bold text-purple-900">{period2Label}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-[10px] text-gray-500">Fleet Avg</p><p className="text-sm font-bold text-purple-700">{p2Stats.stats.weightedAvg.toFixed(3)}</p></div>
              <div><p className="text-[10px] text-gray-500">Fleet σ</p><p className="text-sm font-bold text-purple-700">{p2Stats.stats.weightedSigma.toFixed(3)}</p></div>
              <div><p className="text-[10px] text-gray-500">Threshold ({sigmaSettings.multiplier}σ)</p><p className="text-sm font-bold text-red-600">{p2Threshold.toFixed(3)}</p></div>
            </div>
          </div>
        </div>

        {/* Summary Filter Cards */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <button
            onClick={() => setFilterStatus(filterStatus === 'both' ? 'all' : 'both')}
            className={`rounded-lg p-3 text-center transition-all border-2 ${
              filterStatus === 'both'
                ? 'border-red-500 bg-red-50 shadow-md ring-2 ring-red-200'
                : 'border-red-200 bg-red-50/50 hover:border-red-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-bold text-red-800">Both Alert</span>
            </div>
            <p className="text-2xl font-black text-red-600">{bothAlertCount}</p>
            <p className="text-[10px] text-red-500 mt-0.5">Restrict from station</p>
          </button>
          <button
            onClick={() => setFilterStatus(filterStatus === 'p1only' ? 'all' : 'p1only')}
            className={`rounded-lg p-3 text-center transition-all border-2 ${
              filterStatus === 'p1only'
                ? 'border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-200'
                : 'border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingDown className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-800">P1 Only</span>
            </div>
            <p className="text-2xl font-black text-amber-600">{p1OnlyCount}</p>
            <p className="text-[10px] text-amber-500 mt-0.5">Improved in P2</p>
          </button>
          <button
            onClick={() => setFilterStatus(filterStatus === 'p2only' ? 'all' : 'p2only')}
            className={`rounded-lg p-3 text-center transition-all border-2 ${
              filterStatus === 'p2only'
                ? 'border-purple-500 bg-purple-50 shadow-md ring-2 ring-purple-200'
                : 'border-purple-200 bg-purple-50/50 hover:border-purple-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-800">P2 Only</span>
            </div>
            <p className="text-2xl font-black text-purple-600">{p2OnlyCount}</p>
            <p className="text-[10px] text-purple-500 mt-0.5">New alert in P2</p>
          </button>
          <button
            onClick={() => setFilterStatus(filterStatus === 'neither' ? 'all' : 'neither')}
            className={`rounded-lg p-3 text-center transition-all border-2 ${
              filterStatus === 'neither'
                ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-200'
                : 'border-green-200 bg-green-50/50 hover:border-green-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-xs font-bold text-green-800">Normal</span>
            </div>
            <p className="text-2xl font-black text-green-600">{neitherCount}</p>
            <p className="text-[10px] text-green-500 mt-0.5">Clear both periods</p>
          </button>
        </div>

        {/* Visual Bar Chart — Simple paired horizontal bars */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-900">Aircraft Rate Comparison</h4>
            <div className="flex items-center gap-4 text-[10px] text-gray-500">
              <div className="flex items-center gap-1.5"><div className="w-6 h-2.5 rounded bg-blue-500" /><span>P1 Rate (alert)</span></div>
              <div className="flex items-center gap-1.5"><div className="w-6 h-2.5 rounded bg-blue-200" /><span>P1 Rate (normal)</span></div>
              <div className="flex items-center gap-1.5"><div className="w-6 h-2.5 rounded bg-purple-500" /><span>P2 Rate (alert)</span></div>
              <div className="flex items-center gap-1.5"><div className="w-6 h-2.5 rounded bg-purple-200" /><span>P2 Rate (normal)</span></div>
              <div className="flex items-center gap-1.5"><div className="w-px h-4 bg-red-500 border-l-2 border-dashed border-red-400" /><span>Threshold</span></div>
            </div>
          </div>

          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
            {sortedForChart.slice(0, 40).map(d => {
              const p1Width = d.p1Rate >= 0 ? Math.max((d.p1Rate / maxRate) * 100, 0.5) : 0;
              const p2Width = d.p2Rate >= 0 ? Math.max((d.p2Rate / maxRate) * 100, 0.5) : 0;
              const p1ThrPos = (p1Threshold / maxRate) * 100;
              const p2ThrPos = (p2Threshold / maxRate) * 100;
              const isBoth = d.status === 'both';

              return (
                <div
                  key={d.aircraft}
                  className={`rounded-lg p-2 transition-all hover:shadow-sm cursor-pointer ${
                    isBoth ? 'bg-red-50 border border-red-200 hover:bg-red-100' : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                  }`}
                  onClick={() => handleAircraftClick(d.aircraft)}
                >
                  <div className="flex items-center gap-3">
                    {/* Aircraft name */}
                    <div className="w-20 flex-shrink-0 flex items-center gap-1">
                      {isBoth && <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />}
                      <span className={`text-xs font-bold truncate ${isBoth ? 'text-red-800' : 'text-gray-800'}`}>{d.aircraft}</span>
                    </div>

                    {/* Bars area */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* P1 bar */}
                      <div className="relative h-4 bg-gray-100 rounded-full overflow-visible">
                        <div
                          className={`absolute left-0 top-0 h-full rounded-full transition-all ${getBarColor(d.p1Rate, p1Threshold, true)}`}
                          style={{ width: `${Math.min(p1Width, 100)}%` }}
                        />
                        {/* P1 threshold marker */}
                        <div
                          className="absolute top-0 h-full w-0.5 bg-red-400 z-10"
                          style={{ left: `${Math.min(p1ThrPos, 100)}%` }}
                          title={`P1 Threshold: ${p1Threshold.toFixed(3)}`}
                        />
                        {/* Rate label */}
                        <div className="absolute inset-0 flex items-center px-2">
                          <span className={`text-[9px] font-bold ${d.p1Rate > p1Threshold ? 'text-white' : 'text-gray-600'} drop-shadow-sm`}>
                            {d.p1Rate >= 0 ? d.p1Rate.toFixed(3) : 'N/A'}
                          </span>
                        </div>
                      </div>
                      {/* P2 bar */}
                      <div className="relative h-4 bg-gray-100 rounded-full overflow-visible">
                        <div
                          className={`absolute left-0 top-0 h-full rounded-full transition-all ${getBarColor(d.p2Rate, p2Threshold, false)}`}
                          style={{ width: `${Math.min(p2Width, 100)}%` }}
                        />
                        {/* P2 threshold marker */}
                        <div
                          className="absolute top-0 h-full w-0.5 bg-red-400 z-10"
                          style={{ left: `${Math.min(p2ThrPos, 100)}%` }}
                          title={`P2 Threshold: ${p2Threshold.toFixed(3)}`}
                        />
                        {/* Rate label */}
                        <div className="absolute inset-0 flex items-center px-2">
                          <span className={`text-[9px] font-bold ${d.p2Rate > p2Threshold ? 'text-white' : 'text-gray-600'} drop-shadow-sm`}>
                            {d.p2Rate >= 0 ? d.p2Rate.toFixed(3) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Change & Status */}
                    <div className="w-16 flex-shrink-0 text-center">
                      {d.p1Rate >= 0 && d.p2Rate >= 0 ? (
                        <span className={`text-[10px] font-bold flex items-center justify-center gap-0.5 ${
                          d.rateChange > 0 ? 'text-red-600' : d.rateChange < 0 ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {d.rateChange > 0 ? <TrendingUp className="h-3 w-3" /> : d.rateChange < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          {d.rateChange > 0 ? '+' : ''}{d.rateChange.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">—</span>
                      )}
                    </div>

                    <div className="w-24 flex-shrink-0">
                      {getStatusBadge(d.status)}
                    </div>
                  </div>
                </div>
              );
            })}

            {sortedForChart.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-400">
                No aircraft found{searchTerm ? ` matching "${searchTerm}"` : ''}{filterStatus !== 'all' ? ' with selected filter' : ''}
              </div>
            )}

            {sortedForChart.length > 40 && (
              <div className="text-center py-2 text-xs text-gray-400">
                Showing top 40 of {sortedForChart.length} aircraft. Use search or filters to narrow down.
              </div>
            )}
          </div>

          {/* Bar labels */}
          <div className="flex items-center justify-center gap-6 mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400">
            <span>Top bar = {period1Label} rate</span>
            <span>Bottom bar = {period2Label} rate</span>
            <span>Red line = period threshold</span>
            <span>Bright bar = above threshold (alert)</span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search aircraft (e.g. SEK, TC-SOH)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent w-56"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {filterStatus !== 'all' && (
            <button
              onClick={() => setFilterStatus('all')}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-red-500 bg-gray-100 rounded-lg"
            >
              <X className="h-3 w-3" /> Clear filter
            </button>
          )}
          <span className="text-xs text-gray-400">{filteredData.length} aircraft</span>
        </div>

        {/* Both Alert Highlight */}
        {bothAlertCount > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-900 mb-1">
                  {bothAlertCount} aircraft above threshold in BOTH periods
                </p>
                <p className="text-xs text-red-700 mb-2">
                  These aircraft consistently exceed the fleet average + {sigmaSettings.multiplier}{"σ"} threshold.
                  Consider restricting them from specific stations.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {aircraftData.filter(d => d.status === 'both').map(d => (
                    <button
                      key={d.aircraft}
                      onClick={() => handleAircraftClick(d.aircraft)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors cursor-pointer"
                    >
                      <Plane className="h-3 w-3" />
                      {d.aircraft}
                      <span className="text-red-500 font-normal">({d.p1Rate.toFixed(2)} {"→"} {d.p2Rate.toFixed(2)})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <DetailModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalTitle}
          records={modalRecords}
        />
      )}
    </>
  );
}
