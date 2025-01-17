import jwt from "jsonwebtoken";

// Access Token 생성
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      authorities: user.authorities,
      timestamp: Date.now()
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
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
    { expiresIn: '14d' }
  );
};

// Access Token 검증
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

// Refresh Token 검증
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
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
