'use client';

import { useState } from 'react';
import { SAFARecord } from '@/lib/types';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

interface DataTableProps {
  records: SAFARecord[];
}

export function DataTable({ records }: DataTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof SAFARecord>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter
  const filteredRecords = records.filter(record => {
    const searchLower = search.toLowerCase();
    return (
      record.aircraft.toLowerCase().includes(searchLower) ||
      record.ata.toLowerCase().includes(searchLower) ||
      record.cleanDescription.toLowerCase().includes(searchLower) ||
      record.problemType.toLowerCase().includes(searchLower) ||
      record.component.toLowerCase().includes(searchLower)
    );
  });

  // Sort
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

  if (sortField === 'date') {
    const aTime = new Date(aVal as Date).getTime();
    const bTime = new Date(bVal as Date).getTime();
    return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
  }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = sortedRecords.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof SAFARecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: keyof SAFARecord }) => {
    if (sortField !== field) return <ChevronDown className="h-4 w-4 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-blue-600" /> : 
      <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Detaylı Veri Tablosu</h2>
            <p className="text-sm text-gray-600 mt-1">
              Toplam {sortedRecords.length} kayıt gösteriliyor
            </p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Ara..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-3 font-semibold text-gray-700">
                <button
                  onClick={() => handleSort('woNumber')}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  W/O
                  <SortIcon field="woNumber" />
                </button>
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  Tarih
                  <SortIcon field="date" />
                </button>
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">
                <button
                  onClick={() => handleSort('aircraft')}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  Uçak
                  <SortIcon field="aircraft" />
                </button>
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">
                <button
                  onClick={() => handleSort('ata')}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  ATA
                  <SortIcon field="ata" />
                </button>
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">
                <button
                  onClick={() => handleSort('problemType')}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  Problem Tipi
                  <SortIcon field="problemType" />
                </button>
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">
                <button
                  onClick={() => handleSort('component')}
                  className="flex items-center gap-1 hover:text-blue-600"
                >
                  Komponent
                  <SortIcon field="component" />
                </button>
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">Açıklama</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.map((record, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 text-gray-600">{record.woNumber}</td>
                <td className="p-3 text-gray-600">
                  {new Date(record.date).toLocaleDateString('tr-TR')}
                </td>
                <td className="p-3">
                  <span className="font-medium text-gray-900">{record.aircraft}</span>
                </td>
                <td className="p-3">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                    {record.ata}
                  </span>
                </td>
                <td className="p-3">
                  <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                    {record.problemType}
                  </span>
                </td>
                <td className="p-3 text-gray-600">{record.component}</td>
                <td className="p-3 text-gray-600 max-w-md truncate" title={record.cleanDescription}>
                  {record.cleanDescription}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Sayfa {currentPage} / {totalPages} (Toplam {sortedRecords.length} kayıt)
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Önceki
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Sonraki
          </button>
        </div>
      </div>
    </div>
  );
}
