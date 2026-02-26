'use client';

import { SAFARecord } from '@/lib/types';
import { FileText, Plane, Calendar, AlertCircle } from 'lucide-react';

interface DashboardStatsProps {
  records: SAFARecord[];
}

export function DashboardStats({ records }: DashboardStatsProps) {
  const uniqueAircraft = new Set(records.map(r => r.aircraft)).size;
  const uniqueATA = new Set(records.map(r => r.ata)).size;
  
  const dates = records.map(r => new Date(r.date).getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  
  const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  const stats = [
    {
      label: 'Toplam Kayıt',
      value: records.length.toLocaleString('tr-TR'),
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Uçak Sayısı',
      value: uniqueAircraft.toLocaleString('tr-TR'),
      icon: Plane,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      label: 'ATA Kodu',
      value: uniqueATA.toLocaleString('tr-TR'),
      icon: AlertCircle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Analiz Dönemi',
      value: `${daysDiff} gün`,
      icon: Calendar,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-2.5 rounded-lg`}>
                <Icon className={`h-5 w-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
