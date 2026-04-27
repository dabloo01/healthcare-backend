const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Clinical Data for all Patients...');

  const patients = await prisma.patient.findMany();
  const doctors = await prisma.doctor.findMany();

  if (doctors.length === 0) {
    console.log('No doctors found. Run initial seed first.');
    return;
  }

  // Find or Create "Raj"
  let raj = await prisma.patient.findFirst({ where: { name: { contains: 'Raj' } } });
  if (!raj) {
    raj = await prisma.patient.create({
      data: { name: 'Raj Kumar', email: 'raj@example.com', phone: '9988112233', age: 28, gender: 'Male', address: 'Bandra, Mumbai' }
    });
  }

  // 1. Add some Appointments for Raj
  const rajAppt = await prisma.appointment.create({
    data: {
      appointmentDate: new Date(),
      status: 'Scheduled',
      reason: 'Fever and Cough',
      patientId: raj.id,
      doctorId: doctors[0].id
    }
  });

  // 2. Add Prescription for Raj
  await prisma.prescription.create({
    data: {
      medications: 'Dolo 650mg (1-1-1), Azithromycin 500mg (1-0-0)',
      instructions: 'Take for 3 days. Complete the antibiotic course.',
      appointmentId: rajAppt.id,
      patientId: raj.id,
      doctorId: doctors[0].id
    }
  });

  // 3. Add Lab Report for Raj
  await prisma.labReport.create({
    data: {
      testName: 'COVID-19 RT-PCR',
      result: 'Negative',
      status: 'Completed',
      patientId: raj.id
    }
  });

  // 4. Add data for other patients too
  for (const p of patients) {
    if (p.id === raj.id) continue;

    // Random Lab Report
    await prisma.labReport.create({
      data: {
        testName: 'Blood Sugar Test',
        result: 'Fasting: 95 mg/dL (Normal)',
        status: 'Completed',
        patientId: p.id
      }
    }).catch(() => {});
  }

  console.log('Clinical Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
