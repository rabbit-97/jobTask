import rateLimit from 'express-rate-limit';

const createLimiter = (options) => {
  if (process.env.NODE_ENV === 'test') {
    return rateLimit({
      windowMs: 1000,
      max: options.max * 2,
      standardHeaders: true,
      legacyHeaders: false,
      skipFailedRequests: true,
      message: {
        code: options.code,
        message: options.message,
      },
    });
  }

  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      code: options.code,
      message: options.message,
    },
  });
};

export const defaultLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  code: 'TOO_MANY_REQUESTS',
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
});

export const loginLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  code: 'TOO_MANY_LOGIN_ATTEMPTS',
  message: '로그인 시도가 너무 많습니다. 1시간 후 다시 시도해주세요.',
});

export const signupLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  code: 'TOO_MANY_SIGNUP_ATTEMPTS',
  message: '회원가입 시도가 너무 많습니다. 1시간 후 다시 시도해주세요.',
});

export const refreshLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  code: 'TOO_MANY_REFRESH_ATTEMPTS',
  message: '토큰 갱신 시도가 너무 많습니다. 1시간 후 다시 시도해주세요.',
});
