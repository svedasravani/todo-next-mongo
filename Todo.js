import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  expireAt: { type: Date, default: null, index: { expires: 0 } },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Todo || mongoose.model('Todo', TodoSchema);