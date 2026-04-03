'use client';

import { AlertItem, EODRecord, SAFARecord } from '@/lib/types';
import { generateAlerts, getOverallMonthlyRate } from '@/lib/eodProcessor';
import { useMemo, useState } from 'react';
import { AlertTriangle, TrendingUp, Activity, ChevronDown, ChevronUp, Plane, Cpu, BookOpen, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface EODAlertPanelProps {
  findings: SAFARecord[];
  eodRecords: EODRecord[];
}

export function EODAlertPanel({ findings, eodRecords }: EODAlertPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'aircraft' | 'component' | 'ata'>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 'alert' | 'watch'>('all');

  const alerts = useMemo(() => generateAlerts(findings, eodRecords), [findings, eodRecords]);
  const monthlyRate = useMemo(() => getOverallMonthlyRate(findings, eodRecords), [findings, eodRecords]);

  const filteredAlerts = useMemo(() => {
    let result = alerts;
    if (filterType !== 'all') {
      result = result.filter(a => a.type === filterType);
    }
    if (filterLevel !== 'all') {
      result = result.filter(a => a.level === filterLevel);
    }
    return result;
  }, [alerts, filterType, filterLevel]);

  const alertCount = alerts.filter(a => a.level === 'alert').length;
  const watchCount = alerts.filter(a => a.level === 'watch').length;

  const overallAvgRate = useMemo(() => {
    const withData = monthlyRate.filter(m => m.eods > 0);
    if (withData.length === 0) return 0;
    return withData.reduce((sum, m) => sum + m.rate, 0) / withData.length;
  }, [monthlyRate]);

  const latestMonth = monthlyRate.length > 0 ? monthlyRate[monthlyRate.length - 1] : null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'aircraft': return <Plane className="h-3.5 w-3.5" />;
      case 'component': return <Cpu className="h-3.5 w-3.5" />;
      case 'ata': return <BookOpen className="h-3.5 w-3.5" />;
      default: return <Activity className="h-3.5 w-3.5" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'alert':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">🔴 ALERT</span>;
      case 'watch':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">🟡 WATCH</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">🟢 Normal</span>;
    }
  };

  if (eodRecords.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 p-2 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              EOD-Based Alert System
              {alertCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  {alertCount} Alert{alertCount > 1 ? 's' : ''}
                </span>
              )}
              {watchCount > 0 && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                  {watchCount} Watch
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500">Finding Rate = Findings / EOD Applications • Alert when rate &gt; 1.5× average</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Summary Stats */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-center px-3 py-1 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">EOD Records</p>
              <p className="text-sm font-bold text-blue-900">{eodRecords.length.toLocaleString()}</p>
            </div>
            <div className="text-center px-3 py-1 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-600 font-medium">Avg Rate</p>
              <p className="text-sm font-bold text-amber-900">{overallAvgRate.toFixed(2)}</p>
            </div>
            {latestMonth && latestMonth.eods > 0 && (
              <div className={`text-center px-3 py-1 rounded-lg ${
                latestMonth.rate > overallAvgRate * 1.5 ? 'bg-red-50' : latestMonth.rate > overallAvgRate ? 'bg-yellow-50' : 'bg-green-50'
              }`}>
                <p className="text-xs text-gray-600 font-medium">Latest Rate</p>
                <p className={`text-sm font-bold ${
                  latestMonth.rate > overallAvgRate * 1.5 ? 'text-red-700' : latestMonth.rate > overallAvgRate ? 'text-yellow-700' : 'text-green-700'
                }`}>{latestMonth.rate.toFixed(2)}</p>
              </div>
            )}
          </div>
          {expanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-200">
          {/* Explanation Banner */}
          <div className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-semibold mb-1">How does it work?</p>
                <p><strong>Finding Rate</strong> = Number of Findings / Number of EOD Applications per month.</p>
                <p><strong>🟢 Normal:</strong> Rate ≤ Average | <strong>🟡 Watch:</strong> Average &lt; Rate ≤ 1.5× Average | <strong>🔴 Alert:</strong> Rate &gt; 1.5× Average</p>
                <p className="mt-1">Aircraft rates are calculated per-aircraft per-month. Component and ATA rates use total monthly EODs as denominator.</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 pt-3 pb-2 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-gray-500">Filter:</span>
            <div className="flex gap-1">
              {[
                { key: 'all' as const, label: 'All' },
                { key: 'aircraft' as const, label: '✈️ Aircraft' },
                { key: 'component' as const, label: '🔧 Component' },
                { key: 'ata' as const, label: '📖 ATA' },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setFilterType(item.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filterType === item.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex gap-1">
              {[
                { key: 'all' as const, label: 'All Levels' },
                { key: 'alert' as const, label: '🔴 Alert Only' },
                { key: 'watch' as const, label: '🟡 Watch Only' },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setFilterLevel(item.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filterLevel === item.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-gray-400">{filteredAlerts.length} items</span>
          </div>

          {/* Alert List */}
          <div className="px-4 pb-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-green-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">No alerts found</p>
                <p className="text-xs text-gray-400">All metrics are within normal range</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAlerts.slice(0, 30).map((alert, idx) => (
                  <div
                    key={`${alert.type}-${alert.name}-${alert.month}-${idx}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      alert.level === 'alert'
                        ? 'bg-red-50 border-red-200 hover:bg-red-100'
                        : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${
                      alert.level === 'alert' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {getTypeIcon(alert.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {alert.name.replace(/_/g, ' ')}
                        </span>
                        {getLevelBadge(alert.level)}
                        <span className="text-xs text-gray-400 capitalize">{alert.type}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {format(parseISO(alert.month + '-01'), 'MMMM yyyy', { locale: enUS })}
                        {' · '}
                        {alert.findings} findings / {alert.eods} EODs
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold ${
                        alert.level === 'alert' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {alert.rate.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {alert.ratio.toFixed(1)}× avg ({alert.avgRate.toFixed(2)})
                      </p>
                    </div>
                  </div>
                ))}
                {filteredAlerts.length > 30 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    Showing 30 of {filteredAlerts.length} alerts
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
