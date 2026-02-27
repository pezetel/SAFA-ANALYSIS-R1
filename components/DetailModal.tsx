'use client';

import { SAFARecord } from '@/lib/types';
import { X, Download, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  records: SAFARecord[];
}

export function DetailModal({ isOpen, onClose, title, records }: DetailModalProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredRecords = records.filter(record => {
    const searchLower = search.toLowerCase();
    return (
      record.aircraft.toLowerCase().includes(searchLower) ||
      record.ata.toLowerCase().includes(searchLower) ||
      record.cleanDescription.toLowerCase().includes(searchLower) ||
      record.woNumber.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  const exportToExcel = () => {
    const worksheetData = [
      ['W/O Number', 'Date', 'ATA', 'Aircraft', 'Problem Type', 'Component', 'Clean Description'],
      ...filteredRecords.map(r => [
        r.woNumber,
        new Date(r.date).toLocaleDateString('tr-TR'),
        r.ata,
        r.aircraft,
        r.problemType,
        r.component,
        r.cleanDescription
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Detail');

    const colWidths = [
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 20 },
      { wch: 60 }
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `safa-detail-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">{filteredRecords.length} kayit</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                Export Excel
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="relative">
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

          {/* Table */}
          <div className="overflow-x-auto" style={{ maxHeight: '60vh' }}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">W/O</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Tarih</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Ucak</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">ATA</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Problem Tipi</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Komponent</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Aciklama</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-gray-600 whitespace-nowrap">{record.woNumber}</td>
                    <td className="p-3 text-gray-600 whitespace-nowrap">
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
                    <td className="p-3 text-gray-600 max-w-md" title={record.cleanDescription}>
                      {record.cleanDescription.length > 100 
                        ? record.cleanDescription.substring(0, 100) + '...' 
                        : record.cleanDescription}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-600">
              Sayfa {currentPage} / {totalPages} ({filteredRecords.length} kayit)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                Onceki
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                Sonraki
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
