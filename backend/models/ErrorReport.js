const mongoose = require('mongoose');

const reportMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now }
});

const errorReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  category: {
    type: String,
    required: true,
    enum: ['timesheet', 'tasks', 'documents', 'account', 'other']
  },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  severity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  pageUrl: { type: String, trim: true, maxlength: 500, default: '' },
  browser: { type: String, trim: true, maxlength: 300, default: '' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open', index: true },
  resolutionNote: { type: String, trim: true, maxlength: 1500, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  messages: { type: [reportMessageSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('ErrorReport', errorReportSchema);
