const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const patients = await prisma.patient.findMany({
    select: { name: true, phone: true }
  });
  console.log('--- ALL PATIENTS ---');
  console.log(JSON.stringify(patients, null, 2));

  const appointments = await prisma.appointment.findMany({
    include: { patient: true }
  });
  console.log('--- ALL APPOINTMENTS ---');
  appointments.forEach(a => {
    console.log(`Date: ${a.appointmentDate}, Patient: ${a.patient?.name || 'NULL'}`);
  });
}

check();
