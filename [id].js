import dbConnect from '../../../lib/mongodb';
import Todo from '../../../models/Todo';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;
  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ success: false, message: 'Invalid id' });

  if (method === 'GET') {
    const todo = await Todo.findById(id).lean();
    if (!todo) return res.status(404).json({ success: false, message: 'Not found' });
    return res.status(200).json({ success: true, data: todo });
  }

  if (method === 'PUT') {
    try {
      const { title, completed, ttl } = req.body;
      const update = {};
      if (title) update.title = title.trim();
      if (completed !== undefined) update.completed = !!completed;
      if (ttl !== undefined)
        update.expireAt = ttl > 0 ? new Date(Date.now() + Number(ttl) * 1000) : null;

      const updated = await Todo.findByIdAndUpdate(id, update, { new: true }).lean();
      if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (method === 'DELETE') {
    const deleted = await Todo.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    return res.status(200).json({ success: true, data: deleted });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${method} Not Allowed`);
}