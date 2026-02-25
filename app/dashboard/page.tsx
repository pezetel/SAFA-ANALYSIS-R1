'use client';

import { useState, useEffect } from 'react';
import { DashboardStats } from '@/components/DashboardStats';
import { TrendChart } from '@/components/TrendChart';
import { AircraftHeatmap } from '@/components/AircraftHeatmap';
import { ATADistribution } from '@/components/ATADistribution';
import { ProblemTypeChart } from '@/components/ProblemTypeChart';
import { TopProblems } from '@/components/TopProblems';
import { FilterPanel } from '@/components/FilterPanel';
import { DataTable } from '@/components/DataTable';
import { SAFARecord, AnalysisResult } from '@/lib/types';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [filteredData, setFilteredData] = useState<SAFARecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/analyze');
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setFilteredData(result.records);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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

  const exportToCSV = () => {
    if (!filteredData.length) return;

    const headers = ['W/O Number', 'Date', 'ATA', 'Aircraft', 'Problem Type', 'Component', 'Clean Description'];
    const rows = filteredData.map(r => [
      r.woNumber,
      new Date(r.date).toLocaleDateString('tr-TR'),
      r.ata,
      r.aircraft,
      r.problemType,
      r.component,
      r.cleanDescription
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `safa-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Veriler analiz ediliyor...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Henüz veri yüklenmedi</p>
          <Link href="/" className="text-blue-600 hover:underline">Ana sayfaya dön</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analiz Dashboard</h1>
                <p className="text-sm text-gray-600">Toplam {data.records.length} kayıt analiz edildi</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
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

          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Genel Bakış
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
              Detaylı Veriler
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6">
          <FilterPanel data={data} onFilter={handleFilter} />
        </div>

        {/* Content based on active tab */}
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
          </div>
        )}

        {activeTab === 'details' && (
          <DataTable records={filteredData} />
        )}
      </div>
    </div>
  );
}
