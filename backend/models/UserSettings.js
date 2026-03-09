const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Personal preferences
  language: { type: String, default: 'fr' },
  theme: { type: String, default: 'light' },
  timezone: { type: String, default: 'Africa/Casablanca' },
  dateFormat: { type: String, default: 'DD/MM/YYYY' },
  timeFormat: { type: String, default: '24h' },
  
  // Per-user notifications
  emailNotifications: { type: Boolean, default: true },
  pushNotifications: { type: Boolean, default: false },
  taskReminders: { type: Boolean, default: true },
  internUpdates: { type: Boolean, default: true },
  reportAlerts: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserSettings', userSettingsSchema);
