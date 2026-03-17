const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  project: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);
