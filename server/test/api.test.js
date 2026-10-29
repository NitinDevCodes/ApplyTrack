import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import request from 'supertest';
import { createApp } from '../src/app.js';
import User from '../src/models/User.js';
import Application from '../src/models/Application.js';
import { mongoBinaryOptions } from '../../scripts/mongo-options.mjs';
import vercelHandler from '../../api/index.js';

const origin = 'http://127.0.0.1:5173';
const config = { jwtSecret: randomBytes(48).toString('hex'), clientUrl: origin, production: false, trustProxy: 0 };
const app = createApp(config);
const alice = request.agent(app);
const bob = request.agent(app);
const credentials = { name: 'Alice Tester', email: 'alice@example.com', password: 'A-unique-passphrase-2026' };
const sample = { company: 'Northstar', jobTitle: 'Frontend Intern', jobType: 'Internship', location: 'Remote', applicationUrl: 'https://example.com/careers', salary: '₹25,000/month', applicationDate: new Date().toISOString().slice(0, 10), interviewDate: null, status: 'Applied', notes: 'Prepare a React project walkthrough.' };
let mongo;
let applicationId;
let oldCookie;
before(async () => {
  const dbPath = fileURLToPath(new URL(`../../.cache/test-db-${randomBytes(8).toString('hex')}`, import.meta.url));
  await mkdir(dbPath, { recursive: true });
  mongo = await MongoMemoryServer.create({ binary: mongoBinaryOptions(), instance: { dbPath, storageEngine: 'wiredTiger' } });
  await mongoose.connect(mongo.getUri());
  await Promise.all([User.init(), Application.init()]);
}, { timeout: 600000 });
after(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });

test('protected routes reject unauthenticated requests', async () => {
  for (const path of ['/api/auth/me', '/api/applications', '/api/dashboard']) await request(app).get(path).expect(401);
});
test('registration validates input, hashes passwords, and sets an HTTP-only cookie', async () => {
  await request(app).post('/api/auth/register').set('Origin', origin).send({ name: 'A', email: 'bad-email', password: 'short' }).expect(400);
  const response = await alice.post('/api/auth/register').set('Origin', origin).send(credentials).expect(201);
  assert.equal(response.body.user.email, credentials.email);
  assert.equal(response.body.user.password, undefined);
  assert.match(response.headers['set-cookie'][0], /HttpOnly/);
  assert.match(response.headers['set-cookie'][0], /SameSite=Lax/);
  oldCookie = response.headers['set-cookie'][0].split(';')[0];
  const stored = await User.findOne({ email: credentials.email }).select('+password');
  assert.notEqual(stored.password, credentials.password);
  assert.match(stored.password, /^\$2[ab]\$12\$/);
  await alice.get('/api/auth/me').expect(200);
  await request(app).post('/api/auth/register').set('Origin', origin).send(credentials).expect(409);
});
test('login rejects incorrect credentials and accepts correct credentials', async () => {
  await request(app).post('/api/auth/login').set('Origin', origin).send({ email: credentials.email, password: 'wrong' }).expect(401);
  const response = await alice.post('/api/auth/login').set('Origin', origin).send({ email: ` ${credentials.email.toUpperCase()} `, password: credentials.password }).expect(200);
  assert.equal(response.body.user.name, credentials.name);
});
test('creates and reads a complete application', async () => {
  const response = await alice.post('/api/applications').set('Origin', origin).send(sample).expect(201);
  applicationId = response.body.application._id;
  assert.equal(response.body.application.company, sample.company);
  const detail = await alice.get(`/api/applications/${applicationId}`).expect(200);
  assert.equal(detail.body.application.notes, sample.notes);
  assert.equal(detail.body.application.salary, sample.salary);
});
test('users cannot list, read, edit, delete, or aggregate another user’s applications', async () => {
  await bob.post('/api/auth/register').set('Origin', origin).send({ ...credentials, name: 'Bob Tester', email: 'bob@example.com' }).expect(201);
  const list = await bob.get('/api/applications').expect(200);
  assert.equal(list.body.pagination.total, 0);
  await bob.get(`/api/applications/${applicationId}`).expect(404);
  await bob.patch(`/api/applications/${applicationId}`).set('Origin', origin).send({ company: 'Stolen' }).expect(404);
  await bob.delete(`/api/applications/${applicationId}`).set('Origin', origin).expect(404);
  const dashboard = await bob.get('/api/dashboard').expect(200);
  assert.equal(dashboard.body.total, 0);
});
test('edits fields, manages every status, and shows upcoming interviews', async () => {
  const interviewDate = new Date(Date.now() + 86400000).toISOString();
  await alice.patch(`/api/applications/${applicationId}`).set('Origin', origin).send({ jobTitle: 'Software Engineer Intern', notes: 'Updated preparation notes', interviewDate, status: 'Interview' }).expect(200);
  const dashboard = await alice.get('/api/dashboard').expect(200);
  assert.equal(dashboard.body.total, 1);
  assert.equal(dashboard.body.counts.Interview, 1);
  assert.equal(dashboard.body.upcoming[0]._id, applicationId);
  assert.equal(dashboard.body.trend.length, 7);
  for (const status of ['Saved', 'Applied', 'Offer', 'Rejected', 'Withdrawn']) {
    const response = await alice.patch(`/api/applications/${applicationId}`).set('Origin', origin).send({ status }).expect(200);
    assert.equal(response.body.application.status, status);
  }
});
test('search, status filters, sorting, pagination and literal regex characters work', async () => {
  await alice.post('/api/applications').set('Origin', origin).send({ ...sample, company: 'A.* Company', applicationDate: '2024-01-01', status: 'Saved' }).expect(201);
  let response = await alice.get('/api/applications?search=software&status=Withdrawn').expect(200);
  assert.equal(response.body.pagination.total, 1);
  response = await alice.get('/api/applications?search=.*').expect(200);
  assert.equal(response.body.pagination.total, 1);
  assert.equal(response.body.applications[0].company, 'A.* Company');
  response = await alice.get('/api/applications?sort=oldest&limit=1&page=1').expect(200);
  assert.equal(response.body.applications[0].company, 'A.* Company');
  assert.equal(response.body.pagination.pages, 2);
  response = await alice.get('/api/applications?sort=oldest&limit=1&page=2').expect(200);
  assert.equal(response.body.applications[0]._id, applicationId);
  const newest = await alice.get('/api/applications?sort=newest&limit=1').expect(200);
  assert.equal(newest.body.applications[0]._id, applicationId);
});
test('rejects invalid IDs, unsafe URLs, invalid dates, unknown fields, and injection payloads', async () => {
  await alice.get('/api/applications/not-an-id').expect(400);
  for (const change of [{ applicationUrl: 'javascript:alert(1)' }, { applicationDate: '2026-02-30' }, { status: 'Hired' }, { user: new mongoose.Types.ObjectId().toString() }, { company: { $ne: null } }, { notes: 'x'.repeat(5001) }]) {
    await alice.patch(`/api/applications/${applicationId}`).set('Origin', origin).send(change).expect(400);
  }
  await alice.patch(`/api/applications/${applicationId}`).set('Origin', origin).send({}).expect(400);
  await alice.get('/api/applications?limit=5000').expect(400);
  await alice.get('/api/applications?status[$ne]=Saved').expect(400);
});
test('rejects cross-origin and missing-origin mutations', async () => {
  await alice.post('/api/applications').set('Origin', 'https://untrusted.example').send(sample).expect(403);
  await alice.post('/api/applications').send(sample).expect(403);
});
test('deletion removes the application and updates dashboard counts', async () => {
  await alice.delete(`/api/applications/${applicationId}`).set('Origin', origin).expect(204);
  await alice.get(`/api/applications/${applicationId}`).expect(404);
  const dashboard = await alice.get('/api/dashboard').expect(200);
  assert.equal(dashboard.body.total, 1);
  assert.equal(dashboard.body.counts.Withdrawn, 0);
});
test('logout clears the cookie and revokes previously issued tokens', async () => {
  await alice.post('/api/auth/logout').set('Origin', origin).expect(204);
  await alice.get('/api/auth/me').expect(401);
  await request(app).get('/api/auth/me').set('Cookie', oldCookie).expect(401);
  await alice.post('/api/auth/login').set('Origin', origin).send({ email: credentials.email, password: credentials.password }).expect(200);
  await alice.get('/api/auth/me').expect(200);
});
test('production cookies are Secure and production serves the built React app', async () => {
  const production = createApp({ ...config, production: true });
  const response = await request(production).post('/api/auth/login').set('Origin', origin).send({ email: credentials.email, password: credentials.password }).expect(200);
  assert.match(response.headers['set-cookie'][0], /Secure/);
  const page = await request(production).get('/applications').expect(200);
  assert.match(page.text, /ApplyTrack/);
  await request(production).get('/api/unknown').expect(404);
});
test('authentication is rate limited', async () => {
  let limited = false;
  for (let i = 0; i < 31; i++) {
    const response = await request(app).post('/api/auth/login').set('Origin', origin).send({ email: credentials.email, password: 'wrong' });
    if (response.status === 429) { limited = true; break; }
  }
  assert.equal(limited, true);
});

