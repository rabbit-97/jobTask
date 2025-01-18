import jwt from "jsonwebtoken";

// Access Token 생성
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      username: user.username,
      authorities: user.authorities,
      timestamp: Date.now()
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

// Refresh Token 생성
export const generateRefreshToken = () => {
  return jwt.sign(
    {
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
