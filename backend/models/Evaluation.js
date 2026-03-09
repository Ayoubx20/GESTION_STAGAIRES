const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  intern: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern',
    required: true
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    week: Number,
    startDate: Date,
    endDate: Date
  },
  ratings: [{
    category: {
      type: String, // e.g., 'Technical Skills', 'Soft Skills', 'Communication'
      required: true
    },
    score: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  }],
  feedback: {
    strengths: String,
    areasForImprovement: String,
    generalComments: String
  },
  goals: [{
    title: String,
    description: String,
    status: {
      type: String,
      enum: ['pending', 'achieved', 'partially_achieved', 'missed'],
      default: 'pending'
    }
  }],
  nextPeriodGoals: [{
    title: String,
    description: String
  }],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed'],
    default: 'draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
