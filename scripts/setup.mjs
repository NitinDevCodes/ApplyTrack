import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const target = fileURLToPath(new URL('../server/.env', import.meta.url));
if (existsSync(target)) {
  console.log('server/.env already exists; kept your configuration.');
} else {
  const example = readFileSync(new URL('../server/.env.example', import.meta.url), 'utf8');
  writeFileSync(target, example.replace('replace-with-a-random-secret-of-at-least-32-characters', randomBytes(48).toString('hex')));
  console.log('Created server/.env with a unique random JWT secret. Set MONGODB_URI for your database, or run npm run dev:local.');
}
