import { Pool } from 'pg'

const sslEnabled = process.env.DB_SSL === 'true'

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'shopsphere',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'shopsphere',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ...(sslEnabled && {
    ssl: {
      rejectUnauthorized: true,
    },
  }),
})

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message)
})