import { afterAll, beforeEach } from 'vitest'
import { pool } from '../../server.js'

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE ratings')
})

afterAll(async () => {
  await pool.end()
})
