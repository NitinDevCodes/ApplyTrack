import { createApp } from './app.js';
import { getConfig } from './config.js';
import { connectDatabase } from './database.js';

export function createServerlessHandler({ loadConfig = getConfig, connect = connectDatabase } = {}) {
  let app;
  return function handler(req, res) {
    if (!app) {
      try {
        app = createApp(loadConfig(), { serveFrontend: false, connectDatabase: connect });
      } catch {
        // Never log connection strings, secrets, or raw configuration errors.
        console.error('API configuration is invalid. Check the deployment environment variables.');
        res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ message: 'Service temporarily unavailable.' }));
        return;
      }
    }
    return app(req, res);
  };
}

export default createServerlessHandler();
