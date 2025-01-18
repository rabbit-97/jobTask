export const tokenConfig = {
  development: {
    access: {
      expiresIn: '15m',
      algorithm: 'HS256',
    },
    refresh: {
      expiresIn: '7d',
      algorithm: 'HS256',
    },
    blacklist: {
      expiresIn: 24 * 60 * 60, // 24시간
    },
  },
  production: {
    access: {
      expiresIn: '5m', // 운영 환경에서는 더 짧게 설정
      algorithm: 'HS256',
    },
    refresh: {
      expiresIn: '3d', // 운영 환경에서는 더 짧게 설정
      algorithm: 'HS256',
    },
    blacklist: {
      expiresIn: 7 * 24 * 60 * 60, // 7일
    },
  },
  test: {
    access: {
      expiresIn: '1h',
      algorithm: 'HS256',
    },
    refresh: {
      expiresIn: '24h',
      algorithm: 'HS256',
    },
    blacklist: {
      expiresIn: 60 * 60, // 1시간
    },
  },
};
