import Application, { STATUSES } from '../models/Application.js';
import HttpError from '../utils/HttpError.js';

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const owned = req => ({ _id: req.params.id, user: req.user._id });
export async function listApplications(req, res) {
  const { search, status, sort, page, limit } = req.validated;
  const filter = { user: req.user._id };
  if (status) filter.status = status;
  if (search) filter.$or = ['company', 'jobTitle'].map(field => ({ [field]: { $regex: escapeRegex(search), $options: 'i' } }));
  const [applications, total] = await Promise.all([
    Application.find(filter).sort({ applicationDate: sort === 'oldest' ? 1 : -1, _id: sort === 'oldest' ? 1 : -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Application.countDocuments(filter),
  ]);
  res.json({ applications, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
export async function getApplication(req, res) {
  const application = await Application.findOne(owned(req));
  if (!application) throw new HttpError(404, 'Application not found.');
  res.json({ application });
}
export async function createApplication(req, res) {
  const application = await Application.create({ ...req.validated, user: req.user._id });
  res.status(201).json({ application });
}
export async function updateApplication(req, res) {
  const application = await Application.findOneAndUpdate(owned(req), { $set: req.validated }, { new: true, runValidators: true });
  if (!application) throw new HttpError(404, 'Application not found.');
  res.json({ application });
}
export async function deleteApplication(req, res) {
  const application = await Application.findOneAndDelete(owned(req));
  if (!application) throw new HttpError(404, 'Application not found.');
  res.status(204).end();
}
export async function dashboard(req, res) {
  const filter = { user: req.user._id };
  const start = new Date(); start.setUTCDate(start.getUTCDate() - 6); start.setUTCHours(0, 0, 0, 0);
  const [groups, upcoming, recent, activity] = await Promise.all([
    Application.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Application.find({ ...filter, status: 'Interview', interviewDate: { $gte: new Date() } }).sort({ interviewDate: 1 }).limit(4).lean(),
    Application.find(filter).sort({ createdAt: -1, _id: -1 }).limit(5).lean(),
    Application.aggregate([{ $match: { ...filter, applicationDate: { $gte: start, $lte: new Date() }, status: { $ne: 'Saved' } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$applicationDate' } }, count: { $sum: 1 } } }]),
  ]);
  const counts = Object.fromEntries(STATUSES.map(status => [status, 0]));
  groups.forEach(group => { counts[group._id] = group.count; });
  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start); date.setUTCDate(start.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: activity.find(item => item._id === key)?.count || 0 };
  });
  res.json({ total: Object.values(counts).reduce((sum, count) => sum + count, 0), counts, upcoming, recent, trend });
}
