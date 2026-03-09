const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  maxInterns: {
    type: Number,
    default: 10
  },
  currentInterns: {
    type: Number,
    default: 0
  },
  location: {
    floor: String,
    building: String,
    office: String
  },
  budget: {
    allocated: Number,
    spent: Number,
    currency: {
      type: String,
      default: 'MAD'
    }
  },
  contactEmail: String,
  contactPhone: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);