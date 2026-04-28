const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedBeds() {
  const beds = [
    // General Ward
    { bedNumber: 'G-101', ward: 'General' },
    { bedNumber: 'G-102', ward: 'General' },
    { bedNumber: 'G-103', ward: 'General' },
    { bedNumber: 'G-104', ward: 'General' },
    { bedNumber: 'G-105', ward: 'General' },
    // Private Rooms
    { bedNumber: 'P-201', ward: 'Private' },
    { bedNumber: 'P-202', ward: 'Private' },
    { bedNumber: 'P-203', ward: 'Private' },
    // ICU
    { bedNumber: 'ICU-01', ward: 'ICU' },
    { bedNumber: 'ICU-02', ward: 'ICU' },
    { bedNumber: 'ICU-03', ward: 'ICU' },
    // Emergency
    { bedNumber: 'EM-01', ward: 'Emergency' },
    { bedNumber: 'EM-02', ward: 'Emergency' },
  ];

  console.log('Seeding beds...');
  for (const bed of beds) {
    await prisma.bed.upsert({
      where: { id: 0 },
      update: {},
      create: bed,
    }).catch(async () => {
      // If upsert fails, just create
      await prisma.bed.create({ data: bed });
    });
  }
  console.log(`✅ ${beds.length} beds seeded successfully!`);
  await prisma.$disconnect();
}

seedBeds().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
