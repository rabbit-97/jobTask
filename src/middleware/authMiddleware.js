import { verifyAccessToken, verifyRefreshToken as verifyRefreshTokenUtil } from '../utils/jwt.js';
import User from '../models/User.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: '인증에 실패했습니다.' });
  }
};

export const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: '리프레시 토큰이 필요합니다.' });
    }

    const decoded = verifyRefreshTokenUtil(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: '유효하지 않은 리프레시 토큰입니다.' });
    }

    // DB에서 사용자와 저장된 리프레시 토큰 확인
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: '유효하지 않은 리프레시 토큰입니다.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: '만료된 리프레시 토큰입니다.' });
    }
    res.status(401).json({ message: '인증에 실패했습니다.' });
  }
};
