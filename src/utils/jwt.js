import jwt from "jsonwebtoken";
import { tokenConfig } from '../config/token.js';

const env = process.env.NODE_ENV || 'development';
const config = tokenConfig[env];

// Access Token 생성
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      authorities: user.authorities.map(auth => auth.authorityName)
    },
    process.env.JWT_ACCESS_SECRET,
    { 
      algorithm: config.access.algorithm,
      expiresIn: config.access.expiresIn
    }
  );
};

// Refresh Token 생성
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      sub: userId,
      type: 'refresh',
      jti: Math.random().toString(36).substring(7), // 토큰 고유 식별자
      timestamp: Date.now()
    },
    process.env.JWT_REFRESH_SECRET,
    { 
      algorithm: config.refresh.algorithm,
      expiresIn: config.refresh.expiresIn
    }
  );
};

// Access Token 검증
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw {
        code: 'TOKEN_EXPIRED',
        message: '토큰이 만료되었습니다.'
      };
    }
    throw {
      code: 'INVALID_TOKEN',
      message: '유효하지 않은 토큰입니다.'
    };
  }
};

// Refresh Token 검증
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw {
        code: 'REFRESH_TOKEN_EXPIRED',
        message: '리프레시 토큰이 만료되었습니다.'
      };
    }
    throw {
      code: 'INVALID_REFRESH_TOKEN',
      message: '유효하지 않은 리프레시 토큰입니다.'
    };
  }
};

// Authorization 헤더에서 토큰 추출
export const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};
