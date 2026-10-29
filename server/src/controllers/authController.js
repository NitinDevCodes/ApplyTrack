import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import HttpError from '../utils/HttpError.js';
import { COOKIE_NAME, cookieOptions } from '../middleware/auth.js';

const publicUser = user => ({ id: user.id, name: user.name, email: user.email });
function createSession(res, user, config) {
  const token = jwt.sign({ version: user.tokenVersion ?? 0 }, config.jwtSecret, { subject: user.id, expiresIn: '7d', algorithm: 'HS256', issuer: 'applytrack', audience: 'applytrack-web' });
  res.cookie(COOKIE_NAME, token, cookieOptions(config));
}
export function authController(config) {
  return {
    register: async (req, res) => {
      const { name, email, password } = req.validated;
      const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
      createSession(res, user, config);
      res.status(201).json({ user: publicUser(user) });
    },
    login: async (req, res) => {
      const { email, password } = req.validated;
      const user = await User.findOne({ email }).select('+password +tokenVersion');
      if (!user || !await bcrypt.compare(password, user.password)) throw new HttpError(401, 'Email or password is incorrect.');
      createSession(res, user, config);
      res.json({ user: publicUser(user) });
    },
    me: (req, res) => res.json({ user: publicUser(req.user) }),
    logout: async (req, res) => {
      await User.updateOne({ _id: req.user.id }, { $inc: { tokenVersion: 1 } });
      const { maxAge, ...options } = cookieOptions(config);
      res.clearCookie(COOKIE_NAME, options);
      res.status(204).end();
    },
  };
}
