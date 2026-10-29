import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
if (!process.env.VERCEL) dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });

export function getConfig(env = process.env) {
  const { MONGODB_URI, JWT_SECRET, NODE_ENV = 'development', PORT = '5000', HOST = '127.0.0.1', CLIENT_URL = 'http://127.0.0.1:5173', TRUST_PROXY = '0' } = env;
  if (!MONGODB_URI) throw new Error('MONGODB_URI is missing. Run npm run setup and configure server/.env.');
  if (!/^mongodb(?:\+srv)?:\/\//.test(MONGODB_URI)) throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://; do not include the variable name in its value.');
  if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.startsWith('replace-')) throw new Error('JWT_SECRET must be a unique random secret of at least 32 characters. Run npm run setup.');
  if (!/^\d+$/.test(PORT) || Number(PORT) < 1 || Number(PORT) > 65535) throw new Error('PORT must be between 1 and 65535.');
  if (!/^\d+$/.test(TRUST_PROXY)) throw new Error('TRUST_PROXY must be a nonnegative number of trusted proxy hops.');
  let clientUrl;
  try { clientUrl = new URL(CLIENT_URL); }
  catch { throw new Error('CLIENT_URL must be a valid HTTP(S) origin.'); }
  if (!['http:', 'https:'].includes(clientUrl.protocol) || clientUrl.username || clientUrl.password || clientUrl.pathname !== '/' || clientUrl.search || clientUrl.hash) throw new Error('CLIENT_URL must be an HTTP(S) origin without credentials, a path, query, or fragment.');
  if (NODE_ENV === 'production' && (!env.CLIENT_URL || clientUrl.protocol !== 'https:')) throw new Error('Production requires an explicit HTTPS CLIENT_URL.');
  if (env.VERCEL && NODE_ENV !== 'production') throw new Error('Vercel deployments require NODE_ENV=production for secure session cookies.');
  return { mongoUri: MONGODB_URI, jwtSecret: JWT_SECRET, production: NODE_ENV === 'production', port: Number(PORT), host: HOST, clientUrl: clientUrl.origin, trustProxy: Number(TRUST_PROXY) };
}
