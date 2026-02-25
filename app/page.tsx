'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { Plane, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Plane className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SAFA Trend Analiz Platformu</h1>
              <p className="text-sm text-gray-600 mt-1">Uçak bulgularının kapsamlı analizi ve raporlaması</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Trend Analizi</h3>
            <p className="text-sm text-gray-600">
              6 aylık periyotlarda detaylı trend analizi, zaman serisi grafikleri ve tahminler
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Çok Boyutlu Analiz</h3>
            <p className="text-sm text-gray-600">
              Uçak, ATA kodu, bulgu tipi bazında gruplandırılmış detaylı raporlar
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Akıllı Uyarılar</h3>
            <p className="text-sm text-gray-600">
              Kronik problemlerin tespiti, risk skorlama ve proaktif bakım önerileri
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Excel Dosyanızı Yükleyin</h2>
              <p className="text-gray-600">
                SAFA bulgularını içeren Excel dosyanızı yükleyin ve kapsamlı analiz raporlarına hemen erişin
              </p>
            </div>

            <FileUpload onUploadSuccess={handleUploadSuccess} />

            {/* Info Box */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">📊 Beklenen Format:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>W/O Date:</strong> İş emri tarihi (örn: 1.05.2025)</li>
                <li>• <strong>ATA:</strong> ATA kodu (örn: 25-22-00)</li>
                <li>• <strong>A/C:</strong> Uçak kuyruk numarası (örn: TC-SOH)</li>
                <li>• <strong>Description:</strong> Bulgu açıklaması</li>
              </ul>
              <p className="text-xs text-blue-700 mt-3">
                💡 EOD numaraları ve standart kalıplar otomatik olarak temizlenecektir
              </p>
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="mt-12 grid md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
            <div className="text-3xl font-bold text-blue-600">1000+</div>
            <div className="text-sm text-gray-600 mt-1">Kayıt İşleme Kapasitesi</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
            <div className="text-3xl font-bold text-green-600">15+</div>
            <div className="text-sm text-gray-600 mt-1">Farklı Görselleştirme</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
            <div className="text-3xl font-bold text-orange-600">100+</div>
            <div className="text-sm text-gray-600 mt-1">ATA Kodu Desteği</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
            <div className="text-3xl font-bold text-purple-600">⚡</div>
            <div className="text-sm text-gray-600 mt-1">Anlık Analiz</div>
          </div>
        </div>
      </div>
    </main>
  );
}
