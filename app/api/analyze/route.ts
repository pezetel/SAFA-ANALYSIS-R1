import { NextResponse } from 'next/server';
import { SAFARecord, AnalysisResult } from '@/lib/types';

export async function GET() {
  try {
    const data: SAFARecord[] = global.safaData || [];

    if (!data.length) {
      return NextResponse.json(
        { error: 'Henüz veri yüklenmedi' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const aircraftCounts = data.reduce((acc, record) => {
      acc[record.aircraft] = (acc[record.aircraft] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ataCounts = data.reduce((acc, record) => {
      acc[record.ata] = (acc[record.ata] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const problemTypeCounts = data.reduce((acc, record) => {
      acc[record.problemType] = (acc[record.problemType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const componentCounts = data.reduce((acc, record) => {
      if (record.component) {
        acc[record.component] = (acc[record.component] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Time series data
    const timeSeriesData = data.reduce((acc, record) => {
      const monthKey = new Date(record.date).toISOString().slice(0, 7);
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(record);
      return acc;
    }, {} as Record<string, SAFARecord[]>);

    // Top problems
    const topProblems = Object.entries(componentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([component, count]) => ({ component, count }));

    // Top aircraft
    const topAircraft = Object.entries(aircraftCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([aircraft, count]) => ({ aircraft, count }));

    const result: AnalysisResult = {
      records: data,
      statistics: {
        totalRecords: data.length,
        uniqueAircraft: Object.keys(aircraftCounts).length,
        uniqueATA: Object.keys(ataCounts).length,
        dateRange: {
          start: new Date(Math.min(...data.map(r => new Date(r.date).getTime()))),
          end: new Date(Math.max(...data.map(r => new Date(r.date).getTime()))),
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

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Analiz sırasında hata oluştu' },
      { status: 500 }
    );
  }
}
