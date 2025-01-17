import mongoose from 'mongoose';

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  reason: {
    type: String,
    enum: ['LOGOUT', 'REFRESH', 'EXPIRED'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // 24시간 후 자동 삭제
  },
});

// 인덱스 생성
tokenBlacklistSchema.index({ token: 1 });
tokenBlacklistSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema);

export default TokenBlacklist;
