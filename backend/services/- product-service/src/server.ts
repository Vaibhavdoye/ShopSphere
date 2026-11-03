import cors from 'cors'
import express, { type Request, type Response, type NextFunction } from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
const app = express()
const PORT = Number(process.env.PRODUCT_PORT) || 5001


const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('Set a valid JWT_SECRET in backend/.env')
}

interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    role: string
  }
}

function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    })
  }

  try {
const payload = jwt.verify(token, JWT_SECRET!, {
      issuer: 'shopsphere-auth',
    })

    if (
      typeof payload === 'string' ||
      !payload.sub ||
      !/^\d+$/.test(payload.sub) ||
      !['customer', 'admin'].includes(String(payload.role))
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      })
    }

    req.user = {
      id: Number(payload.sub),
      email: typeof payload.email === 'string' ? payload.email : '',
      role: String(payload.role),
    }

    return next()
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    })
  }
}

function authorizeAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.',
    })
  }

  return next()
}

app.use(helmet())
app.use(
  cors({
origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8080'],
  }),
)
app.use(express.json({ limit: '10kb' }))
// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now()

  res.on('finish', () => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'product-service',
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
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
)

const products = [
  { id: 1, name: 'Wireless Headphones', category: 'Electronics', price: 1499 },
  { id: 2, name: 'Smart Watch', category: 'Accessories', price: 2199 },
  { id: 3, name: 'Everyday Backpack', category: 'Lifestyle', price: 999 },
  { id: 4, name: 'Running Sneakers', category: 'Fashion', price: 1799 },
]

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'product-service', status: 'running' })
})
app.post(
  '/api/products',
  authenticateToken,
  authorizeAdmin,
  (req: AuthRequest, res: Response) => {
    const { name, category, price } = req.body

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.length > 200 ||
      typeof category !== 'string' ||
      !category.trim() ||
      category.length > 100 ||
      typeof price !== 'number' ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid name, category and positive price are required.',
      })
    }

    const newProduct = {
      id: Math.max(0, ...products.map((item) => item.id)) + 1,
      name: name.trim(),
      category: category.trim(),
      price,
    }

    products.push(newProduct)

    return res.status(201).json({
      success: true,
      product: newProduct,
    })
  },
)


app.get('/api/products', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60')
  res.json({ success: true, products })
})
app.put(
  '/api/products/:id',
  authenticateToken,
  authorizeAdmin,
  (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id)

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      })
    }

    const product = products.find((item) => item.id === id)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      })
    }

    const { name, category, price } = req.body

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.length > 200 ||
      typeof category !== 'string' ||
      !category.trim() ||
      category.length > 100 ||
      typeof price !== 'number' ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid name, category and positive price are required.',
      })
    }

    product.name = name.trim()
    product.category = category.trim()
    product.price = price

    return res.json({
      success: true,
      product,
    })
  },
)

app.get('/api/products/:id', (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ success: false, message: 'Invalid product ID' })
  }

  const product = products.find((item) => item.id === id)

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' })
  }
  res.set('Cache-Control', 'public, max-age=60')
  return res.json({ success: true, product })
})

app.delete(
  '/api/products/:id',
  authenticateToken,
  authorizeAdmin,
  (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id)

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      })
    }

    const index = products.findIndex((item) => item.id === id)

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      })
    }

    const deletedProduct = products.splice(index, 1)[0]

    return res.json({
      success: true,
      message: 'Product deleted successfully.',
      product: deletedProduct,
    })
  },
)

export { app }

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Product Service running at http://localhost:${PORT}`)
  })
}