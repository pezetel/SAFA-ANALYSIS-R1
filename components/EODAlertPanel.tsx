'use client';

import { AlertItem, EODRecord, SAFARecord, SigmaSettings } from '@/lib/types';
import { generateAlerts, getOverallMonthlyRate } from '@/lib/eodProcessor';
import { useMemo, useState } from 'react';
import { AlertTriangle, Activity, ChevronDown, ChevronUp, Plane, Cpu, BookOpen, Info, X, Download, Search, ExternalLink } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface EODAlertPanelProps {
  findings: SAFARecord[];
  eodRecords: EODRecord[];
  sigmaSettings?: SigmaSettings;
}

const DEFAULT_SIGMA: SigmaSettings = { multiplier: 2 };

interface AlertDetailModal {
  alert: AlertItem;
  records: SAFARecord[];
}

export function EODAlertPanel({ findings, eodRecords, sigmaSettings = DEFAULT_SIGMA }: EODAlertPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'aircraft' | 'component' | 'ata'>('all');
  const [selectedAlert, setSelectedAlert] = useState<AlertDetailModal | null>(null);
  const [detailSearch, setDetailSearch] = useState('');
  const [detailPage, setDetailPage] = useState(1);
  const detailPageSize = 10;

  const sigmaMultiplier = sigmaSettings.multiplier;

  const alerts = useMemo(
    () => generateAlerts(findings, eodRecords, { multiplier: sigmaMultiplier }),
    [findings, eodRecords, sigmaMultiplier]
  );
  const monthlyRate = useMemo(() => getOverallMonthlyRate(findings, eodRecords), [findings, eodRecords]);

  const filteredAlerts = useMemo(() => {
    let result = alerts;
    if (filterType !== 'all') {
      result = result.filter(a => a.type === filterType);
    }
    return result;
  }, [alerts, filterType]);

  const alertCount = alerts.length;

  const aircraftAlertCount = useMemo(() => alerts.filter(a => a.type === 'aircraft').length, [alerts]);
  const componentAlertCount = useMemo(() => alerts.filter(a => a.type === 'component').length, [alerts]);
  const ataAlertCount = useMemo(() => alerts.filter(a => a.type === 'ata').length, [alerts]);

  const latestMonth = monthlyRate.length > 0 ? monthlyRate[monthlyRate.length - 1] : null;

  const handleAlertClick = (alert: AlertItem) => {
    const monthStart = startOfMonth(parseISO(alert.month + '-01'));
    const monthEnd = endOfMonth(parseISO(alert.month + '-01'));

    let matchedRecords = findings.filter(f => {
      const fDate = new Date(f.date);
      return fDate >= monthStart && fDate <= monthEnd;
    });

    if (alert.type === 'aircraft') {
      matchedRecords = matchedRecords.filter(f => f.aircraft === alert.name);
    } else if (alert.type === 'component') {
      matchedRecords = matchedRecords.filter(f => f.component === alert.name);
    } else if (alert.type === 'ata') {
      matchedRecords = matchedRecords.filter(f => f.ata.substring(0, 2) === alert.name);
    }

    setSelectedAlert({ alert, records: matchedRecords });
    setDetailSearch('');
    setDetailPage(1);
  };

  const closeDetail = () => {
    setSelectedAlert(null);
    setDetailSearch('');
    setDetailPage(1);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'aircraft': return <Plane className="h-3.5 w-3.5" />;
      case 'component': return <Cpu className="h-3.5 w-3.5" />;
      case 'ata': return <BookOpen className="h-3.5 w-3.5" />;
      default: return <Activity className="h-3.5 w-3.5" />;
    }
  };

  const getTypeBigIcon = (type: string) => {
    switch (type) {
      case 'aircraft': return <Plane className="h-5 w-5" />;
      case 'component': return <Cpu className="h-5 w-5" />;
      case 'ata': return <BookOpen className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getLevelBadge = (level: string, size: 'sm' | 'md' = 'sm') => {
    const cls = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
    return <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-red-100 text-red-700 ${cls}`}>ALERT</span>;
  };

  const getAlertMethodLabel = (type: string) => {
    switch (type) {
      case 'aircraft': return '1.5x fleet avg';
      case 'component': return `Avg + ${sigmaMultiplier}\u03c3`;
      case 'ata': return `Avg + ${sigmaMultiplier}\u03c3`;
      default: return '';
    }
  };

  const getAlertMethodDescription = (type: string) => {
    switch (type) {
      case 'aircraft':
        return "Aircraft rate (F/EOD per aircraft) compared to that month's fleet avg x 1.5. No sigma used.";
      case 'component':
        return `Component rate (F/total EOD) compared to its own weighted avg + ${sigmaMultiplier}\u03c3 across all months.`;
      case 'ata':
        return `ATA rate (F/total EOD) compared to its own weighted avg + ${sigmaMultiplier}\u03c3 across all months.`;
      default:
        return '';
    }
  };

  // Detail modal filtered records
  const detailFilteredRecords = useMemo(() => {
    if (!selectedAlert) return [];
    if (!detailSearch.trim()) return selectedAlert.records;
    const s = detailSearch.toLowerCase();
    return selectedAlert.records.filter(r =>
      r.aircraft.toLowerCase().includes(s) ||
      r.ata.toLowerCase().includes(s) ||
      r.cleanDescription.toLowerCase().includes(s) ||
      r.woNumber.toLowerCase().includes(s) ||
      r.component.toLowerCase().includes(s) ||
      r.problemType.toLowerCase().includes(s)
    );
  }, [selectedAlert, detailSearch]);

  const detailTotalPages = Math.ceil(detailFilteredRecords.length / detailPageSize);
  const detailPaginated = detailFilteredRecords.slice(
    (detailPage - 1) * detailPageSize,
    detailPage * detailPageSize
  );

  const exportDetailExcel = () => {
    if (!selectedAlert || detailFilteredRecords.length === 0) return;
    const a = selectedAlert.alert;
    const worksheetData = [
      ['W/O Number', 'Date', 'ATA', 'Aircraft', 'Problem Type', 'Component', 'Description'],
      ...detailFilteredRecords.map(r => [
        r.woNumber,
        new Date(r.date).toLocaleDateString('en-US'),
        r.ata,
        r.aircraft,
        r.problemType,
        r.component,
        r.cleanDescription
      ])
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alert Detail');
    worksheet['!cols'] = [
      { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 22 }, { wch: 60 }
    ];
    const fileName = `alert-${a.type}-${a.name.replace(/[^a-zA-Z0-9]/g, '_')}-${a.month}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (eodRecords.length === 0) return null;

  return (
    <>
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
                General Alert View
                {alertCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                    {alertCount} Alert{alertCount > 1 ? 's' : ''}
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-500">
                Aircraft: 1.5× monthly fleet avg · Component: Own Avg + {sigmaMultiplier}σ · ATA: Own Avg + {sigmaMultiplier}σ · Click any item for details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <div className="text-center px-3 py-1 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">EOD Records</p>
                <p className="text-sm font-bold text-blue-900">{eodRecords.length.toLocaleString()}</p>
              </div>
              <div className="text-center px-3 py-1 bg-amber-50 rounded-lg" title="Alerts breakdown by type">
                <p className="text-xs text-amber-600 font-medium">Alerts by Type</p>
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-900">
                  <span className="flex items-center gap-0.5" title="Aircraft alerts">
                    <Plane className="h-3 w-3" />{aircraftAlertCount}
                  </span>
                  <span className="flex items-center gap-0.5" title="Component alerts">
                    <Cpu className="h-3 w-3" />{componentAlertCount}
                  </span>
                  <span className="flex items-center gap-0.5" title="ATA alerts">
                    <BookOpen className="h-3 w-3" />{ataAlertCount}
                  </span>
                </div>
              </div>
              {latestMonth && latestMonth.eods > 0 && (
                <div className="text-center px-3 py-1 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium">Latest Rate</p>
                  <p className="text-sm font-bold text-gray-900">{latestMonth.rate.toFixed(3)}</p>
                </div>
              )}
            </div>
            {expanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
          </div>
        </button>

        {expanded && (
          <div className="border-t border-gray-200">
            {/* Info banner explaining different calculation methods */}
            <div className="px-4 pt-3 pb-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-blue-900 mb-1">Each alert type uses a different threshold method (matching its heatmap):</p>
                    <ul className="space-y-0.5">
                      <li><strong>Aircraft:</strong> Each aircraft&apos;s rate (findings/aircraft EODs) vs <strong>that month&apos;s fleet avg × 1.5</strong>. No sigma. Each month has a different fleet avg &amp; threshold.</li>
                      <li><strong>Component:</strong> Each component&apos;s rate (findings/total EODs) vs its <strong>own weighted avg + {sigmaMultiplier}σ</strong> across all months.</li>
                      <li><strong>ATA:</strong> Each ATA chapter&apos;s rate (findings/total EODs) vs its <strong>own weighted avg + {sigmaMultiplier}σ</strong> across all months.</li>
                    </ul>
                    <p className="mt-1 text-blue-600">Each alert row shows the specific avg, σ, and threshold used for that item. Click any row to view findings.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-4 pt-1 pb-2 flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium text-gray-500">Filter:</span>
              <div className="flex gap-1">
                {[
                  { key: 'all' as const, label: `All (${alertCount})`, icon: null },
                  { key: 'aircraft' as const, label: `Aircraft (${aircraftAlertCount})`, icon: <Plane className="h-3 w-3" /> },
                  { key: 'component' as const, label: `Component (${componentAlertCount})`, icon: <Cpu className="h-3 w-3" /> },
                  { key: 'ata' as const, label: `ATA (${ataAlertCount})`, icon: <BookOpen className="h-3 w-3" /> },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setFilterType(item.key)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                      filterType === item.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {item.icon}
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
                  <p className="text-xs text-gray-400">
                    All metrics are within their respective thresholds
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredAlerts.slice(0, 50).map((alert, idx) => (
                    <div
                      key={`${alert.type}-${alert.name}-${alert.month}-${idx}`}
                      onClick={() => handleAlertClick(alert)}
                      className="flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer group bg-red-50 border-red-200 hover:bg-red-100 hover:shadow-md"
                    >
                      <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
                        {getTypeIcon(alert.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {alert.name.replace(/_/g, ' ')}
                          </span>
                          {getLevelBadge(alert.level)}
                          <span className="text-xs text-gray-400 capitalize">{alert.type}</span>
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">
                            {getAlertMethodLabel(alert.type)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {format(parseISO(alert.month + '-01'), 'MMMM yyyy', { locale: enUS })}
                          {' · '}
                          {alert.findings} findings / {alert.eods} EODs
                          {alert.type === 'aircraft' ? (
                            <span className="text-gray-400 ml-1">
                              (fleet avg: {alert.avgRate.toFixed(3)}, thr: {alert.threshold.toFixed(3)})
                            </span>
                          ) : (
                            <span className="text-gray-400 ml-1">
                              (own avg: {alert.avgRate.toFixed(3)}, σ: {alert.sigma.toFixed(3)}, thr: {alert.threshold.toFixed(3)})
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-red-600">
                            {alert.rate.toFixed(3)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {alert.ratio.toFixed(2)}x thr
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                  {filteredAlerts.length > 50 && (
                    <p className="text-xs text-gray-400 text-center py-2">
                      Showing 50 of {filteredAlerts.length} alerts
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={closeDetail}
            />

            {/* Modal */}
            <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              {/* Modal Header */}
              <div className="p-5 border-b bg-gradient-to-r from-red-50 to-white border-red-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-red-100 text-red-600">
                      {getTypeBigIcon(selectedAlert.alert.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {selectedAlert.alert.name.replace(/_/g, ' ')}
                        </h3>
                        {getLevelBadge(selectedAlert.alert.level, 'md')}
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full capitalize">
                          {selectedAlert.alert.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {format(parseISO(selectedAlert.alert.month + '-01'), 'MMMM yyyy', { locale: enUS })}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {getAlertMethodDescription(selectedAlert.alert.type)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportDetailExcel}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                    <button
                      onClick={closeDetail}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-6 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm flex-wrap">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium">Findings</p>
                      <p className="text-xl font-bold text-gray-900">{selectedAlert.alert.findings}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium">EODs</p>
                      <p className="text-xl font-bold text-gray-900">{selectedAlert.alert.eods}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium">Rate</p>
                      <p className="text-xl font-bold text-red-600">
                        {selectedAlert.alert.rate.toFixed(3)}
                      </p>
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium">
                        {selectedAlert.alert.type === 'aircraft' ? 'Month Fleet Avg' : 'Own Wt. Avg'}
                      </p>
                      <p className="text-xl font-bold text-blue-600">{selectedAlert.alert.avgRate.toFixed(3)}</p>
                    </div>
                    {selectedAlert.alert.type !== 'aircraft' && (
                      <>
                        <div className="h-8 w-px bg-gray-200" />
                        <div className="text-center">
                          <p className="text-xs text-gray-500 font-medium">Own Wt. σ</p>
                          <p className="text-xl font-bold text-purple-600">{selectedAlert.alert.sigma.toFixed(3)}</p>
                        </div>
                      </>
                    )}
                    <div className="h-8 w-px bg-gray-200" />
                    <div className="text-center">
                      <p className="text-xs text-orange-500 font-medium">
                        {selectedAlert.alert.type === 'aircraft'
                          ? 'Thr (1.5x avg)'
                          : `Thr (Avg+${sigmaMultiplier}σ)`}
                      </p>
                      <p className="text-xl font-bold text-orange-600">{selectedAlert.alert.threshold.toFixed(3)}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium">Ratio</p>
                      <p className="text-xl font-bold text-red-600">
                        {selectedAlert.alert.ratio.toFixed(2)}x
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search findings by W/O, aircraft, ATA, description..."
                    value={detailSearch}
                    onChange={(e) => {
                      setDetailSearch(e.target.value);
                      setDetailPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto" style={{ maxHeight: '50vh' }}>
                {detailFilteredRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No matching findings found</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">#</th>
                        <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">W/O</th>
                        <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Date</th>
                        <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Aircraft</th>
                        <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">ATA</th>
                        <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Problem</th>
                        <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Component</th>
                        <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailPaginated.map((record, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="p-3 text-gray-400 text-xs">{(detailPage - 1) * detailPageSize + index + 1}</td>
                          <td className="p-3 text-gray-600 whitespace-nowrap font-mono text-xs">{record.woNumber}</td>
                          <td className="p-3 text-gray-600 whitespace-nowrap">
                            {new Date(record.date).toLocaleDateString('en-US')}
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-gray-900">{record.aircraft}</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              {record.ata}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                              {record.problemType.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                              {record.component.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600 max-w-md" title={record.cleanDescription}>
                            {record.cleanDescription.length > 80
                              ? record.cleanDescription.substring(0, 80) + '...'
                              : record.cleanDescription}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {detailFilteredRecords.length > 0 && (
                <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                  <div className="text-sm text-gray-600">
                    Page {detailPage} / {detailTotalPages} ({detailFilteredRecords.length} findings)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDetailPage(1)}
                      disabled={detailPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setDetailPage(Math.max(1, detailPage - 1))}
                      disabled={detailPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setDetailPage(Math.min(detailTotalPages, detailPage + 1))}
                      disabled={detailPage === detailTotalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setDetailPage(detailTotalPages)}
                      disabled={detailPage === detailTotalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
