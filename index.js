import dbConnect from '../../../lib/mongodb';
import Todo from '../../../models/Todo';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;

  if (method === 'GET') {
    const todos = await Todo.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: todos });
  }

  if (method === 'POST') {
    try {
      const { title, ttl } = req.body;
      if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
      let expireAt = ttl ? new Date(Date.now() + Number(ttl) * 1000) : null;
      const todo = await Todo.create({ title: title.trim(), expireAt });
      return res.status(201).json({ success: true, data: todo });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method} Not Allowed`);
}