import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import 'dotenv/config'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('Set a JWT_SECRET of at least 32 characters in backend/.env')
}

export interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    role: string
  }
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
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

    if (
      typeof payload === 'string' ||
      !payload.sub ||
      !/^\d+$/.test(payload.sub)
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      })
    }

    req.user = {
      id: Number(payload.sub),
      email: typeof payload.email === 'string' ? payload.email : '',
      role: typeof payload.role === 'string' ? payload.role : 'customer',
    }

    return next()
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    })
  }
}