import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // const session = await getServerSession(authOptions); // Temporarily disabled for client demo
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'month';

    // Mock analytics data - in a real app, this would be calculated from actual data
    const analytics = {
      monthlyConsumption: [
        { month: 'Sty', value: 45000 },
        { month: 'Lut', value: 52000 },
        { month: 'Mar', value: 48000 },
        { month: 'Kwi', value: 58000 },
      ],
      categoryBreakdown: [
        { category: 'Materiały budowlane', value: 35000, percentage: 45 },
        { category: 'Wykończenie', value: 20000, percentage: 26 },
        { category: 'Elektryka', value: 12000, percentage: 15 },
        { category: 'Hydraulika', value: 8000, percentage: 10 },
        { category: 'Inne', value: 3000, percentage: 4 },
      ],
      materialEfficiency: [
        { materialName: 'Cement portlandzki', plannedUsage: 60, actualUsage: 45, efficiency: 92, status: 'excellent' as const },
        { materialName: 'Płytki ceramiczne', plannedUsage: 500, actualUsage: 480, efficiency: 96, status: 'excellent' as const },
        { materialName: 'Kabel elektryczny', plannedUsage: 1000, actualUsage: 1150, efficiency: 85, status: 'good' as const },
        { materialName: 'Rury PVC', plannedUsage: 200, actualUsage: 240, efficiency: 78, status: 'warning' as const },
        { materialName: 'Farba', plannedUsage: 100, actualUsage: 145, efficiency: 65, status: 'poor' as const },
      ],
      supplierPerformance: [
        { supplier: 'BuildSupply Co.', onTimeDelivery: 95, qualityScore: 98, orderAccuracy: 97, overallScore: 97 },
        { supplier: 'CeramicWorld', onTimeDelivery: 88, qualityScore: 95, orderAccuracy: 92, overallScore: 92 },
        { supplier: 'ElectroSupply', onTimeDelivery: 92, qualityScore: 90, orderAccuracy: 88, overallScore: 90 },
        { supplier: 'PlumbingPro', onTimeDelivery: 85, qualityScore: 88, orderAccuracy: 90, overallScore: 88 },
      ],
      reorderPredictions: [
        { material: 'Cement portlandzki', currentStock: 25, dailyUsage: 2.5, daysLeft: 10, reorderDate: '28.04.2024' },
        { material: 'Kabel YDY 3x2.5mm²', currentStock: 50, dailyUsage: 10, daysLeft: 5, reorderDate: '23.04.2024' },
        { material: 'Płytki ceramiczne', currentStock: 320, dailyUsage: 15, daysLeft: 21, reorderDate: '09.05.2024' },
      ],
      metrics: {
        totalConsumption: 58000,
        efficiencyRate: 87,
        wastePercentage: 6.2,
        savings: 4200,
        trend: {
          value: 12,
          isPositive: true,
        },
      },
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching material analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material analytics' },
      { status: 500 }
    );
  }
}