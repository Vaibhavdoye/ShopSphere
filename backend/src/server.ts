
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import 'dotenv/config'
import gatewayRouter from './gateway/gateway.js'

const app = express()
const PORT = Number(process.env.PORT) || 5000

let totalRequests = 0

app.use(helmet())
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8080'] }))
app.use(express.json({ limit: '10kb' }))
// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now()

totalRequests++

  res.on('finish', () => {
    const responseTime = Date.now() - startTime

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
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

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'ShopSphere backend is running!',
    service: 'api',
  })
})

app.get('/api/metrics', (_req, res) => {
  const memory = process.memoryUsage()

  res.json({
    service: 'api-gateway',
    totalRequests,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsage: {
      rssMB: Math.round(memory.rss / 1024 / 1024),
      heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  })
})

// API Gateway routes
app.use('/api', gatewayRouter)

app.listen(PORT, () => {
  console.log(`ShopSphere API running at http://localhost:${PORT}`)
})
