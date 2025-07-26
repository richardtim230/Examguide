
import mongoose, { Schema, Document } from 'mongoose';

// User Interface and Schema
interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  role: 'student' | 'blogger' | 'admin';
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const UsersSchema: Schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  role: { type: String, enum: ['student', 'blogger', 'admin'], default: 'blogger' },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Users = mongoose.model<IUser>('Users', UsersSchema);

// Post Interface and Schema
interface IPost extends Document {
  _id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  views: number;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  views: { type: Number, default: 0 },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Post = mongoose.model<IPost>('Post', PostSchema);

// Follower Interface and Schema
interface IFollower extends Document {
  _id: string;
  blogger: mongoose.Types.ObjectId;
  follower: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FollowerSchema: Schema = new Schema({
  blogger: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  follower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Follower = mongoose.model<IFollower>('Follower', FollowerSchema);

// MarketplaceListing Interface and Schema
interface IMarketplaceListing extends Document {
  _id: string;
  item: string;
  price: number;
  status: 'active' | 'pending' | 'sold';
  seller: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceListingSchema: Schema = new Schema({
  item: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['active', 'pending', 'sold'], default: 'active' },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const MarketplaceListing = mongoose.model<IMarketplaceListing>('MarketplaceListing', MarketplaceListingSchema);
