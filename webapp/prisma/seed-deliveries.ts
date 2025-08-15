import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Get first project and user
    const project = await prisma.project.findFirst({
      where: { isActive: true }
    })
    
    const user = await prisma.user.findFirst({
      where: { isActive: true }
    })
    
    if (!project || !user) {
      console.error('No active project or user found')
      return
    }

    // Get some materials
    const materials = await prisma.material.findMany({
      take: 5
    })

    if (materials.length === 0) {
      console.error('No materials found')
      return
    }

    console.log(`Creating deliveries for project: ${project.name}`)

    // Create sample deliveries
    const deliveries = [
      {
        projectId: project.id,
        supplierName: 'BuildSupply Co.',
        deliveryDate: new Date('2024-04-15T10:00:00'),
        receivedById: user.id,
        status: 'ACCEPTED' as const,
        deliveryType: 'PALLET',
        totalWeight: 1500,
        notes: 'Cement delivery - 30 bags on pallets',
      },
      {
        projectId: project.id,
        supplierName: 'Steel Solutions Ltd.',
        deliveryDate: new Date('2024-04-16T14:30:00'),
        receivedById: user.id,
        status: 'QUALITY_CHECK' as const,
        deliveryType: 'BULK',
        totalWeight: 3200,
        notes: 'Steel rebar delivery - quality inspection in progress',
      },
      {
        projectId: project.id,
        supplierName: 'Express Materials',
        deliveryDate: new Date('2024-04-18T09:00:00'),
        receivedById: user.id,
        status: 'PENDING' as const,
        deliveryType: 'PACKAGE',
        totalWeight: 250,
        notes: 'Small tools and accessories',
      },
      {
        projectId: project.id,
        supplierName: 'Concrete Masters',
        deliveryDate: new Date('2024-04-20T11:00:00'),
        receivedById: user.id,
        status: 'PENDING' as const,
        deliveryType: 'BULK',
        totalWeight: 8500,
        notes: 'Ready-mix concrete delivery scheduled',
      },
      {
        projectId: project.id,
        supplierName: 'Window World',
        deliveryDate: new Date('2024-04-14T13:00:00'),
        receivedById: user.id,
        status: 'ACCEPTED' as const,
        deliveryType: 'OVERSIZED',
        totalWeight: 1800,
        notes: 'Window frames and glass panels',
      },
      {
        projectId: project.id,
        supplierName: 'Insulation Pro',
        deliveryDate: new Date('2024-04-13T08:30:00'),
        receivedById: user.id,
        status: 'REJECTED' as const,
        deliveryType: 'PALLET',
        totalWeight: 450,
        notes: 'Insulation materials - damaged during transport',
      },
      {
        projectId: project.id,
        supplierName: 'BuildSupply Co.',
        deliveryDate: new Date('2024-04-17T15:00:00'),
        receivedById: user.id,
        status: 'RECEIVED' as const,
        deliveryType: 'MIXED',
        totalWeight: 2200,
        notes: 'Mixed materials delivery - tiles, adhesive, grout',
      }
    ]

    for (const deliveryData of deliveries) {
      const delivery = await prisma.delivery.create({
        data: deliveryData
      })

      // Add random items to each delivery
      const itemCount = Math.floor(Math.random() * 3) + 1
      for (let i = 0; i < itemCount && i < materials.length; i++) {
        const material = materials[i]
        const orderedQty = Math.floor(Math.random() * 100) + 10
        const deliveredQty = deliveryData.status === 'REJECTED' ? 0 : 
                           deliveryData.status === 'PENDING' ? 0 : 
                           orderedQty - Math.floor(Math.random() * 5)

        await prisma.deliveryItem.create({
          data: {
            deliveryId: delivery.id,
            materialId: material.id,
            orderedQuantity: orderedQty,
            deliveredQuantity: deliveredQty,
            qualityStatus: deliveryData.status === 'ACCEPTED' ? 'APPROVED' :
                          deliveryData.status === 'REJECTED' ? 'REJECTED' :
                          deliveryData.status === 'QUALITY_CHECK' ? 'PENDING' :
                          null,
            notes: deliveryData.status === 'REJECTED' ? 'Material damaged' : null
          }
        })
      }

      console.log(`Created delivery: ${delivery.supplierName} - ${delivery.status}`)
    }

    console.log('✅ Deliveries seeded successfully')
  } catch (error) {
    console.error('Error seeding deliveries:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()