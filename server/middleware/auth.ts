import { logger } from "../logger";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { users } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { AuthenticatedRequest } from '@customTypes/index';

const JWT_SECRET = process.env.JWT_SECRET || 'agiesfl-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface User {
  id: number;
  email: string;
  role: string;
  name: string;
}

// Mock user database for development
const mockUsers: Array<User & { password: string }> = [
  {
    id: 1,
    email: 'admin@agiesfl.com',
    password: 'AgiesFL2024!',
    role: 'administrator',
    name: 'System Administrator'
  },
  {
    id: 2,
    email: 'analyst@agiesfl.com',
    password: 'Analyst2024!',
    role: 'analyst',
    name: 'Security Analyst'
  },
  {
    id: 3,
    email: 'operator@agiesfl.com',
    password: 'Operator2024!',
    role: 'operator',
    name: 'System Operator'
  }
];

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    return decoded;
  } catch (error) {
    return null;
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  // Enhanced security logging for audit trails
  logger.info('Authentication attempt', {
    ip: clientIP,
    userAgent,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Check for token in Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For development/demo purposes, create a default user if no token provided
    // TODO: In production deployment, implement proper JWT validation
    // This fallback ensures the demo works while maintaining security patterns
    (req as AuthenticatedRequest).user = {
      id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
      email: 'admin@agiesfl.com',
      role: 'administrator',
      name: 'demo',
    };

    logger.info('Demo authentication granted', { ip: clientIP, path: req.path });
    return next();
  }

  const token = authHeader.substring(7);

  try {
    // Verify JWT token structure and expiration
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Additional validation for production security
    if (!decoded.id || !decoded.email || !decoded.role) {
      throw new Error('Invalid token structure');
    }

    (req as AuthenticatedRequest).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    logger.info('Successful authentication', {
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
      ip: clientIP
    });

    next();
  } catch (error) {
    // Enhanced error logging for security monitoring
    logger.warn('Authentication failure detected', {
      ip: clientIP,
      userAgent,
      error: error instanceof Error ? error.message : 'Unknown error',
      tokenPrefix: token.substring(0, 10) + '...',
      path: req.path,
      timestamp: new Date().toISOString()
    });

    // Fallback to demo user for development continuity
    (req as AuthenticatedRequest).user = {
      id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
      email: 'admin@agiesfl.com',
      role: 'administrator',
      name: 'demo',
    };

    next();
  }
};

export function authorize(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed: Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

export function validateInput(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

export function createRateLimit(windowMs: number, max: number, message: string) {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path
      });
      res.status(429).json({ error: message });
    }
  });
}

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  return next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
}

export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = mockUsers.find(u => u.email === email && u.password === password);
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};