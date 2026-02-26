'use client';

import { SAFARecord } from '@/lib/types';
import { format, startOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState } from 'react';
import { DetailModal } from './DetailModal';

interface ATAHeatmapProps {
  records: SAFARecord[];
}

export function ATAHeatmap({ records }: ATAHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<{ ata: string; month: string } | null>(null);
  const [modalRecords, setModalRecords] = useState<SAFARecord[]>([]);

  const ataList = Array.from(new Set(records.map(r => r.ata))).sort();
  const months = Array.from(
    new Set(records.map(r => format(startOfMonth(new Date(r.date)), 'yyyy-MM')))
  ).sort();

  const heatmapData: Record<string, Record<string, number>> = {};
  
  ataList.forEach(ata => {
    heatmapData[ata] = {};
    months.forEach(month => {
      heatmapData[ata][month] = 0;
    });
  });

  records.forEach(record => {
    const month = format(startOfMonth(new Date(record.date)), 'yyyy-MM');
    if (heatmapData[record.ata] && heatmapData[record.ata][month] !== undefined) {
      heatmapData[record.ata][month]++;
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

  const topATA = Object.entries(heatmapData)
    .map(([ata, data]) => [ata, Object.values(data).reduce((a, b) => a + b, 0)] as [string, number])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ata]) => ata);

  const handleCellClick = (ata: string, month: string) => {
    const filtered = records.filter(r => {
      const recordMonth = format(startOfMonth(new Date(r.date)), 'yyyy-MM');
      return r.ata === ata && recordMonth === month;
    });
    
    if (filtered.length > 0) {
      setModalRecords(filtered);
      setSelectedCell({ ata, month });
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h2 className="text-base font-bold text-gray-900">ATA Chapter-Zaman Heat Map</h2>
          <p className="text-xs text-gray-600 mt-0.5">Sistem bazlı aylık bulgu yoğunluğu (Top 10 ATA) - Hücrelere tıklayarak detayları görün</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-1.5 font-semibold text-gray-700 border-b-2 border-gray-200">
                  ATA Chapter
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
              {topATA.map(ata => {
                const total = Object.values(heatmapData[ata]).reduce((a, b) => a + b, 0);
                return (
                  <tr key={ata} className="hover:bg-gray-50">
                    <td className="p-1.5 font-medium text-gray-900 border-b border-gray-100">
                      {ata}
                    </td>
                    {months.map(month => {
                      const value = heatmapData[ata][month];
                      return (
                        <td key={month} className="p-0.5 border-b border-gray-100">
                          <button
                            onClick={() => handleCellClick(ata, month)}
                            disabled={value === 0}
                            className={`w-full h-8 flex items-center justify-center rounded font-semibold text-xs transition-all ${
                              getColor(value)
                            } ${
                              value > 0 ? 'hover:ring-2 hover:ring-purple-400 cursor-pointer' : 'cursor-default'
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

        <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-xs font-semibold text-purple-900">📊 Renk Skalası:</span>
            <span className="text-xs text-purple-700">Hangi sistemde hangi ayda kaç bulgu olduğunu gösterir</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-700">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-4 bg-green-200 rounded border border-green-300"></div>
              <span><strong>Düşük:</strong> 1-{Math.ceil(maxValue * 0.25)} bulgu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-4 bg-yellow-300 rounded border border-yellow-400"></div>
              <span><strong>Orta:</strong> {Math.ceil(maxValue * 0.25) + 1}-{Math.ceil(maxValue * 0.5)} bulgu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-4 bg-orange-400 rounded border border-orange-500"></div>
              <span><strong>Yüksek:</strong> {Math.ceil(maxValue * 0.5) + 1}-{Math.ceil(maxValue * 0.75)} bulgu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-4 bg-red-500 rounded border border-red-600"></div>
              <span className="text-gray-700"><strong>Çok Yüksek:</strong> {Math.ceil(maxValue * 0.75) + 1}+ bulgu</span>
            </div>
          </div>
        </div>
      </div>

      {selectedCell && (
        <DetailModal
          isOpen={!!selectedCell}
          onClose={() => setSelectedCell(null)}
          title={`ATA ${selectedCell.ata} - ${format(new Date(selectedCell.month + '-01'), 'MMMM yyyy', { locale: tr })}`}
          records={modalRecords}
        />
      )}
    </>
  );
}
