import { NextRequest, NextResponse } from 'next/server';
import { processExcelData } from '@/lib/dataProcessor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawData = body.data;

    if (!rawData || !Array.isArray(rawData)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Process data
    const processedData = processExcelData(rawData);

    return NextResponse.json({
      success: true,
      recordCount: processedData.length,
      processedData: processedData,
      message: `${processedData.length} records successfully processed`,
    });
  } catch (error: any) {
    console.error('Process error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing data' },
      { status: 500 }
    );
  }
}
