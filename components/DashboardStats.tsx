'use client';

import { SAFARecord } from '@/lib/types';
import { FileText, Plane, AlertTriangle, Calendar } from 'lucide-react';

interface DashboardStatsProps {
  records: SAFARecord[];
}

export function DashboardStats({ records }: DashboardStatsProps) {
  const uniqueAircraft = new Set(records.map(r => r.aircraft)).size;
  const uniqueATA = new Set(records.map(r => r.ata)).size;
  
  const dates = records.map(r => new Date(r.date).getTime());
  const daysDiff = dates.length > 0 
    ? Math.ceil((Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24))
    : 0;

  const avgPerAircraft = uniqueAircraft > 0 
    ? (records.length / uniqueAircraft).toFixed(1)
    : '0';

  const stats = [
    {
      label: 'Toplam Bulgu',
      value: records.length.toLocaleString('tr-TR'),
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Uçak Sayısı',
      value: uniqueAircraft.toString(),
      icon: Plane,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'ATA Chapter',
      value: uniqueATA.toString(),
      icon: AlertTriangle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      label: 'Analiz Dönemi',
      value: `${daysDiff} gün`,
      icon: Calendar,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              {index === 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  Ort. {avgPerAircraft} bulgu/uçak
                </p>
              )}
            </div>
            <div className={`${stat.bgColor} p-3 rounded-lg`}>
              <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
