import './setup.mjs';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import concurrently from 'concurrently';
import { mongoBinaryOptions } from './mongo-options.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dbPath = fileURLToPath(new URL('../.local-data/mongodb', import.meta.url));
await mkdir(dbPath, { recursive: true });
const binary = mongoBinaryOptions();
console.log(binary.systemBinary ? 'Starting an installed MongoDB executable with ApplyTrack-only local data.' : 'Starting local MongoDB (first run downloads the official binary into .cache).');
const mongo = await MongoMemoryServer.create({ binary, instance: { ip: '127.0.0.1', port: 27018, dbPath, storageEngine: 'wiredTiger', dbName: 'applytrack' } });
const { result, commands } = concurrently([
  { command: 'npm run dev -w server', name: 'API', prefixColor: 'cyan', env: { MONGODB_URI: mongo.getUri('applytrack') } },
  { command: 'npm run dev -w client', name: 'WEB', prefixColor: 'green' },
], { cwd: root, killOthersOn: ['failure', 'success'] });
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  commands.forEach(command => command.kill('SIGTERM'));
  await mongo.stop({ doCleanup: false });
}
process.on('SIGINT', stop); process.on('SIGTERM', stop);
try { await result; } catch { process.exitCode = 1; } finally { await stop(); }
