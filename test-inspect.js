const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const candidates = await prisma.candidate.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("CANDIDATES:");
  console.dir(candidates, { depth: null });

  const appointments = await prisma.appointment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("APPOINTMENTS:");
  console.dir(appointments, { depth: null });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
