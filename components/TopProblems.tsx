'use client';

import { SAFARecord } from '@/lib/types';
import { AlertTriangle, TrendingUp, Package, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { DetailModal } from './DetailModal';

interface TopProblemsProps {
  records: SAFARecord[];
}

export function TopProblems({ records }: TopProblemsProps) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [modalRecords, setModalRecords] = useState<SAFARecord[]>([]);

  const componentCounts = records.reduce((acc, record) => {
    if (record.component) {
      acc[record.component] = (acc[record.component] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topComponents = Object.entries(componentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const maxCount = topComponents[0]?.[1] || 1;

  // Calculate chronic issues (appearing in multiple aircraft)
  const componentAircraft = records.reduce((acc, record) => {
    if (record.component) {
      if (!acc[record.component]) {
        acc[record.component] = new Set();
      }
      acc[record.component].add(record.aircraft);
    }
    return acc;
  }, {} as Record<string, Set<string>>);

  const handleComponentClick = (component: string) => {
    const filtered = records.filter(r => r.component === component);
    setModalRecords(filtered);
    setSelectedComponent(component);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">En Sık Görülen Problemler</h2>
          <p className="text-sm text-gray-600 mt-1">Komponent bazında top 10 problem (Tıklayarak detayları görün)</p>
        </div>

        <div className="space-y-4">
          {topComponents.map(([component, count], index) => {
            const percentage = (count / records.length) * 100;
            const aircraftCount = componentAircraft[component]?.size || 0;
            const isChronic = aircraftCount > 5;

            return (
              <button
                key={component}
                onClick={() => handleComponentClick(component)}
                className="w-full space-y-2 text-left hover:bg-gray-50 p-3 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-lg font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {component}
                        </span>
                        {isChronic && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            <AlertTriangle className="h-3 w-3" />
                            Kronik
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {count} bulgu
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {aircraftCount} uçakta
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{count}</div>
                      <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                      isChronic ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span>Kronik Problem: 5+ farklı uçakta görülen sorunlar</span>
          </div>
        </div>
      </div>

      {selectedComponent && (
        <DetailModal
          isOpen={!!selectedComponent}
          onClose={() => setSelectedComponent(null)}
          title={`${selectedComponent} - Detaylı Bulgular`}
          records={modalRecords}
        />
      )}
    </>
  );
}
