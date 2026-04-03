'use client';

import { SAFARecord } from '@/lib/types';
import { AlertTriangle, Package, ChevronRight, Tag, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { DetailModal } from './DetailModal';

interface TopProblemsProps {
  records: SAFARecord[];
}

export function TopProblems({ records }: TopProblemsProps) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [modalRecords, setModalRecords] = useState<SAFARecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCount, setShowCount] = useState<number>(10);
  const [showAll, setShowAll] = useState(false);

  const componentCounts = records.reduce((acc, record) => {
    if (record.component) {
      acc[record.component] = (acc[record.component] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const allComponents = Object.entries(componentCounts)
    .sort(([, a], [, b]) => b - a);

  const maxCount = allComponents[0]?.[1] || 1;

  // Apply search filter
  const filteredComponents = useMemo(() => {
    if (!searchTerm.trim()) return allComponents;
    const term = searchTerm.trim().toUpperCase();
    return allComponents.filter(([comp]) =>
      comp.toUpperCase().includes(term) ||
      comp.replace(/_/g, ' ').toUpperCase().includes(term)
    );
  }, [allComponents, searchTerm]);

  const displayedComponents = showAll ? filteredComponents : filteredComponents.slice(0, showCount);
  const totalFiltered = filteredComponents.length;
  const hasMore = totalFiltered > showCount;

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
          <p className="text-xs text-gray-600 mt-1">
            {showAll ? `All ${totalFiltered}` : `Top ${Math.min(showCount, totalFiltered)} of ${allComponents.length}`} components classified by finding type{searchTerm ? `, filtered by "${searchTerm}"` : ''} (Click to view details)
          </p>
        </div>

        {/* Search & Show Count Controls */}
        <div className="mb-3 flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search component (e.g. PLACARD, SEAT)"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowAll(false); }}
              className="pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent w-60"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Show:</span>
            {[10, 20, 50].map(n => (
              <button
                key={n}
                onClick={() => { setShowCount(n); setShowAll(false); }}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  showCount === n && !showAll
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setShowAll(true)}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                showAll
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
          <span className="text-xs text-gray-400 ml-auto">{totalFiltered} component{totalFiltered !== 1 ? 's' : ''}{searchTerm ? ' matched' : ' total'}</span>
        </div>

        <div className="space-y-3">
          {displayedComponents.map(([component, count], index) => {
            const percentage = (count / records.length) * 100;
            const breakdown = componentBreakdown[component] || {};
            const sortedTypes = Object.entries(breakdown).sort(([, a], [, b]) => b - a);
            // Calculate original rank (before filter)
            const originalRank = allComponents.findIndex(([c]) => c === component) + 1;

            return (
              <button
                key={component}
                onClick={() => handleComponentClick(component)}
                className="w-full space-y-1.5 text-left hover:bg-gray-50 p-2.5 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-600 rounded-lg font-bold text-xs">
                      {originalRank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">
                          {component.replace(/_/g, ' ')}
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
          {displayedComponents.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400">
              No components found{searchTerm ? ` matching "${searchTerm}"` : ''}
            </div>
          )}
        </div>

        {/* Show More/Less toggle */}
        {hasMore && !showAll && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setShowAll(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Show All {totalFiltered} Components
            </button>
          </div>
        )}
        {showAll && totalFiltered > 10 && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setShowAll(false)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              Collapse to {showCount}
            </button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 text-center">
          {searchTerm
            ? `Showing ${displayedComponents.length} of ${totalFiltered} matched components · ${records.length} total findings`
            : `Showing ${displayedComponents.length} of ${allComponents.length} components · ${records.length} total findings`
          }
        </div>
      </div>

      {selectedComponent && (
        <DetailModal
          isOpen={!!selectedComponent}
          onClose={() => setSelectedComponent(null)}
          title={`${selectedComponent.replace(/_/g, ' ')} - Detailed Findings`}
          records={modalRecords}
        />
      )}
    </>
  );
}