test('Vercel entry point preserves production cookie auth, query strings, CSRF and logout', async t => {
  const productionOrigin = 'https://applytrack.example';
  const values = { MONGODB_URI: mongo.getUri(), JWT_SECRET: config.jwtSecret, NODE_ENV: 'production', CLIENT_URL: productionOrigin, TRUST_PROXY: '1', VERCEL: '1' };
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  Object.assign(process.env, values);
  t.after(() => { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  await request(vercelHandler).get('/api/health').expect(200);
  const login = await request(vercelHandler).post('/api/auth/login').set('Origin', productionOrigin).send({ email: credentials.email, password: credentials.password }).expect(200);
  assert.match(login.headers['set-cookie'][0], /HttpOnly/);
  assert.match(login.headers['set-cookie'][0], /Secure/);
  assert.match(login.headers['set-cookie'][0], /SameSite=Lax/);
  const cookie = login.headers['set-cookie'][0].split(';')[0];
  await request(vercelHandler).get('/api/auth/me').set('Cookie', cookie).expect(200).expect('Cache-Control', 'no-store');
  const list = await request(vercelHandler).get('/api/applications?status=Saved&search=Company&limit=1').set('Cookie', cookie).expect(200);
  assert.equal(list.body.pagination.total, 1);
  assert.equal(list.body.applications[0].status, 'Saved');
  await request(vercelHandler).post('/api/auth/logout').set('Cookie', cookie).set('Origin', 'https://untrusted.example').expect(403);
  await request(vercelHandler).post('/api/auth/logout').set('Cookie', cookie).set('Origin', productionOrigin).expect(204);
  await request(vercelHandler).get('/api/auth/me').set('Cookie', cookie).expect(401);
  await request(vercelHandler).get('/api/unknown').expect(404).expect('Content-Type', /json/);
});
