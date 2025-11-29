/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import session from 'express-session'
import SQLiteStore from 'connect-sqlite3'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import votingRoutes from './routes/voting.js'
import auditRoutes from './routes/audit.js'
import electionRoutes from './routes/elections.js'
import bulkImportRoutes from './routes/bulkImport.js'
import adminStatsRoutes from './routes/adminStats.js'
import uploadRoutes from './routes/upload.js'
import organizationRoutes from './routes/organizations.js'
import { connectDatabase } from './config/database.js'
import './models/index.js'
import {
  securityHeaders,
  sanitizeInput,
  csrfProtection,
  generalLimiter,
  authLimiter,
  xssProtection,
  validateInput,
  securityAudit,
  generateCSRFToken
} from './middleware/security.js'


// load env
dotenv.config()

const app: express.Application = express()

// Security headers
app.use(securityHeaders)
app.use(xssProtection)

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://192.168.0.3:5173',
    'http://190.46.57.52:5173',
    'http://190.46.57.52:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}))

// Body parsing with limits
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static('public/uploads'))


// Session configuration
const SQLiteStoreSession = SQLiteStore(session)
app.use(session({
  store: new SQLiteStoreSession({
    dir: './data',
    db: 'sessions.db',
  }),
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict',
  },
  name: 'voting-platform.sid',
}))

// Security middleware
app.use(validateInput)
app.use(sanitizeInput)
app.use(csrfProtection)
app.use(securityAudit)

// Global rate limiting
app.use('/api', generalLimiter)

/**
 * API Routes with specific rate limiting
 */
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/admin', authLimiter, adminRoutes)
app.use('/api/elections', authLimiter, electionRoutes)
app.use('/api/voting', authLimiter, votingRoutes)
app.use('/api/audit', authLimiter, auditRoutes)
app.use('/api/bulk-import', authLimiter, bulkImportRoutes)
app.use('/api/admin/stats', authLimiter, adminStatsRoutes)
app.use('/api/upload', authLimiter, uploadRoutes)
app.use('/api/organizations', authLimiter, organizationRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  generalLimiter,
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    })
  },
)

/**
 * Database connection check
 */
app.use('/api/db-status', async (req: Request, res: Response) => {
  try {
    const connected = await connectDatabase()
    if (connected) {
      res.json({
        success: true,
        message: 'Database connected',
        timestamp: new Date().toISOString(),
      })
    } else {
      res.status(503).json({
        success: false,
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Database status check error:', error)
    res.status(503).json({
      success: false,
      message: 'Database connection error',
      timestamp: new Date().toISOString(),
    })
  }
})

/**
 * CSRF token endpoint
 */
app.get('/api/csrf-token', (req: Request, res: Response) => {
  res.json({
    success: true,
    csrfToken: generateCSRFToken(),
  })
})

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  void _next;
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
  })
})

// Serve static files from the React app
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  // Don't intercept API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
    path: req.path,
    method: req.method,
  })
})

export default app