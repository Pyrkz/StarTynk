import { NextRequest, NextResponse } from 'next/server';
import { getMockOrdersByProject } from './mock-data';

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

    // Get mock material orders for the project
    const orders = getMockOrdersByProject(projectId);

    // Transform the data to match the expected format
    const transformedOrders = orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      submissionDate: new Date(order.orderDate).toLocaleDateString('pl-PL'),
      submissionTime: new Date(order.orderDate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      requestedBy: order.orderedBy.name || 'Unknown',
      requestedByRole: order.orderedBy.position || 'Employee',
      priority: order.priority || 'normal' as const,
      status: order.deliveryStatus === 'pending' ? 'new' as const : 
              order.deliveryStatus === 'processing' ? 'processing' as const :
              order.deliveryStatus === 'inTransit' ? 'inTransit' as const :
              order.deliveryStatus === 'delivered' ? 'delivered' as const : 'new' as const,
      items: order.items.map((item: any, index: number) => ({
        id: `item-${index}`,
        materialName: item.materialName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
      })),
      totalValue: order.totalAmount,
      supplier: order.supplier,
      expectedDelivery: order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('pl-PL') : undefined,
      currentStage: order.status === 'PENDING' ? 'Oczekuje na przetworzenie' :
                    order.status === 'IN_TRANSIT' ? 'W transporcie' :
                    order.status === 'DELIVERED' ? 'Dostarczone' :
                    'W trakcie kompletowania',
    }));

    // Calculate status counts
    const statusCounts = {
      new: orders.filter((o: any) => o.deliveryStatus === 'pending').length,
      processing: orders.filter((o: any) => o.deliveryStatus === 'processing').length,
      inTransit: orders.filter((o: any) => o.deliveryStatus === 'inTransit').length,
      delivered: orders.filter((o: any) => o.deliveryStatus === 'delivered').length,
    };

    return NextResponse.json({
      orders: transformedOrders,
      totalCount: orders.length,
      statusCounts,
    });
  } catch (error) {
    console.error('Error fetching material orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material orders' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // const session = await getServerSession(authOptions); // Temporarily disabled for client demo
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { projectId } = await params;
    const body = await request.json();

    // Create mock material order
    const order = {
      id: String(Date.now()),
      projectId,
      orderNumber: `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      orderDate: new Date(),
      deliveryDate: body.neededDate ? new Date(body.neededDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      orderedById: 'demo-user',
      orderedBy: {
        name: 'Demo User',
        position: 'Manager'
      },
      status: 'PENDING',
      deliveryStatus: 'pending',
      totalAmount: body.totalAmount,
      notes: body.notes,
      supplier: body.supplier || 'Default Supplier',
      priority: body.priority || 'normal',
      items: body.items.map((item: any) => ({
        materialName: item.materialName || 'Material',
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      })),
    };

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating material order:', error);
    return NextResponse.json(
      { error: 'Failed to create material order' },
      { status: 500 }
    );
  }
}