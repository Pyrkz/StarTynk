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

    // Mock project check - projectId is valid if it exists
    const validProjectIds = ['1', '2', '3'];
    if (!validProjectIds.includes(projectId) && !projectId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get materials for the project (this is mock data - replace with actual DB query)
    const materials = [
      {
        id: '1',
        name: 'Cement portlandzki CEM I 42,5R',
        category: 'Materiały budowlane',
        supplier: 'BuildSupply Co.',
        imageUrl: '/api/placeholder/120/120',
        currentStock: 25,
        allocatedQuantity: 150,
        unit: 'worków',
        lastDeliveryDate: '15.04.2024',
        usedThisMonth: 45,
        remaining: 105,
        burnRate: 15,
        stockStatus: 'lowStock'
      },
      {
        id: '2',
        name: 'Płytki ceramiczne 60x60',
        category: 'Wykończenie',
        supplier: 'CeramicWorld',
        imageUrl: '/api/placeholder/120/120',
        currentStock: 320,
        allocatedQuantity: 500,
        unit: 'm²',
        lastDeliveryDate: '10.04.2024',
        usedThisMonth: 180,
        remaining: 320,
        burnRate: 60,
        stockStatus: 'inStock'
      },
      {
        id: '3',
        name: 'Kabel YDY 3x2.5mm²',
        category: 'Elektryka',
        supplier: 'ElectroSupply',
        imageUrl: '/api/placeholder/120/120',
        currentStock: 5,
        allocatedQuantity: 200,
        unit: 'metrów',
        lastDeliveryDate: '20.04.2024',
        usedThisMonth: 195,
        remaining: 5,
        burnRate: 65,
        stockStatus: 'outOfStock'
      },
      {
        id: '4',
        name: 'Rura PVC 110mm',
        category: 'Hydraulika',
        supplier: 'PlumbingPro',
        imageUrl: '/api/placeholder/120/120',
        currentStock: 45,
        allocatedQuantity: 100,
        unit: 'sztuk',
        lastDeliveryDate: '18.04.2024',
        usedThisMonth: 30,
        remaining: 70,
        burnRate: 10,
        stockStatus: 'onOrder'
      }
    ];

    const categories = ['Materiały budowlane', 'Wykończenie', 'Elektryka', 'Hydraulika'];

    return NextResponse.json({
      materials,
      totalCount: materials.length,
      categories,
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}