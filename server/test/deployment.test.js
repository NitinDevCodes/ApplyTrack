import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createDatabaseConnector } from '../src/database.js';
import { getConfig } from '../src/config.js';
import { createServerlessHandler } from '../src/serverless.js';

const environment = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017/test-only',
  JWT_SECRET: 'test-only-secret-at-least-32-characters',
  NODE_ENV: 'production', CLIENT_URL: 'https://applytrack.example', TRUST_PROXY: '1', VERCEL: '1',
};

test('concurrent cold requests share one connection and warm requests reuse it', async () => {
  let calls = 0;
  let resolve;
  const client = { connection: { readyState: 0 }, connect() {
    calls++;
    return new Promise(done => { resolve = () => { client.connection.readyState = 1; done(client); }; });
  } };
  const connect = createDatabaseConnector(client);
  const first = connect(environment.MONGODB_URI);
  const second = connect(environment.MONGODB_URI);
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(calls, 1);
  resolve();
  await Promise.all([first, second]);
  assert.equal(await connect(environment.MONGODB_URI), client);
  assert.equal(calls, 1);
});

test('failed initialization can retry and a closed connection can reopen', async () => {
  let calls = 0;
  const client = { connection: { readyState: 0 }, async connect() {
    if (++calls === 1) throw new Error('Temporary connection failure');
    client.connection.readyState = 1;
    return client;
  } };
  const connect = createDatabaseConnector(client);
  await assert.rejects(connect(environment.MONGODB_URI));
  await connect(environment.MONGODB_URI);
  assert.equal(calls, 2);
  client.connection.readyState = 0;
  await connect(environment.MONGODB_URI);
  assert.equal(calls, 3);
});

test('production configuration requires explicit HTTPS origin and valid MongoDB scheme', () => {
  assert.equal(getConfig(environment).clientUrl, environment.CLIENT_URL);
  assert.equal(getConfig({ ...environment, CLIENT_URL: environment.CLIENT_URL + '/' }).clientUrl, environment.CLIENT_URL);
  for (const CLIENT_URL of [undefined, 'http://applytrack.example', 'https://applytrack.example/api', 'https://user:pass@applytrack.example', 'https://applytrack.example?other=1']) {
    assert.throws(() => getConfig({ ...environment, CLIENT_URL }), /CLIENT_URL/);
  }
  assert.throws(() => getConfig({ ...environment, NODE_ENV: 'development' }), /NODE_ENV/);
  assert.throws(() => getConfig({ ...environment, MONGODB_URI: 'MONGODB_URI=' + environment.MONGODB_URI }), /MONGODB_URI/);
  assert.equal(getConfig({ MONGODB_URI: environment.MONGODB_URI, JWT_SECRET: environment.JWT_SECRET }).clientUrl, 'http://127.0.0.1:5173');
});

test('serverless DB failure returns uncached JSON, retries, and keeps CSRF/body limits', async () => {
  let calls = 0;
  const handler = createServerlessHandler({ loadConfig: () => getConfig(environment), connect: async () => {
    if (++calls === 1) throw new Error('sensitive-database-details');
  } });
  const failure = await request(handler).get('/api/health').expect(503).expect('Cache-Control', 'no-store');
  assert.doesNotMatch(failure.text, /sensitive-database-details/);
  await request(handler).get('/api/health').expect(200);
  assert.equal(calls, 2);
  await request(handler).post('/api/auth/login').set('Origin', 'https://evil.example').send({}).expect(403);
  await request(handler).post('/api/auth/login').send({}).expect(403);
  await request(handler).post('/api/auth/login').set('Origin', environment.CLIENT_URL).send({ password: 'x'.repeat(40000) }).expect(413);
  assert.equal(calls, 2);
  await request(handler).get('/api/not-a-route').expect(404).expect('Content-Type', /json/);
  await request(handler).get('/applications').expect(404).expect('Content-Type', /json/);
});

test('configuration failure does not leak values or permanently poison the handler', async () => {
  let calls = 0;
  const handler = createServerlessHandler({ loadConfig: () => {
    if (++calls === 1) throw new Error('sensitive-configuration');
    return getConfig(environment);
  }, connect: async () => {} });
  const response = await request(handler).get('/api/health').expect(503).expect('Cache-Control', 'no-store');
  assert.doesNotMatch(response.text, /sensitive-configuration/);
  await request(handler).get('/api/health').expect(200);
});
