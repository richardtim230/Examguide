
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Post, Follower, MarketplaceListing } from '../models/blogger.models';

const router = express.Router();

// Middleware to verify JWT token
const authMiddleware = async (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded as { id: string; role: string };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get current user profile (/auth/me)
router.get('/auth/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile (/superadmin/me)
router.put('/superadmin/me', authMiddleware, async (req: Request, res: Response) => {
  const { username, email, phone } = req.body;
  if (!username || !email) {
    return res.status(400).json({ message: 'Username and email are required' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username, email, phone, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password (/auth/change-password)
router.post('/auth/change-password', authMiddleware, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.updatedAt = new Date();
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all posts (/posts)
router.get('/posts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const posts = await Post.find({ author: req.user.id }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a post (/posts)
router.post('/posts', authMiddleware, async (req: Request, res: Response) => {
  const { title, content, status } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const post = new Post({
      title,
      content,
      status: status || 'draft',
      author: req.user.id,
    });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a post (/posts/:id)
router.delete('/posts/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, author: req.user.id });
    if (!post) return res.status(404).json({ message: 'Post not found or unauthorized' });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get followers (/followers)
router.get('/followers', authMiddleware, async (req: Request, res: Response) => {
  try {
    const followers = await Follower.find({ blogger: req.user.id }).populate('follower', 'username');
    res.json(followers.map(f => ({ username: f.follower.username, _id: f.follower._id })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get marketplace listings (/marketplace/listings)
router.get('/marketplace/listings', authMiddleware, async (req: Request, res: Response) => {
  try {
    const listings = await MarketplaceListing.find({ seller: req.user.id }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a marketplace listing (/marketplace/listings)
router.post('/marketplace/listings', authMiddleware, async (req: Request, res: Response) => {
  const { item, price, status } = req.body;
  if (!item || !price) {
    return res.status(400).json({ message: 'Item and price are required' });
  }

  try {
    const listing = new MarketplaceListing({
      item,
      price,
      status: status || 'active',
      seller: req.user.id,
    });
    await listing.save();
    res.status(201).json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a marketplace listing (/marketplace/listings/:id)
router.delete('/marketplace/listings/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const listing = await MarketplaceListing.findOneAndDelete({ _id: req.params.id, seller: req.user.id });
    if (!listing) return res.status(404).json({ message: 'Listing not found or unauthorized' });
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
