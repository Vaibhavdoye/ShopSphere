import express from 'express'
import {
  createProxyMiddleware,
  fixRequestBody,
} from 'http-proxy-middleware'

const router = express.Router()

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || 'http://localhost:5002'

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || 'http://localhost:5001'

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || 'http://localhost:5003'

// Authentication Service
router.use(
  '/auth',
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/api/auth${path}`,
    on: {
      proxyReq: fixRequestBody,
    },
  }),
)

// Product Service
router.use(
  '/products',
  createProxyMiddleware({
    target: PRODUCT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/api/products${path}`,
    on: {
      proxyReq: fixRequestBody,
    },
  }),
)

// Order Service
router.use(
  '/orders',
  createProxyMiddleware({
    target: ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/api/orders${path}`,
    on: {
      proxyReq: fixRequestBody,
    },
  }),
)

export default router