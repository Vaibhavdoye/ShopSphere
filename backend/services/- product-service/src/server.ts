import cors from 'cors'

import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

const app = express()
const PORT = Number(process.env.PRODUCT_PORT) || 5001

app.use(helmet())
app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)
app.use(express.json({ limit: '10kb' }))

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

app.get('/api/products', (_req, res) => {
  res.json({ success: true, products })
})

app.get('/api/products/:id', (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ success: false, message: 'Invalid product ID' })
  }

  const product = products.find((item) => item.id === id)

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' })
  }

  return res.json({ success: true, product })
})

app.listen(PORT, () => {
  console.log(`Product Service running at http://localhost:${PORT}`)
})
