import { z } from 'zod';
import { STATUSES, JOB_TYPES } from '../models/Application.js';

const password = z.string().min(8, 'Use at least 8 characters').refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes');
const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
export const registerSchema = z.object({ name: z.string().trim().min(2).max(60), email, password }).strict();
export const loginSchema = z.object({ email, password: z.string().min(1).max(200) }).strict();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine(value => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}, 'Enter a valid date');
const applicationFields = {
  company: z.string().trim().min(1, 'Company is required').max(100),
  jobTitle: z.string().trim().min(1, 'Job title is required').max(120),
  jobType: z.enum(JOB_TYPES),
  location: z.string().trim().max(120),
  applicationUrl: z.union([z.literal(''), z.url({ protocol: /^https?$/ }).max(2000)]),
  salary: z.string().trim().max(100),
  applicationDate: date,
  interviewDate: z.iso.datetime({ offset: true }).nullable(),
  status: z.enum(STATUSES),
  notes: z.string().trim().max(5000),
};
export const createApplicationSchema = z.object({ ...applicationFields, jobType: applicationFields.jobType.default('Internship'), location: applicationFields.location.default(''), applicationUrl: applicationFields.applicationUrl.default(''), salary: applicationFields.salary.default(''), interviewDate: applicationFields.interviewDate.default(null), status: applicationFields.status.default('Applied'), notes: applicationFields.notes.default('') }).strict();
export const updateApplicationSchema = z.object(applicationFields).partial().strict().refine(value => Object.keys(value).length > 0, 'Provide at least one field');
export const querySchema = z.object({ search: z.string().trim().max(100).default(''), status: z.enum(STATUSES).optional(), sort: z.enum(['newest', 'oldest']).default('newest'), page: z.coerce.number().int().min(1).max(100000).default(1), limit: z.coerce.number().int().min(1).max(100).default(8) }).strict();
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return res.status(400).json({ message: 'Please check your input.', errors: Object.fromEntries(result.error.issues.map(issue => [issue.path.join('.') || 'form', issue.message])) });
    req.validated = result.data;
    next();
  };
}
