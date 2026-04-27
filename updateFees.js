const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.doctor.findMany();
  
  // Possible fee list
  const fees = [500, 800, 1000, 1200, 1500, 2000, 2500];
  
  console.log(`Found ${doctors.length} doctors. Updating fees...`);

  for (const doc of doctors) {
    // Pick deterministic but varied fee based on ID logic
    const newFee = fees[(doc.id * 3) % fees.length];
    
    await prisma.doctor.update({
      where: { id: doc.id },
      data: { consultationFee: newFee }
    });
    console.log(`Updated Dr. ${doc.name} (${doc.specialty}) -> ₹${newFee}`);
  }
  
  console.log('Finished updating doctor fees.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
