import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authMiddleware } from "./middleware/auth.js";

dotenv.config();
const app = express();
app.use(cors(), express.json());

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB Connected'));

const User = mongoose.model('User', new mongoose.Schema({
  name: String, 
  email: { type: String, unique: true }, 
  password: { type: String, select: false }, 
  role: { type: String, default: 'user' }
}));

const Task = mongoose.model('Task', new mongoose.Schema({
  title: String, 
  status: { type: String, default: 'pending' }, 
  priority: { type: String, default: 'medium' }, 
  userId: mongoose.Schema.Types.ObjectId
}, { timestamps: true }));

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ name, email, password: hash, role: role});
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.status(201).json({ 
      token, user: { _id: user._id, name, email, role: user.role } });
  } catch {
    res.status(400).json({ 
      message: 'User already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (user && (await bcrypt.compare(req.body.password, user.password))) {
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    return res.json({ 
      token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  }
  res.status(400).json({ 
    message: 'Invalid credentials' });
});

app.get('/api/tasks', authMiddleware, async (req, res) => {
  const { search, status } = req.query;
  const query = req.user.role === 'admin' ? {} : { userId: req.user.id };
  if (status) query.status = status;
  if (search) query.title = { $regex: search,$options: 'i' };
  res.json(
    await Task.find(query).sort({ createdAt: -1 }));
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
  res.status(201).json(await Task.create({ ...req.body, userId: req.user.id }));
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, userId: req.user.id };
  res.json(
    await Task.findOneAndUpdate(query, req.body, { new: true }));
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, userId: req.user.id };
  await Task.findOneAndDelete(query);
  res.json({ 
    message: 'Deleted' });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));