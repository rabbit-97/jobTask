import User from '../models/User.js';

/**
 * 특정 권한을 가진 사용자만 접근을 허용하는 미들웨어
 * @param {...string} roles - 허용할 권한 목록
 */
export const hasRole = (...roles) => {
  return (req, res, next) => {
    try {
      // 사용자 정보가 없는 경우
      if (!req.user) {
        return res.status(401).json({
          code: 'NOT_AUTHENTICATED',
          message: '인증이 필요합니다.',
        });
      }

      // 사용자의 권한 확인
      const userRoles = req.user.authorities.map((auth) => auth.authorityName);
      const hasRequiredRole = roles.some((role) => userRoles.includes(role));

      if (!hasRequiredRole) {
        return res.status(403).json({
          code: 'INSUFFICIENT_PERMISSIONS',
          message: '접근 권한이 없습니다.',
        });
      }

      next();
    } catch (error) {
      console.error('권한 검증 에러:', error);
      res.status(500).json({
        code: 'SERVER_ERROR',
        message: '서버 오류가 발생했습니다.',
      });
    }
  };
};

/**
 * 관리자 권한을 가진 사용자만 접근을 허용하는 미들웨어
 */
export const isAdmin = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        code: 'NO_USER',
        message: '사용자 정보를 찾을 수 없습니다.',
      });
    }

    const isAdmin = user.authorities.some((auth) => auth.authorityName === 'ROLE_ADMIN');
    if (!isAdmin) {
      return res.status(403).json({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: '접근 권한이 없습니다.',
      });
    }

    next();
  } catch (error) {
    console.error('권한 검증 에러:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: '서버 오류가 발생했습니다.',
    });
  }
};

/**
 * 일반 사용자 이상의 권한을 가진 사용자만 접근을 허용하는 미들웨어
 */
export const isUser = hasRole('ROLE_USER', 'ROLE_ADMIN');
