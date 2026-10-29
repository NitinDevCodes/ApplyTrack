import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import HttpError from '../utils/HttpError.js';

export const COOKIE_NAME = 'applytrack_session';
export const cookieOptions = config => ({ httpOnly: true, secure: config.production, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
export function authenticate(config) {
  return async (req, res, next) => {
    const token = req.cookies[COOKIE_NAME];
    if (!token) throw new HttpError(401, 'Please sign in to continue.');
    let payload;
    try { payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], issuer: 'applytrack', audience: 'applytrack-web' }); }
    catch { throw new HttpError(401, 'Your session has expired. Please sign in again.'); }
    const user = await User.findById(payload.sub).select('+tokenVersion');
    if (!user || user.tokenVersion !== payload.version) throw new HttpError(401, 'Please sign in again.');
    req.user = user;
    next();
  };
}
export function requireTrustedOrigin(config) {
  return (req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') !== config.clientUrl) return next(new HttpError(403, 'Request origin is not allowed.'));
    next();
  };
}
