import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/authRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import { dashboard } from './controllers/applicationController.js';
import { authenticate, requireTrustedOrigin } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import HttpError from './utils/HttpError.js';

export function createApp(config, { serveFrontend = true, connectDatabase } = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);
  app.use(helmet({ strictTransportSecurity: config.production ? undefined : false, contentSecurityPolicy: config.production ? undefined : false }));
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());
  app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many requests. Please try again shortly.' } }));
  app.use('/api', requireTrustedOrigin(config));
  if (connectDatabase) app.use('/api', async (req, res, next) => {
    try { await connectDatabase(config.mongoUri); }
    catch { throw new HttpError(503, 'Service temporarily unavailable.'); }
    next();
  });
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes(config));
  app.use('/api/applications', authenticate(config), applicationRoutes);
  app.get('/api/dashboard', authenticate(config), dashboard);
  app.use('/api', notFound);
  const dist = fileURLToPath(new URL('../../client/dist/', import.meta.url));
  if (serveFrontend && config.production && existsSync(dist)) {
    app.use(express.static(dist));
    app.get('/{*path}', (req, res) => res.sendFile(`${dist}/index.html`));
  }
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
