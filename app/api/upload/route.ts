import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { processExcelData } from '@/lib/dataProcessor';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Read Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    // Process data
    const processedData = processExcelData(rawData);

    // Store in memory (in production, use a database)
    global.safaData = processedData;

    return NextResponse.json({
      success: true,
      recordCount: processedData.length,
      message: `${processedData.length} kayıt başarıyla yüklendi ve işlendi`,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Dosya işlenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// Extend global type
declare global {
  var safaData: any[];
}
