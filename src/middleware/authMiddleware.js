import { verifyAccessToken, verifyRefreshToken as verifyRefreshTokenUtil } from '../utils/jwt.js';
import User from '../models/User.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        code: 'NO_TOKEN',
        message: '인증 토큰이 필요합니다.' 
      });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyAccessToken(token);
      // 사용자 정보 검증
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ 
          code: 'USER_NOT_FOUND',
          message: '유효하지 않은 사용자입니다.' 
        });
      }
      req.user = user;
      next();
    } catch (error) {
      if (error.message === 'TOKEN_EXPIRED') {
        return res.status(401).json({ 
          code: 'TOKEN_EXPIRED',
          message: '만료된 토큰입니다.' 
        });
      } else if (error.message === 'INVALID_TOKEN') {
        return res.status(401).json({ 
          code: 'INVALID_TOKEN',
          message: '유효하지 않은 토큰입니다.' 
        });
      } else {
        return res.status(401).json({ 
          code: 'TOKEN_VERIFICATION_FAILED',
          message: '토큰 검증에 실패했습니다.' 
        });
      }
    }
  } catch (error) {
    console.error('인증 미들웨어 에러:', error);
    res.status(500).json({ 
      code: 'SERVER_ERROR',
      message: '서버 오류가 발생했습니다.' 
    });
  }
};

export const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        code: 'NO_REFRESH_TOKEN',
        message: '리프레시 토큰이 필요합니다.' 
      });
    }

    try {
      const decoded = verifyRefreshTokenUtil(refreshToken);
      
      // DB에서 사용자와 저장된 리프레시 토큰 확인
      const user = await User.findById(decoded.id);
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({ 
          code: 'INVALID_REFRESH_TOKEN',
          message: '유효하지 않은 리프레시 토큰입니다.' 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.message === 'REFRESH_TOKEN_EXPIRED') {
        return res.status(403).json({ 
          code: 'REFRESH_TOKEN_EXPIRED',
          message: '만료된 리프레시 토큰입니다.' 
        });
      } else if (error.message === 'INVALID_REFRESH_TOKEN') {
        return res.status(401).json({ 
          code: 'INVALID_REFRESH_TOKEN',
          message: '유효하지 않은 리프레시 토큰입니다.' 
        });
      } else {
        return res.status(401).json({ 
          code: 'REFRESH_TOKEN_VERIFICATION_FAILED',
          message: '리프레시 토큰 검증에 실패했습니다.' 
        });
      }
    }
  } catch (error) {
    console.error('리프레시 토큰 검증 에러:', error);
    res.status(500).json({ 
      code: 'SERVER_ERROR',
      message: '서버 오류가 발생했습니다.' 
    });
  }
};
