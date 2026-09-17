const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT migration_name, checksum, finished_at
    FROM "_prisma_migrations"
    WHERE migration_name IN (
      '20260912113959_add_audit_history_foundation',
      '20260913223000_add_git_like_history'
    )
    ORDER BY started_at
  `);

  console.table(rows);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
