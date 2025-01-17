import jwt from "jsonwebtoken";

// Access Token 생성
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      timestamp: Date.now()
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

// Refresh Token 생성
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      timestamp: Date.now()
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Access Token 검증
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('TOKEN_EXPIRED');
      throw err;
    } else if (error.name === 'JsonWebTokenError') {
      const err = new Error('INVALID_TOKEN');
      throw err;
    }
    throw error;
  }
};

// Refresh Token 검증
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('REFRESH_TOKEN_EXPIRED');
      throw err;
    } else if (error.name === 'JsonWebTokenError') {
      const err = new Error('INVALID_REFRESH_TOKEN');
      throw err;
    }
    throw error;
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
