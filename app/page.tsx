'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { Plane, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const APP_VERSION = '2.1.0';

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Plane className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SAFA Trend Analysis Platform</h1>
                <p className="text-sm text-gray-600 mt-0.5">Comprehensive analysis and reporting of aircraft findings</p>
              </div>
            </div>
            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">v{APP_VERSION}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 w-9 h-9 rounded-lg flex items-center justify-center mb-2.5">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Trend Analysis</h3>
            <p className="text-xs text-gray-600">
              Detailed trend analysis in 6-month periods, time series charts and forecasts
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="bg-green-100 w-9 h-9 rounded-lg flex items-center justify-center mb-2.5">
              <BarChart3 className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Multi-Dimensional Analysis</h3>
            <p className="text-xs text-gray-600">
              Detailed reports grouped by aircraft, ATA code, and finding type
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="bg-orange-100 w-9 h-9 rounded-lg flex items-center justify-center mb-2.5">
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Smart Alerts</h3>
            <p className="text-xs text-gray-600">
              Chronic problem detection, risk scoring and proactive maintenance recommendations
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Your Excel File</h2>
              <p className="text-sm text-gray-600">
                Upload your Excel file containing SAFA findings and access comprehensive analysis reports
              </p>
            </div>

            <FileUpload onUploadSuccess={handleUploadSuccess} />

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">📊 Expected Format:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>W/O Date:</strong> Work order date (e.g., 1.05.2025)</li>
                <li>• <strong>ATA:</strong> ATA code (e.g., 25-22-00)</li>
                <li>• <strong>A/C:</strong> Aircraft tail number (e.g., TC-SOH)</li>
                <li>• <strong>Description:</strong> Finding description</li>
              </ul>
              <p className="text-xs text-blue-700 mt-2">
                💡 EOD numbers and standard patterns will be automatically cleaned
              </p>
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="mt-8 grid md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">1000+</div>
            <div className="text-xs text-gray-600 mt-1">Record Processing Capacity</div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">15+</div>
            <div className="text-xs text-gray-600 mt-1">Different Visualizations</div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-orange-600">100+</div>
            <div className="text-xs text-gray-600 mt-1">ATA Code Support</div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-purple-600">⚡</div>
            <div className="text-xs text-gray-600 mt-1">Instant Analysis</div>
          </div>
        </div>

        {/* Footer Version */}
        <div className="mt-10 text-center text-xs text-gray-400">
          SAFA Trend Analysis Platform &middot; Version {APP_VERSION}
        </div>
      </div>
    </main>
  );
}
