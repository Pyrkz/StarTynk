// Cash Flow API Endpoint
// GET /api/finance/cash-flow - Monthly cash flow data and projections

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/features/auth/lib/auth-options';
import { getCashFlowData } from '@/lib/financial-aggregations';
import { predictCashFlow } from '@/lib/financial-calculations';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const includePredictions = searchParams.get('includePredictions') === 'true';
    const predictMonths = parseInt(searchParams.get('predictMonths') || '6');
    
    // Default to last 12 months if no dates provided
    const endDate = endDateParam ? 
      new Date(endDateParam) : 
      new Date();
    const startDate = startDateParam ? 
      new Date(startDateParam) : 
      new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1);

    // Get historical cash flow data
    const historicalData = await getCashFlowData(startDate, endDate);

    let response: {
      historical: typeof historicalData;
      predictions?: typeof historicalData;
      summary: any;
    } = {
      historical: historicalData,
      summary: {
        totalPeriods: historicalData.length,
        averageInflow: historicalData.length > 0 ? 
          historicalData.reduce((sum, period) => sum + period.inflows.total, 0) / historicalData.length : 0,
        averageOutflow: historicalData.length > 0 ? 
          historicalData.reduce((sum, period) => sum + period.outflows.total, 0) / historicalData.length : 0,
        averageNetFlow: historicalData.length > 0 ? 
          historicalData.reduce((sum, period) => sum + period.netCashFlow, 0) / historicalData.length : 0,
        currentPosition: historicalData.length > 0 ? 
          historicalData[historicalData.length - 1].cumulativeCashFlow : 0
      }
    };

    // Add predictions if requested
    if (includePredictions && historicalData.length >= 3) {
      const predictions = predictCashFlow(historicalData, predictMonths);
      response.predictions = predictions;
      
      response.summary.projectedPosition = predictions.length > 0 ? 
        predictions[predictions.length - 1].cumulativeCashFlow : 
        response.summary.currentPosition;
    }

    return NextResponse.json({
      success: true,
      data: response,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching cash flow data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch cash flow data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}