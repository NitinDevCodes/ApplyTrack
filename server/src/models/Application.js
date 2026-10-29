import mongoose from 'mongoose';

export const STATUSES = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];
export const JOB_TYPES = ['Internship', 'Full-time', 'Part-time', 'Contract'];
const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company: { type: String, required: true, trim: true, maxlength: 100 },
  jobTitle: { type: String, required: true, trim: true, maxlength: 120 },
  jobType: { type: String, enum: JOB_TYPES, default: 'Internship' },
  location: { type: String, trim: true, maxlength: 120, default: '' },
  applicationUrl: { type: String, maxlength: 2000, default: '' },
  salary: { type: String, trim: true, maxlength: 100, default: '' },
  applicationDate: { type: Date, required: true },
  interviewDate: { type: Date, default: null },
  status: { type: String, enum: STATUSES, default: 'Applied' },
  notes: { type: String, maxlength: 5000, default: '' },
}, { timestamps: true });
applicationSchema.index({ user: 1, applicationDate: -1 });
applicationSchema.index({ user: 1, status: 1, interviewDate: 1 });
export default mongoose.model('Application', applicationSchema);
