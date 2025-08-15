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

    // Mock data for mobile requests - in a real app, this would come from the database
    const mobileRequests = [
      {
        id: '1',
        employeeName: 'Sarah Johnson',
        employeeRole: 'Elektryk',
        employeePhoto: '/api/placeholder/40/40',
        submissionTime: '2 godziny temu',
        location: 'Budynek B, Piętro 3',
        items: [
          { id: '1', materialName: 'Kabel YDY 3x2.5mm²', quantity: 50, unit: 'metrów', estimatedPrice: 400 },
          { id: '2', materialName: 'Puszki instalacyjne', quantity: 20, unit: 'sztuk', estimatedPrice: 60 },
          { id: '3', materialName: 'Gniazda elektryczne', quantity: 10, unit: 'sztuk', estimatedPrice: 120 }
        ],
        estimatedValue: 580,
        justification: 'Potrzebne do dokończenia instalacji elektrycznej w mieszkaniach 301-305. Brak materiałów wstrzymuje prace.',
        priority: 'high' as const,
        status: 'pending' as const,
        approvalRequired: true
      },
      {
        id: '2',
        employeeName: 'Michał Kowalski',
        employeeRole: 'Hydraulik',
        employeePhoto: '/api/placeholder/40/40',
        submissionTime: '4 godziny temu',
        location: 'Budynek A, Parter',
        items: [
          { id: '4', materialName: 'Rura PVC 50mm', quantity: 10, unit: 'sztuk', estimatedPrice: 150 },
          { id: '5', materialName: 'Kolanka PVC 50mm', quantity: 15, unit: 'sztuk', estimatedPrice: 75 }
        ],
        estimatedValue: 225,
        justification: 'Wymiana uszkodzonej instalacji w łazience mieszkania 102.',
        priority: 'medium' as const,
        status: 'pending' as const,
        approvalRequired: true
      },
      {
        id: '3',
        employeeName: 'Anna Nowak',
        employeeRole: 'Malarz',
        employeePhoto: '/api/placeholder/40/40',
        submissionTime: '5 godzin temu',
        location: 'Budynek C, Piętro 2',
        items: [
          { id: '6', materialName: 'Farba biała 10L', quantity: 5, unit: 'wiader', estimatedPrice: 250 },
          { id: '7', materialName: 'Wałki malarskie', quantity: 10, unit: 'sztuk', estimatedPrice: 50 }
        ],
        estimatedValue: 300,
        justification: 'Kontynuacja malowania mieszkań 201-210. Obecne zapasy wystarczą na 2 mieszkania.',
        priority: 'medium' as const,
        status: 'approved' as const,
        approvalRequired: false
      }
    ];

    const pendingCount = mobileRequests.filter(r => r.status === 'pending').length;

    return NextResponse.json({
      requests: mobileRequests,
      totalCount: mobileRequests.length,
      pendingCount,
    });
  } catch (error) {
    console.error('Error fetching mobile requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mobile requests' },
      { status: 500 }
    );
  }
}