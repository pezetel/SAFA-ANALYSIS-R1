'use client';

import { SAFARecord } from '@/lib/types';
import { useMemo, useState } from 'react';
import { DetailModal } from './DetailModal';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ComponentHeatmapProps {
  records: SAFARecord[];
}

export function ComponentHeatmap({ records }: ComponentHeatmapProps) {
  const [selectedRecords, setSelectedRecords] = useState<SAFARecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  const heatmapData = useMemo(() => {
    const componentByMonth: Record<string, Record<string, number>> = {};
    const detailData: Record<string, Record<string, SAFARecord[]>> = {};

    records.forEach(record => {
      const month = format(new Date(record.date), 'yyyy-MM');
      const component = record.component || 'OTHER';

      if (!componentByMonth[component]) {
        componentByMonth[component] = {};
        detailData[component] = {};
      }
      
      componentByMonth[component][month] = (componentByMonth[component][month] || 0) + 1;
      
      if (!detailData[component][month]) {
        detailData[component][month] = [];
      }
      detailData[component][month].push(record);
    });

    const allMonths = Array.from(
      new Set(records.map(r => format(new Date(r.date), 'yyyy-MM')))
    ).sort();

    const topComponents = Object.entries(
      records.reduce((acc, r) => {
        const component = r.component || 'OTHER';
        acc[component] = (acc[component] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([component]) => component);

    const maxCount = Math.max(
      ...topComponents.flatMap(component => 
        Object.values(componentByMonth[component] || {})
      )
    );

    return {
      components: topComponents,
      months: allMonths,
      data: componentByMonth,
      detailData,
      maxCount,
    };
  }, [records]);

  const getColor = (count: number) => {
    if (!count) return 'bg-gray-50';
    const intensity = Math.min(count / heatmapData.maxCount, 1);
    if (intensity > 0.7) return 'bg-red-600 text-white';
    if (intensity > 0.5) return 'bg-orange-500 text-white';
    if (intensity > 0.3) return 'bg-yellow-400 text-gray-900';
    if (intensity > 0.1) return 'bg-green-300 text-gray-900';
    return 'bg-blue-200 text-gray-900';
  };

  const formatComponentName = (component: string) => {
    return component.replace(/_/g, ' ');
  };

  const handleCellClick = (component: string, month: string, count: number) => {
    if (count === 0) return;
    
    const records = heatmapData.detailData[component]?.[month] || [];
    const monthName = format(parseISO(month + '-01'), 'MMMM yyyy', { locale: tr });
    setSelectedRecords(records);
    setModalTitle(`${formatComponentName(component)} - ${monthName}`);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Komponent - Zaman Heatmap</h2>
          <p className="text-sm text-gray-600 mt-1">Aylara gore komponent bazinda problem yogunlugu (Tiklayarak detay goruntuleyin)</p>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="w-40 text-left align-top h-16"></th>
                  {heatmapData.months.map((month) => (
                    <th key={month} className="w-16 h-16 align-bottom p-0">
                      <div className="flex items-end justify-center h-full pb-1">
                        <div className="transform -rotate-45 origin-bottom-left text-xs font-medium text-gray-600 whitespace-nowrap">
                          {format(parseISO(month + '-01'), 'MMM yy', { locale: tr })}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.components.map((component) => (
                  <tr key={component}>
                    <td className="w-40 pr-2 py-1 text-xs font-medium text-gray-700 align-middle">
                      {formatComponentName(component)}
                    </td>
                    {heatmapData.months.map((month) => {
                      const count = heatmapData.data[component]?.[month] || 0;
                      return (
                        <td key={`${component}-${month}`} className="p-0.5">
                          <button
                            onClick={() => handleCellClick(component, month, count)}
                            className={`w-full h-10 ${getColor(count)} rounded flex items-center justify-center text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${count === 0 ? 'cursor-default' : ''}`}
                            title={`${formatComponentName(component)} - ${format(parseISO(month + '-01'), 'MMMM yyyy', { locale: tr })}: ${count} kayit`}
                          >
                            {count > 0 ? count : ''}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-6 text-xs flex-wrap">
          <span className="text-gray-600 font-medium">Yogunluk:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
            <span className="text-gray-600">Yok</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 rounded"></div>
            <span className="text-gray-600">Dusuk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-300 rounded"></div>
            <span className="text-gray-600">Orta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span className="text-gray-600">Yuksek</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-gray-600">Cok Yuksek</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span className="text-gray-600">Kritik</span>
          </div>
        </div>
      </div>

      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        records={selectedRecords}
      />
    </>
  );
}
