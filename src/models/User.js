import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, '사용자 이름은 필수입니다.'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, '비밀번호는 필수입니다.'],
      minlength: [8, '비밀번호는 최소 8자 이상이어야 합니다.'],
    },
    nickname: {
      type: String,
      required: [true, '닉네임은 필수입니다.'],
      trim: true,
    },
    authorities: [
      {
        authorityName: {
          type: String,
          enum: ['ROLE_USER', 'ROLE_ADMIN'],
          default: 'ROLE_USER',
        },
      },
    ],
    refreshToken: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    methods: {
      // 비밀번호 검증 메서드
      comparePassword: async function (candidatePassword) {
        try {
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
      },
    },
  },
);

// 민감한 정보를 JSON 변환 시 제외
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
