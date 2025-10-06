import dbConnect from '../../lib/mongodb';

export default async function handler(req, res) {
  try {
    await dbConnect();
    res.status(200).json({ success: true, message: 'MongoDB Connected Successfully ✅' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'MongoDB Connection Failed ❌', error: error.message });
  }
}
