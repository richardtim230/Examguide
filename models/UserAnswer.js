const mongoose = require('mongoose');

const UserAnswerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
      answer: { type: String }
    }
  ],
  correctChoices: { type: mongoose.Schema.Types.Mixed }, // {questionId: answer}
  wrongChoices: { type: mongoose.Schema.Types.Mixed },   // {questionId: answer}
  totalCorrect: { type: Number, default: 0 },
  totalWrong: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // In seconds
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserAnswer', UserAnswerSchema);
