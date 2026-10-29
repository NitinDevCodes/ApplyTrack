import mongoose from 'mongoose';

// Each warm function instance owns one pool. Concurrent cold requests share
// initialization; a rejected attempt must not poison subsequent requests.
export function createDatabaseConnector(client = mongoose) {
  let pending;
  return function connectDatabase(uri) {
    if (pending) return pending;
    if (client.connection.readyState === 1) return Promise.resolve(client);
    pending = Promise.resolve().then(() => client.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5,
      minPoolSize: 0,
      maxIdleTimeMS: 60000,
    })).finally(() => { pending = undefined; });
    return pending;
  };
}

export const connectDatabase = createDatabaseConnector();
