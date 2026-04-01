'use client';

import { SAFARecord } from '@/lib/types';
import { AlertTriangle, Package, ChevronRight, Tag } from 'lucide-react';
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

  const allComponents = Object.entries(componentCounts)
    .sort(([, a], [, b]) => b - a);

  const maxCount = allComponents[0]?.[1] || 1;

  // Classify all findings by problem type per component
  const componentBreakdown = records.reduce((acc, record) => {
    if (record.component) {
      if (!acc[record.component]) {
        acc[record.component] = {};
      }
      acc[record.component][record.problemType] = (acc[record.component][record.problemType] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const handleComponentClick = (component: string) => {
    const filtered = records.filter(r => r.component === component);
    setModalRecords(filtered);
    setSelectedComponent(component);
  };

  const PROBLEM_TYPE_COLORS: Record<string, string> = {
    MISSING: 'bg-red-100 text-red-700',
    DAMAGED: 'bg-orange-100 text-orange-700',
    DENT: 'bg-amber-100 text-amber-700',
    LOOSE: 'bg-yellow-100 text-yellow-700',
    INOPERATIVE: 'bg-purple-100 text-purple-700',
    CLEANLINESS: 'bg-cyan-100 text-cyan-700',
    LOW_LEVEL: 'bg-teal-100 text-teal-700',
    ADJUSTMENT: 'bg-green-100 text-green-700',
    PAINT_DAMAGE: 'bg-pink-100 text-pink-700',
    OTHER: 'bg-gray-100 text-gray-700',
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="mb-4">
          <h2 className="text-base font-bold text-gray-900">All Findings by Component</h2>
          <p className="text-xs text-gray-600 mt-1">All components classified by finding type (Click to view details)</p>
        </div>

        <div className="space-y-3">
          {allComponents.map(([component, count], index) => {
            const percentage = (count / records.length) * 100;
            const breakdown = componentBreakdown[component] || {};
            const sortedTypes = Object.entries(breakdown).sort(([, a], [, b]) => b - a);

            return (
              <button
                key={component}
                onClick={() => handleComponentClick(component)}
                className="w-full space-y-1.5 text-left hover:bg-gray-50 p-2.5 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-600 rounded-lg font-bold text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">
                          {component}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {count} findings
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {sortedTypes.length} type{sortedTypes.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="font-bold text-sm text-gray-900">{count}</div>
                      <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>

                {/* Problem type breakdown tags */}
                <div className="flex flex-wrap gap-1 ml-9">
                  {sortedTypes.map(([type, typeCount]) => (
                    <span
                      key={type}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${PROBLEM_TYPE_COLORS[type] || PROBLEM_TYPE_COLORS.OTHER}`}
                    >
                      {type} <span className="font-bold">{typeCount}</span>
                    </span>
                  ))}
                </div>

                <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all bg-blue-500"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 text-center">
          Showing all {allComponents.length} components &middot; {records.length} total findings
        </div>
      </div>

      {selectedComponent && (
        <DetailModal
          isOpen={!!selectedComponent}
          onClose={() => setSelectedComponent(null)}
          title={`${selectedComponent} - Detailed Findings`}
          records={modalRecords}
        />
      )}
    </>
  );
}
