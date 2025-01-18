import mongoose from 'mongoose';
import { tokenConfig } from '../config/token.js';

const env = process.env.NODE_ENV || 'development';
const { blacklist } = tokenConfig[env];

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  reason: {
    type: String,
    enum: ['LOGOUT', 'REFRESH', 'EXPIRED', 'ROTATION'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: blacklist.expiresIn,
  },
});

// 인덱스 생성
tokenBlacklistSchema.index({ token: 1 });
tokenBlacklistSchema.index({ createdAt: 1 }, { expireAfterSeconds: blacklist.expiresIn });

export const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
