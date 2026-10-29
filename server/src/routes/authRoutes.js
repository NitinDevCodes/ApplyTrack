import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, registerSchema, loginSchema } from '../utils/validation.js';

export default function authRoutes(config) {
  const router = Router();
  const controller = authController(config);
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many sign-in attempts. Please try again in 15 minutes.' } });
  router.post('/register', limiter, validate(registerSchema), controller.register);
  router.post('/login', limiter, validate(loginSchema), controller.login);
  router.get('/me', authenticate(config), controller.me);
  router.post('/logout', authenticate(config), controller.logout);
  return router;
}
