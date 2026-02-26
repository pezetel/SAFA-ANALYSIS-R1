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

  const aircraft = Array.from(new Set(records.map(r => r.aircraft))).sort();
  const months = Array.from(
    new Set(records.map(r => format(startOfMonth(new Date(r.date)), 'yyyy-MM')))
  ).sort();

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
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h2 className="text-base font-bold text-gray-900">Uçak-Zaman Heat Map</h2>
          <p className="text-xs text-gray-600 mt-0.5">Aylık bulgu yoğunluğu (Top 10 uçak) - Hücrelere tıklayarak detayları görün</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-1.5 font-semibold text-gray-700 border-b-2 border-gray-200">
                  Uçak
                </th>
                {months.map(month => (
                  <th key={month} className="p-1.5 text-center font-medium text-gray-700 border-b-2 border-gray-200">
                    {format(new Date(month + '-01'), 'MMM yy', { locale: tr })}
                  </th>
                ))}
                <th className="p-1.5 text-center font-semibold text-gray-700 border-b-2 border-gray-200">
                  Toplam
                </th>
              </tr>
            </thead>
            <tbody>
              {topAircraft.map(ac => {
                const total = Object.values(heatmapData[ac]).reduce((a, b) => a + b, 0);
                return (
                  <tr key={ac} className="hover:bg-gray-50">
                    <td className="p-1.5 font-medium text-gray-900 border-b border-gray-100">
                      {ac}
                    </td>
                    {months.map(month => {
                      const value = heatmapData[ac][month];
                      return (
                        <td key={month} className="p-0.5 border-b border-gray-100">
                          <button
                            onClick={() => handleCellClick(ac, month)}
                            disabled={value === 0}
                            className={`w-full h-8 flex items-center justify-center rounded font-semibold text-xs transition-all ${
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
                    <td className="p-1.5 text-center font-bold text-gray-900 border-b border-gray-100 bg-gray-50">
                      {total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
          <span>Renk Skalaısı:</span>
          <div className="flex items-center gap-1">
            <div className="w-6 h-3 bg-green-200 rounded"></div>
            <span>Düşük</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-3 bg-yellow-300 rounded"></div>
            <span>Orta</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-3 bg-orange-400 rounded"></div>
            <span>Yüksek</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-3 bg-red-500 rounded"></div>
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
