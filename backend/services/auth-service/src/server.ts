
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import { pool } from './db'

export const app = express()
const PORT = Number(process.env.AUTH_PORT) || 5002
const JWT_SECRET = process.env.JWT_SECRET


if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('Set a JWT_SECRET of at least 32 characters in backend/.env')
}

app.use(helmet())

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8080'] }))
app.use(express.json({ limit: '10kb' }))
// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now()

  res.on('finish', () => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'auth-service',
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${Date.now() - startTime}ms`,
      }),
    )
  })

  next()
})
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
)

type User = {
  id: number
  name: string
  email: string
  passwordHash: string
  role: 'customer' | 'admin'
}

const users: User[] = []
let nextId = 1
console.log('Auth Service JWT secret loaded:', Boolean(JWT_SECRET))
function createToken(user: User) {
  return jwt.sign(
{ sub: String(user.id), email: user.email, role: user.role },
    JWT_SECRET!,
    { expiresIn: '1h', issuer: 'shopsphere-auth' },
  )
}

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'auth-service', status: 'running' })
})
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body ?? {}

  if (
    typeof name !== 'string' ||
    name.trim().length < 2 ||
    name.trim().length > 80 ||
    typeof email !== 'string' ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 72
  ) {
    return res.status(400).json({
      success: false,
      message: 'Enter a valid name, email, and password (8–72 characters).',
    })
  }

  const normalizedEmail = email.trim().toLowerCase()

  try {
    const passwordHash = await bcrypt.hash(password, 12)

    const result = await pool.query(
     `INSERT INTO users (name, email, password_hash)
 VALUES ($1, $2, $3)
 RETURNING id, name, email, password_hash, role`,
      [name.trim(), normalizedEmail, passwordHash],
    )

    const row = result.rows[0]
const user: User = {
  id: Number(row.id),
  name: row.name,
  email: row.email,
  passwordHash: row.password_hash,
  role: row.role,
}


    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      user: { id: user.id, name: user.name, email: user.email },
      token: createToken(user),
    })
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    console.error('Registration failed:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to register right now.',
    })
  }
})


app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {}

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    email.trim().length === 0 ||
    email.length > 254 ||
    password.length > 72
  ) {
    return res.status(400).json({
      success: false,
      message: 'Valid email and password are required.',
    })
  }

  const normalizedEmail = email.trim().toLowerCase()

  try {
    const result = await pool.query(
     `SELECT id, name, email, password_hash, role
      FROM users
      WHERE email = $1`,
      [normalizedEmail],
    )

    const row = result.rows[0]

    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

  const user: User = {
  id: Number(row.id),
  name: row.name,
  email: row.email,
  passwordHash: row.password_hash,
  role: row.role,
}

    return res.json({
      success: true,
      message: 'Login successful.',
      user: { id: user.id, name: user.name, email: user.email },
      token: createToken(user),
    })
  } catch (error) {
    console.error('Login failed:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to login right now.',
    })
  }
})

app.get('/api/auth/me', async (req, res) => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required.',
    })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET!, {
      issuer: 'shopsphere-auth',
    })

    if (typeof payload === 'string' || !payload.sub) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      })
    }

    const result = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE id = $1`,
      [payload.sub],
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
      })
    }

    return res.json({
      success: true,
      user: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      })
    }

    console.error('Auth check failed:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to verify user right now.',
    })
  }
})

app.get('/health/db', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    return res.json({
      success: true,
      database: 'connected',
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    return res.status(503).json({
      success: false,
      database: 'disconnected',
    })
  }
})

if (require.main === module) {
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auth Service running at http://localhost:${PORT}`)
  })
}