
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../services/auth-service/src/server'

describe('ShopSphere Auth API', () => {
  it('should return success from the database health endpoint', async () => {
    const response = await request(app).get('/health/db')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.database).toBe('connected')
  })

  it('should reject registration with an invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'invalid-email',
        password: 'TestPass123!',
      })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })

  it('should reject registration with a short password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
      })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })

  it('should reject /api/auth/me when no token is provided', async () => {
    const response = await request(app).get('/api/auth/me')

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
    expect(response.body.message).toBe('Authentication token required.')
  })

  
  it('should register a user, login, and verify the JWT token', async () => {
    const email = `test.${Date.now()}@example.com`
    const password = 'TestPass123!'

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Integration Test User',
        email,
        password,
      })

    expect(registerResponse.status).toBe(201)
    expect(registerResponse.body.success).toBe(true)
    expect(registerResponse.body.token).toBeTruthy()

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password,
      })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.success).toBe(true)
    expect(loginResponse.body.token).toBeTruthy()

    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)

    expect(meResponse.status).toBe(200)
    expect(meResponse.body.success).toBe(true)
    expect(meResponse.body.user.email).toBe(email)
    expect(meResponse.body.user.name).toBe('Integration Test User')
  })

  it('should reject login with an incorrect password', async () => {
    const email = `wrong-password.${Date.now()}@example.com`

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Wrong Password Test',
        email,
        password: 'CorrectPass123!',
      })

    expect(registerResponse.status).toBe(201)

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password: 'WrongPass123!',
      })

    expect(loginResponse.status).toBe(401)
    expect(loginResponse.body.success).toBe(false)
    expect(loginResponse.body.message).toBe(
      'Invalid email or password.',
    )
  })

})
