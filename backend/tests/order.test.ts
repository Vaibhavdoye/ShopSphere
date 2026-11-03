
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

vi.mock('../services/order-service/src/db', () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
  },
}))

import { app } from '../services/order-service/src/server'
import { pool } from '../services/order-service/src/db'

const JWT_SECRET = process.env.JWT_SECRET!

const customerToken = jwt.sign(
  { email: 'customer@test.com', role: 'customer' },
  JWT_SECRET,
  { subject: '10', issuer: 'shopsphere-auth' },
)

const adminToken = jwt.sign(
  { email: 'admin@test.com', role: 'admin' },
  JWT_SECRET,
  { subject: '6', issuer: 'shopsphere-auth' },
)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('ShopSphere Order API', () => {
  it('should return order service health', async () => {
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('running')
  })

  it('should return database health', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ '?column?': 1 }],
      rowCount: 1,
    } as never)

    const res = await request(app).get('/health/db')

    expect(res.status).toBe(200)
    expect(res.body.database).toBe('connected')
  })

  it('should reject order access without a token', async () => {
    const res = await request(app).get('/api/orders')

    expect(res.status).toBe(401)
  })

  it('should reject customer access to all orders', async () => {
    const res = await request(app)
      .get('/api/orders/all')
      .set('Authorization', `Bearer ${customerToken}`)

    expect(res.status).toBe(403)
  })

  it('should reject invalid order items', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [] })

    expect(res.status).toBe(400)
    expect(pool.connect).not.toHaveBeenCalled()
  })

  it('should reject duplicate product IDs', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [
          { productId: 1, quantity: 1 },
          { productId: 1, quantity: 2 },
        ],
      })

    expect(res.status).toBe(400)
    expect(pool.connect).not.toHaveBeenCalled()
  })

  it('should create an order using backend product prices', async () => {
    const client = {
      query: vi.fn(),
      release: vi.fn(),
    }

    client.query
      .mockResolvedValueOnce({ rows: [], rowCount: null }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 }) // User
      .mockResolvedValueOnce({
        rows: [{
          id: 99,
          total_amount: '1499',
          status: 'pending',
          created_at: '2026-11-01T00:00:00.000Z',
        }],
        rowCount: 1,
      }) // Order
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Order item
      .mockResolvedValueOnce({ rows: [], rowCount: null }) // COMMIT

    vi.mocked(pool.connect).mockResolvedValueOnce(client as never)

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ productId: 1, quantity: 1 }],
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.order.totalAmount).toBe(1499)
    expect(client.query).toHaveBeenCalledWith('COMMIT')
    expect(client.release).toHaveBeenCalled()
  })
})
