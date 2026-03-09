const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cvUrl: {
    type: String,
    required: true
  },
  cvName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  adminNotes: {
    type: String
  },
  appliedFor: {
    type: String,
    enum: ['internship', 'training', 'job'],
    default: 'internship'
  },
  startDate: {
    type: Date
  },
  skills: [{
    type: String
  }],
  education: {
    level: String,
    institution: String,
    field: String,
    graduationYear: Number
  },
  experience: {
    years: Number,
    description: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Application', applicationSchema);