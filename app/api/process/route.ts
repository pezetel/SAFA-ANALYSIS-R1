import { NextRequest, NextResponse } from 'next/server';
import { processExcelData } from '@/lib/dataProcessor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawData = body.data;

    if (!rawData || !Array.isArray(rawData)) {
      return NextResponse.json(
        { error: 'Geçersiz veri formatı' },
        { status: 400 }
      );
    }

    // Process data
    const processedData = processExcelData(rawData);

    return NextResponse.json({
      success: true,
      recordCount: processedData.length,
      processedData: processedData,
      message: `${processedData.length} kayıt başarıyla işlendi`,
    });
  } catch (error: any) {
    console.error('Process error:', error);
    return NextResponse.json(
      { error: error.message || 'Veri işlenirken hata oluştu' },
      { status: 500 }
    );
  }
}
