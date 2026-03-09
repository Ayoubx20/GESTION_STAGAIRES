const mongoose = require('mongoose');

const siteStatSchema = new mongoose.Schema({
  monthId: { type: String, required: true, unique: true }, // Format: YYYY-MM
  approvedCount: { type: Number, default: 0 },
  rejectedCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('SiteStat', siteStatSchema);
