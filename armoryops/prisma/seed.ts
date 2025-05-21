import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a batch
  const batch = await prisma.batch.create({
    data: {
      status: 'PENDING',
      serializedItems: {
        create: [
          {
            serialNumber: 'SN1001',
            status: 'NOT_STARTED',
            currentStage: null,
          },
          {
            serialNumber: 'SN1002',
            status: 'IN_PROGRESS',
            currentStage: 'Barrel Assembly',
          },
          {
            serialNumber: 'SN1003',
            status: 'COMPLETE',
            currentStage: 'Final Inspection',
          },
        ],
      },
    },
    include: { serializedItems: true },
  })

  console.log('Created batch with items:', batch)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 