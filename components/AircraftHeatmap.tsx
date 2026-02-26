'use client';

import { SAFARecord } from '@/lib/types';
import { format, startOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState } from 'react';
import { DetailModal } from './DetailModal';

interface AircraftHeatmapProps {
  records: SAFARecord[];
}

export function AircraftHeatmap({ records }: AircraftHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<{ aircraft: string; month: string } | null>(null);
  const [modalRecords, setModalRecords] = useState<SAFARecord[]>([]);

  // Get unique aircraft and months
  const aircraft = Array.from(new Set(records.map(r => r.aircraft))).sort();
  const months = Array.from(
    new Set(records.map(r => format(startOfMonth(new Date(r.date)), 'yyyy-MM')))
  ).sort();

  // Build heatmap data
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

  // Get max value for color scaling
  const maxValue = Math.max(
    ...Object.values(heatmapData).flatMap(monthData => Object.values(monthData))
  );

  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-50';
    const intensity = value / maxValue;
    if (intensity > 0.75) return 'bg-red-500 text-white';
    if (intensity > 0.5) return 'bg-orange-400 text-white';
    if (intensity > 0.25) return 'bg-yellow-300';
    return 'bg-green-200';
  };

  // Show top 10 aircraft only
  const topAircraft = Object.entries(heatmapData)
    .map(([ac, data]) => [ac, Object.values(data).reduce((a, b) => a + b, 0)] as [string, number])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ac]) => ac);

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
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Uçak-Zaman Heat Map</h2>
          <p className="text-sm text-gray-600 mt-1">Aylık bulgu yoğunluğu (Top 10 uçak) - Hücrelere tıklayarak detayları görün</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 font-semibold text-gray-700 border-b-2 border-gray-200">
                  Uçak
                </th>
                {months.map(month => (
                  <th key={month} className="p-2 text-center font-medium text-gray-700 border-b-2 border-gray-200">
                    {format(new Date(month + '-01'), 'MMM yy', { locale: tr })}
                  </th>
                ))}
                <th className="p-2 text-center font-semibold text-gray-700 border-b-2 border-gray-200">
                  Toplam
                </th>
              </tr>
            </thead>
            <tbody>
              {topAircraft.map(ac => {
                const total = Object.values(heatmapData[ac]).reduce((a, b) => a + b, 0);
                return (
                  <tr key={ac} className="hover:bg-gray-50">
                    <td className="p-2 font-medium text-gray-900 border-b border-gray-100">
                      {ac}
                    </td>
                    {months.map(month => {
                      const value = heatmapData[ac][month];
                      return (
                        <td key={month} className="p-1 border-b border-gray-100">
                          <button
                            onClick={() => handleCellClick(ac, month)}
                            disabled={value === 0}
                            className={`w-full h-10 flex items-center justify-center rounded font-semibold text-sm transition-all ${
                              getColor(value)
                            } ${
                              value > 0 ? 'hover:ring-2 hover:ring-blue-400 cursor-pointer' : 'cursor-default'
                            }`}
                          >
                            {value > 0 ? value : ''}
                          </button>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center font-bold text-gray-900 border-b border-gray-100 bg-gray-50">
                      {total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
          <span>Renk Skalası:</span>
          <div className="flex items-center gap-1">
            <div className="w-8 h-4 bg-green-200 rounded"></div>
            <span>Düşük</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-4 bg-yellow-300 rounded"></div>
            <span>Orta</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-4 bg-orange-400 rounded"></div>
            <span>Yüksek</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-4 bg-red-500 rounded"></div>
            <span>Çok Yüksek</span>
          </div>
        </div>
      </div>

      {selectedCell && (
        <DetailModal
          isOpen={!!selectedCell}
          onClose={() => setSelectedCell(null)}
          title={`${selectedCell.aircraft} - ${format(new Date(selectedCell.month + '-01'), 'MMMM yyyy', { locale: tr })}`}
          records={modalRecords}
        />
      )}
    </>
  );
}
