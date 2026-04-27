const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Specific Data for dr.dr.ramesh...');

  // 1. Create/Find the Doctor with the exact name/email from login
  let doctor = await prisma.doctor.findFirst({ where: { name: 'dr.dr.ramesh' } });
  if (!doctor) {
    doctor = await prisma.doctor.create({
      data: { name: 'dr.dr.ramesh', email: 'dr.ramesh@example.com', specialty: 'Cardiology', phone: '9988776655' }
    });
  }

  // 2. Find some patients
  const patients = await prisma.patient.findMany({ take: 3 });

  if (patients.length < 3) {
    console.log('Not enough patients. Run initial seed.');
    return;
  }

  // 3. Create Appointments for this specific doctor
  for (let i = 0; i < 3; i++) {
    await prisma.appointment.create({
      data: {
        appointmentDate: new Date(),
        status: 'Scheduled',
        reason: i === 0 ? 'Regular Checkup' : i === 1 ? 'High Blood Pressure' : 'Chest Pain',
        patientId: patients[i].id,
        doctorId: doctor.id
      }
    });
  }

  console.log('Seeding for dr.dr.ramesh finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
