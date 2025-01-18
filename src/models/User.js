import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    nickname: {
      type: String,
      required: true,
    },
    authorities: [
      {
        authorityName: {
          type: String,
          enum: ['ROLE_USER', 'ROLE_ADMIN'],
          required: true,
        },
      },
    ],
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!this.password) {
      console.error('비밀번호 비교 에러: 저장된 비밀번호가 없습니다.');
      return false;
    }

    console.log('비밀번호 비교:', {
      candidatePassword,
      hashedPassword: this.password,
    });

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('비밀번호 비교 결과:', { isMatch });
    return isMatch;
  } catch (error) {
    console.error('비밀번호 비교 에러:', error);
    return false;
  }
};

export const User = mongoose.model('User', userSchema);
