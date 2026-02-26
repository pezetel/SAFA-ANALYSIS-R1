'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { processExcelData } from '@/lib/dataProcessor';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setStatus('idle');
    setMessage('');

    try {
      // Read Excel file on client-side
      const bytes = await file.arrayBuffer();
      const workbook = XLSX.read(bytes, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

      // Process data on client-side
      const processedData = processExcelData(rawData);

      // Save to localStorage
      localStorage.setItem('safaData', JSON.stringify(processedData));
      localStorage.setItem('safaDataTimestamp', new Date().toISOString());

      setStatus('success');
      setMessage(`${processedData.length} kayıt başarıyla yüklendi ve işlendi`);
      
      // Wait a bit before redirecting to show success message
      setTimeout(() => {
        onUploadSuccess();
      }, 1500);
    } catch (error: any) {
      console.error('Upload error:', error);
      setStatus('error');
      setMessage(error.message || 'Dosya işlenirken hata oluştu. Lütfen Excel formatını kontrol edin.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (uploading) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      // Simulate file input change
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        handleFileChange({ target: fileInputRef.current } as any);
      }
    } else {
      setStatus('error');
      setMessage('Lütfen geçerli bir Excel dosyası (.xlsx veya .xls) yükleyin');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="space-y-4">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
          uploading
            ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
          ) : (
            <div className="bg-blue-100 p-4 rounded-full">
              <FileSpreadsheet className="h-12 w-12 text-blue-600" />
            </div>
          )}

          <div>
            <p className="text-lg font-semibold text-gray-900 mb-1">
              {uploading ? 'Dosya işleniyor...' : 'Excel dosyasını sürükleyin veya tıklayın'}
            </p>
            <p className="text-sm text-gray-500">
              {fileName || 'XLSX veya XLS formatında olmalıdır'}
            </p>
          </div>

          {!uploading && (
            <button
              type="button"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Upload className="h-5 w-5" />
              Dosya Seç
            </button>
          )}
        </div>
      </div>

      {status === 'success' && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-900">Başarılı!</p>
            <p className="text-sm text-green-700">{message}</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-900">Hata!</p>
            <p className="text-sm text-red-700">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
