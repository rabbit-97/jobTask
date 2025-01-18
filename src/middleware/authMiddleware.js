import { verifyAccessToken, verifyRefreshToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { TokenBlacklist } from '../models/TokenBlacklist.js';

export const validateRequiredFields = (req, res, next) => {
  const { username, password, nickname } = req.body;

  if (!username || !password || !nickname) {
    return res.status(400).json({
      code: 'MISSING_FIELD',
      message: '모든 필드를 입력해주세요.'
    });
  }

  next();
};

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: '인증이 필요합니다.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // 토큰 블랙리스트 확인
    const isBlacklisted = await TokenBlacklist.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({
        code: 'INVALID_TOKEN',
        message: '유효하지 않은 토큰입니다.'
      });
    }

    const user = await User.findById(decoded.sub).select('+authorities');
    if (!user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    req.user = {
      id: user._id,
      userId: user._id,
      username: user.username,
      authorities: user.authorities
    };

    next();
  } catch (error) {
    console.error('토큰 검증 에러:', error);
    if (error.code === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        code: 'TOKEN_EXPIRED',
        message: '토큰이 만료되었습니다.'
      });
    }
    return res.status(401).json({
      code: 'INVALID_TOKEN',
      message: '유효하지 않은 토큰입니다.'
    });
  }
};

export const validatePassword = (req, res, next) => {
  const { password } = req.body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      code: 'INVALID_PASSWORD',
      message: '비밀번호는 문자열이어야 합니다.'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      code: 'INVALID_PASSWORD',
      message: '비밀번호는 최소 8자 이상이어야 합니다.'
    });
  }

  next();
};

export const verifyRefreshTokenMiddleware = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        code: 'REFRESH_TOKEN_REQUIRED',
        message: '리프레시 토큰이 필요합니다.'
      });
    }

    // 토큰 블랙리스트 확인
    const isBlacklisted = await TokenBlacklist.findOne({ token: refreshToken });
    if (isBlacklisted) {
      return res.status(401).json({
        code: 'INVALID_REFRESH_TOKEN',
        message: '유효하지 않은 리프레시 토큰입니다.'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findOne({ refreshToken }).select('+authorities');
    
    if (!user) {
      return res.status(401).json({
        code: 'INVALID_REFRESH_TOKEN',
        message: '유효하지 않은 리프레시 토큰입니다.'
      });
    }

    req.user = {
      userId: user._id,
      username: user.username,
      authorities: user.authorities.map(auth => auth.authorityName)
    };

    next();
  } catch (error) {
    if (error.code === 'REFRESH_TOKEN_EXPIRED') {
      return res.status(401).json({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: '리프레시 토큰이 만료되었습니다.'
      });
    }
    return res.status(401).json({
      code: 'INVALID_REFRESH_TOKEN',
      message: '유효하지 않은 리프레시 토큰입니다.'
    });
  }
};
