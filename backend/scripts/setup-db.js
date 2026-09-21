const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const schemaFile = isPostgres ? 'prisma/schema.prisma' : 'prisma/schema.sqlite.prisma';

console.log(`\n========================================`);
console.log(`🔧 RentIQ Database Setup Engine`);
console.log(`🎯 Target Database: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);
console.log(`📄 Schema Used: ${schemaFile}`);
console.log(`🔗 Database URL: ${dbUrl}`);
console.log(`========================================\n`);

try {
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`📁 Created uploads directory at ${uploadsDir}`);
  }

  // Push schema
  console.log(`🚀 Pushing database schema...`);
  execSync(`${npxCmd} prisma db push --schema=${schemaFile} --accept-data-loss`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // Generate client
  console.log(`⚡ Generating Prisma Client...`);
  execSync(`${npxCmd} prisma generate --schema=${schemaFile}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // Run seed
  console.log(`🌱 Seeding initial records...`);
  execSync(`node prisma/seed.js`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log(`\n✨ Database setup and seed completed successfully!\n`);
} catch (error) {
  console.error(`\n❌ Error during database setup:`, error.message);
  process.exit(1);
}
