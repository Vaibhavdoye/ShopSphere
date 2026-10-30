
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import 'dotenv/config'

const app = express()
const PORT = Number(process.env.PORT) || 5000

app.use(helmet())
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '10kb' }))

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
)

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'ShopSphere backend is running!',
    service: 'api',
  })
})

app.get('/api/products', (_req, res) => {
  res.json({
    success: true,
    products: [
      { id: 1, name: 'Wireless Headphones', price: 1499 },
      { id: 2, name: 'Smart Watch', price: 2199 },
      { id: 3, name: 'Everyday Backpack', price: 999 },
      { id: 4, name: 'Running Sneakers', price: 1799 },
    ],
  })
})

app.listen(PORT, () => {
  console.log(`ShopSphere API running at http://localhost:${PORT}`)
})
