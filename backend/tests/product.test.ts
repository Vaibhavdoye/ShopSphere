import { describe, it, expect } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../services/- product-service/src/server'

const JWT_SECRET = process.env.JWT_SECRET!

const adminToken = jwt.sign(
  { email: 'admin@test.com', role: 'admin' },
  JWT_SECRET,
  { subject: '6', issuer: 'shopsphere-auth' },
)

const customerToken = jwt.sign(
  { email: 'customer@test.com', role: 'customer' },
  JWT_SECRET,
  { subject: '10', issuer: 'shopsphere-auth' },
)

describe('ShopSphere Product API', () => {
  it('should return all products', async () => {
    const res = await request(app).get('/api/products')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.products.length).toBeGreaterThan(0)
  })

  it('should return a single product', async () => {
    const res = await request(app).get('/api/products/1')

    expect(res.status).toBe(200)
    expect(res.body.product.name).toBe('Wireless Headphones')
  })

  it('should reject an invalid product ID', async () => {
    const res = await request(app).get('/api/products/abc')

    expect(res.status).toBe(400)
  })

  it('should reject product creation without a token', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Test Product', category: 'Testing', price: 100 })

    expect(res.status).toBe(401)
  })

  it('should reject product creation by a customer', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Test Product', category: 'Testing', price: 100 })

    expect(res.status).toBe(403)
  })

  it('should allow admin to create a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Automated Test Product', category: 'Testing', price: 100 })

    expect(res.status).toBe(201)
    expect(res.body.product.name).toBe('Automated Test Product')
  })

  it('should reject invalid product data', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '', category: 'Testing', price: -10 })

    expect(res.status).toBe(400)
  })
})