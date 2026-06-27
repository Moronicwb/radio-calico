const { Pool } = require('pg')
const { drizzle } = require('drizzle-orm/node-postgres')
const { migrate } = require('drizzle-orm/node-postgres/migrator')
const { resolve } = require('path')

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)
  await migrate(db, { migrationsFolder: resolve(__dirname, '../drizzle') })
  await pool.end()
}

main()
  .then(() => console.log('Migrations applied'))
  .catch(err => { console.error('Migration failed:', err); process.exit(1) })
