import mongoose from 'mongoose';
import { getConfig } from './config.js';
import { createApp } from './app.js';
import { connectDatabase } from './database.js';

try {
  const config = getConfig();
  await connectDatabase(config.mongoUri);
  const server = createApp(config).listen(config.port, config.host, () => console.log(`ApplyTrack API ready at http://${config.host}:${config.port}`));
  server.on('error', error => { console.error(`Server could not start: ${error.code}`); process.exit(1); });
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    server.close(async () => { await mongoose.disconnect(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
} catch (error) {
  console.error(error.name === 'MongooseServerSelectionError' ? 'Cannot connect to MongoDB. Check MONGODB_URI, start MongoDB, or use npm run dev:local.' : error.message);
  process.exit(1);
}
