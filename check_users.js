const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log('--- ALL USERS ---');
  console.log(JSON.stringify(users, null, 2));
}

check();
