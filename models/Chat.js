import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  title: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Ensure we can search by participants
ChatSchema.index({ participants: 1 });

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
