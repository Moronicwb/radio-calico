import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { resolve } from 'path'

const TEST_DB_URL  = 'postgresql://radiocalico:localdev@localhost:5432/radiocalico_test'
const ADMIN_DB_URL = 'postgresql://radiocalico:localdev@localhost:5432/postgres'

export async function setup() {
  const admin = new Pool({ connectionString: ADMIN_DB_URL })
  try {
    await admin.query('CREATE DATABASE radiocalico_test')
  } catch (err: any) {
    if (err.code !== '42P04') throw err // 42P04 = database already exists
  }
  await admin.end()

  const testPool = new Pool({ connectionString: TEST_DB_URL })
  await migrate(drizzle(testPool), { migrationsFolder: resolve('./drizzle') })
  await testPool.end()
}

export async function teardown() {}
