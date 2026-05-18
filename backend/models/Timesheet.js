const mongoose = require('mongoose');

const timesheetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  days: {
    type: Map,
    of: {
      hours: { type: Number, default: 0 },
      transportOnly: { type: Boolean, default: false }
    },
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Timesheet', timesheetSchema);
