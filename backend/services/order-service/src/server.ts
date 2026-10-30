import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import 'dotenv/config'
import { pool } from './db'
import { authenticateToken, type AuthRequest } from './auth'
import { products } from './products'

export const app = express()

const PORT = Number(process.env.ORDER_PORT) || 5003

app.use(helmet())
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '10kb' }))

// Service health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'order-service',
    status: 'running',
  })
})

// Database health check
app.get('/health/db', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ success: true, database: 'connected' })
  } catch (error) {
    console.error('Order Service DB health check failed:', error)
    res.status(503).json({
      success: false,
      database: 'disconnected',
    })
  }
})

// Create an order
app.post('/api/orders', authenticateToken, async (req, res) => {
  const userId = (req as AuthRequest).user?.id

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    })
  }

  const { items } = req.body

  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 50
  ) {
    return res.status(400).json({
      success: false,
      message: 'Provide between 1 and 50 order items.',
    })
  }

  const seen = new Set<number>()

  for (const item of items) {
    if (
      !Number.isSafeInteger(item?.productId) ||
      !Number.isSafeInteger(item?.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99 ||
      seen.has(item.productId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid items or duplicate product IDs.',
      })
    }

    seen.add(item.productId)
  }

  // Prices come from the backend catalog, not the client.
  const orderItems = []

  for (const item of items) {
    const product = products.find(
      (p) => p.id === item.productId,
    )

    if (!product) {
      return res.status(400).json({
        success: false,
        message: `Product ${item.productId} was not found.`,
      })
    }

    orderItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
    })
  }

  const totalAmount = orderItems.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  )

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Confirm the authenticated user still exists.
    const userResult = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [userId],
    )

    if (userResult.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(401).json({
        success: false,
        message: 'User account was not found.',
      })
    }

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, status)
       VALUES ($1, $2, $3)
       RETURNING id, total_amount, status, created_at`,
      [userId, totalAmount, 'pending'],
    )

    const order = orderResult.rows[0]

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items
          (order_id, product_id, product_name, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          order.id,
          item.productId,
          item.productName,
          item.quantity,
          item.unitPrice,
        ],
      )
    }

    await client.query('COMMIT')

    return res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      order: {
        id: order.id,
        totalAmount: Number(order.total_amount),
        status: order.status,
        createdAt: order.created_at,
        items: orderItems,
      },
    })
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error('Order rollback failed:', rollbackError)
    }

    console.error('Create order error:', error)

    return res.status(500).json({
      success: false,
      message: 'Unable to create order.',
    })
  } finally {
    client.release()
  }
})

app.get('/api/orders', authenticateToken, async (req, res) => {
  const userId = (req as AuthRequest).user?.id

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    })
  }

  try {
    const result = await pool.query(
      `SELECT
         o.id,
         o.total_amount,
         o.status,
         o.created_at,
         COALESCE(
           json_agg(
             json_build_object(
               'productId', oi.product_id,
               'productName', oi.product_name,
               'quantity', oi.quantity,
               'unitPrice', oi.unit_price
             )
             ORDER BY oi.id
           ) FILTER (WHERE oi.id IS NOT NULL),
           '[]'::json
         ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId],
    )

    return res.json({
      success: true,
      orders: result.rows.map((order) => ({
        id: order.id,
        totalAmount: Number(order.total_amount),
        status: order.status,
        createdAt: order.created_at,
        items: order.items,
      })),
    })
  } catch (error) {
    console.error('Fetch orders error:', error)
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch orders.',
    })
  }
})

// Start the service
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Order Service running at http://localhost:${PORT}`)
  })
}