'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardStats } from '@/components/DashboardStats';
import { TrendChart } from '@/components/TrendChart';
import { ComponentHeatmap } from '@/components/ComponentHeatmap';
import { AircraftHeatmap } from '@/components/AircraftHeatmap';
import { ATAHeatmap } from '@/components/ATAHeatmap';
import { ATADistribution } from '@/components/ATADistribution';
import { ProblemTypeChart } from '@/components/ProblemTypeChart';
import { TopProblems } from '@/components/TopProblems';
import { FilterPanel } from '@/components/FilterPanel';
import { DataTable } from '@/components/DataTable';
import { PeriodComparison } from '@/components/PeriodComparison';
import { EODAlertPanel } from '@/components/EODAlertPanel';
import { SigmaControl } from '@/components/SigmaControl';
import { CalculationGuide } from '@/components/CalculationGuide';
import { SAFARecord, EODRecord, AnalysisResult, SigmaSettings } from '@/lib/types';
import { ArrowLeft, Download, RefreshCw, AlertCircle, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { exportFullReport } from '@/lib/excelExporter';

const DEFAULT_SIGMA: SigmaSettings = { multiplier: 2 };

export default function Dashboard() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [filteredData, setFilteredData] = useState<SAFARecord[]>([]);
  const [allEodRecords, setAllEodRecords] = useState<EODRecord[]>([]);
  const [filteredEodRecords, setFilteredEodRecords] = useState<EODRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sigmaSettings, setSigmaSettings] = useState<SigmaSettings>(DEFAULT_SIGMA);

  useEffect(() => {
    // Load persisted sigma settings
    try {
      const saved = localStorage.getItem('sigmaSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.multiplier) {
          setSigmaSettings({ multiplier: parsed.multiplier });
        }
      }
    } catch {}
    loadData();
  }, []);

  const handleSigmaChange = useCallback((settings: SigmaSettings) => {
    setSigmaSettings(settings);
    try {
      localStorage.setItem('sigmaSettings', JSON.stringify(settings));
    } catch {}
  }, []);

  const loadData = () => {
    setLoading(true);
    setError(null);
    
    try {
      const savedData = localStorage.getItem('safaData');
      
      if (!savedData) {
        setError('No data loaded yet');
        setLoading(false);
        return;
      }

      const records: SAFARecord[] = JSON.parse(savedData);
      
      const processedRecords = records.map(r => ({
        ...r,
        date: new Date(r.date)
      }));

      const savedEOD = localStorage.getItem('eodData');
      if (savedEOD) {
        try {
          const eodRaw: EODRecord[] = JSON.parse(savedEOD);
          const processedEOD = eodRaw.map(e => ({
            ...e,
            perfDate: new Date(e.perfDate)
          }));
          setAllEodRecords(processedEOD);
          setFilteredEodRecords(processedEOD);
        } catch (e) {
          console.warn('Error loading EOD data:', e);
          setAllEodRecords([]);
          setFilteredEodRecords([]);
        }
      }

      const aircraftCounts = processedRecords.reduce((acc, record) => {
        acc[record.aircraft] = (acc[record.aircraft] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const ataCounts = processedRecords.reduce((acc, record) => {
        acc[record.ata] = (acc[record.ata] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const problemTypeCounts = processedRecords.reduce((acc, record) => {
        acc[record.problemType] = (acc[record.problemType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const componentCounts = processedRecords.reduce((acc, record) => {
        if (record.component) {
          acc[record.component] = (acc[record.component] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const timeSeriesData = processedRecords.reduce((acc, record) => {
        const monthKey = new Date(record.date).toISOString().slice(0, 7);
        if (!acc[monthKey]) {
          acc[monthKey] = [];
        }
        acc[monthKey].push(record);
        return acc;
      }, {} as Record<string, SAFARecord[]>);

      const topProblems = Object.entries(componentCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([component, count]) => ({ component, count }));

      const topAircraft = Object.entries(aircraftCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([aircraft, count]) => ({ aircraft, count }));

      const result: AnalysisResult = {
        records: processedRecords,
        statistics: {
          totalRecords: processedRecords.length,
          uniqueAircraft: Object.keys(aircraftCounts).length,
          uniqueATA: Object.keys(ataCounts).length,
          dateRange: {
            start: new Date(Math.min(...processedRecords.map(r => new Date(r.date).getTime()))),
            end: new Date(Math.max(...processedRecords.map(r => new Date(r.date).getTime()))),
          },
        },
        aircraftCounts,
        ataCounts,
        problemTypeCounts,
        componentCounts,
        timeSeriesData,
        topProblems,
        topAircraft,
      };

      setData(result);
      setFilteredData(processedRecords);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (filters: any) => {
    if (!data) return;

    let filtered = [...data.records];
    let filteredEOD = [...allEodRecords];

    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(r => {
        const date = new Date(r.date);
        return date >= start && date <= end;
      });
      filteredEOD = filteredEOD.filter(e => {
        const date = new Date(e.perfDate);
        return date >= start && date <= end;
      });
    }

    if (filters.aircraft && filters.aircraft.length > 0) {
      filtered = filtered.filter(r => filters.aircraft.includes(r.aircraft));
      filteredEOD = filteredEOD.filter(e => filters.aircraft.includes(e.aircraft));
    }

    if (filters.ata && filters.ata.length > 0) {
      filtered = filtered.filter(r => filters.ata.includes(r.ata));
    }

    if (filters.problemType && filters.problemType.length > 0) {
      filtered = filtered.filter(r => filters.problemType.includes(r.problemType));
    }

    if (filters.component && filters.component.length > 0) {
      filtered = filtered.filter(r => filters.component.includes(r.component));
    }

    setFilteredData(filtered);
    setFilteredEodRecords(filteredEOD);
  };

  const exportRawExcel = () => {
    if (!filteredData.length) return;

    const worksheetData = [
      ['W/O Number', 'Date', 'ATA', 'Aircraft', 'Problem Type', 'Component', 'Clean Description'],
      ...filteredData.map(r => [
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SAFA Analysis');

    const colWidths = [
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 20 },
      { wch: 60 }
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `safa-analysis-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportFullReport = () => {
    if (!filteredData.length) return;
    exportFullReport({
      findings: filteredData,
      eodRecords: filteredEodRecords.length > 0 ? filteredEodRecords : undefined,
      sigmaSettings,
    });
  };

  const hasEOD = allEodRecords.length > 0;
  const hasFilteredEOD = filteredEodRecords.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Data Loaded Yet</h2>
            <p className="text-gray-600 mb-6">
              {error || 'You need to upload an Excel file first to view the dashboard.'}
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Go to home page and upload a file
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Analysis Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Total {data.records.length} records analyzed
                  {hasEOD && <span className="text-amber-600 ml-2">• {allEodRecords.length} EOD records loaded</span>}
                  {hasEOD && filteredEodRecords.length !== allEodRecords.length && (
                    <span className="text-blue-600 ml-1">(filtered: {filteredEodRecords.length})</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportFullReport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Export all heatmaps, alerts and data as multi-sheet Excel"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Full Report
              </button>
              <button
                onClick={exportRawExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Raw Data
              </button>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="flex gap-4 mt-4 border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`pb-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'trends'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Trend Analysis
            </button>
            <button
              onClick={() => setActiveTab('period')}
              className={`pb-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'period'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Period Analysis
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Detailed Data
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`pb-2 px-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              Hesaplama Kılavuzu
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab !== 'period' && activeTab !== 'guide' && (
          <div className="mb-6">
            <FilterPanel data={data} onFilter={handleFilter} />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <DashboardStats records={filteredData} />
            
            <div className="grid lg:grid-cols-2 gap-6">
              <ATADistribution records={filteredData} />
              <ProblemTypeChart records={filteredData} />
            </div>

            <TopProblems records={filteredData} />
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Sigma Control — always visible when EOD data exists */}
            {hasFilteredEOD && (
              <SigmaControl sigmaSettings={sigmaSettings} onChange={handleSigmaChange} />
            )}

            {/* EOD Alert Panel */}
            {hasFilteredEOD && (
              <EODAlertPanel findings={filteredData} eodRecords={filteredEodRecords} sigmaSettings={sigmaSettings} />
            )}

            <TrendChart records={filteredData} eodRecords={hasFilteredEOD ? filteredEodRecords : undefined} sigmaSettings={sigmaSettings} />
            <ComponentHeatmap records={filteredData} eodRecords={hasFilteredEOD ? filteredEodRecords : undefined} sigmaSettings={sigmaSettings} />
            <AircraftHeatmap records={filteredData} eodRecords={hasFilteredEOD ? filteredEodRecords : undefined} />
            <ATAHeatmap records={filteredData} eodRecords={hasFilteredEOD ? filteredEodRecords : undefined} sigmaSettings={sigmaSettings} />
          </div>
        )}

        {activeTab === 'period' && (
          <PeriodComparison records={data.records} />
        )}

        {activeTab === 'details' && (
          <DataTable records={filteredData} />
        )}

        {activeTab === 'guide' && (
          <CalculationGuide />
        )}
      </div>
    </div>
  );
}
