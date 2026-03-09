const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Application (Global)
  companyName: { type: String, default: 'Gestion Stagiaire' },
  companyLogo: { type: String, default: null },
  primaryColor: { type: String, default: '#4f46e5' },
  itemsPerPage: { type: Number, default: 20 },
  
  // Security (Global)
  twoFactorAuth: { type: Boolean, default: false },
  sessionTimeout: { type: Number, default: 30 },
  passwordExpiry: { type: Number, default: 90 },
  
  // Email (Global)
  smtpServer: { type: String, default: 'smtp.gmail.com' },
  smtpPort: { type: Number, default: 587 },
  smtpUsername: { type: String, default: '' },
  smtpPassword: { type: String, default: '' },
  senderEmail: { type: String, default: 'noreply@gestion-stagiaire.com' },
  senderName: { type: String, default: 'Gestion Stagiaire' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
