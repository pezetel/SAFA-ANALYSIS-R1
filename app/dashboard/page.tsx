'use client';

import { useState, useEffect } from 'react';
import { DashboardStats } from '@/components/DashboardStats';
import { TrendChart } from '@/components/TrendChart';
import { AircraftHeatmap } from '@/components/AircraftHeatmap';
import { ATAHeatmap } from '@/components/ATAHeatmap';
import { ATADistribution } from '@/components/ATADistribution';
import { ProblemTypeChart } from '@/components/ProblemTypeChart';
import { TopProblems } from '@/components/TopProblems';
import { FilterPanel } from '@/components/FilterPanel';
import { DataTable } from '@/components/DataTable';
import { SAFARecord, AnalysisResult } from '@/lib/types';
import { ArrowLeft, Download, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [filteredData, setFilteredData] = useState<SAFARecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setError(null);
    
    try {
      const savedData = localStorage.getItem('safaData');
      
      if (!savedData) {
        setError('Henuz veri yuklenmedi');
        setLoading(false);
        return;
      }

      const records: SAFARecord[] = JSON.parse(savedData);
      
      const processedRecords = records.map(r => ({
        ...r,
        date: new Date(r.date)
      }));

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
      setError('Veri yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (filters: any) => {
    if (!data) return;

    let filtered = [...data.records];

    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(r => {
        const date = new Date(r.date);
        return date >= start && date <= end;
      });
    }

    if (filters.aircraft && filters.aircraft.length > 0) {
      filtered = filtered.filter(r => filters.aircraft.includes(r.aircraft));
    }

    if (filters.ata && filters.ata.length > 0) {
      filtered = filtered.filter(r => filters.ata.includes(r.ata));
    }

    if (filters.problemType && filters.problemType.length > 0) {
      filtered = filtered.filter(r => filters.problemType.includes(r.problemType));
    }

    setFilteredData(filtered);
  };

  const exportToExcel = () => {
    if (!filteredData.length) return;

    const worksheetData = [
      ['W/O Number', 'Date', 'ATA', 'Aircraft', 'Problem Type', 'Component', 'Severity', 'Clean Description'],
      ...filteredData.map(r => [
        r.woNumber,
        new Date(r.date).toLocaleDateString('tr-TR'),
        r.ata,
        r.aircraft,
        r.problemType,
        r.component,
        r.severity,
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
      { wch: 10 },
      { wch: 60 }
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `safa-analysis-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Veriler yukleniyor...</p>
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
            <h2 className="text-xl font-bold text-gray-900 mb-2">Henuz veri yuklenmedi</h2>
            <p className="text-gray-600 mb-6">
              {error || "Dashboard'u goruntulmek icin once bir Excel dosyasi yuklemeniz gerekmektedir."}
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Ana sayfaya don ve dosya yukle
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
                <h1 className="text-xl font-bold text-gray-900">Analiz Dashboard</h1>
                <p className="text-sm text-gray-600">Toplam {data.records.length} kayit analiz edildi</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export Excel
              </button>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Yenile
              </button>
            </div>
          </div>

          <div className="flex gap-4 mt-4 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Genel Bakis
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'trends'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Trend Analizi
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Detayli Veriler
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <FilterPanel data={data} onFilter={handleFilter} />
        </div>

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
            <TrendChart records={filteredData} />
            <AircraftHeatmap records={filteredData} />
            <ATAHeatmap records={filteredData} />
          </div>
        )}

        {activeTab === 'details' && (
          <DataTable records={filteredData} />
        )}
      </div>
    </div>
  );
}
