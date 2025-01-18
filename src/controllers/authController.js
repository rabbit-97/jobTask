import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { TokenBlacklist } from '../models/TokenBlacklist.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

export const signup = async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    if (!username || !password || !nickname) {
      return res.status(400).json({
        code: 'MISSING_FIELD',
        message: '모든 필드를 입력해주세요.'
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        code: 'USERNAME_EXISTS',
        message: '이미 존재하는 사용자 이름입니다.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      nickname,
      authorities: [{ authorityName: 'ROLE_USER' }]
    });

    res.status(201).json({
      username: user.username,
      nickname: user.nickname,
      authorities: user.authorities
    });
  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: '서버 오류가 발생했습니다.'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        code: 'MISSING_FIELD',
        message: '모든 필드를 입력해주세요.'
      });
    }

    const user = await User.findOne({ username }).select('+password +authorities');
    if (!user) {
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: '잘못된 사용자 이름 또는 비밀번호입니다.'
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: '잘못된 사용자 이름 또는 비밀번호입니다.'
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      token: accessToken,
      refreshToken: refreshToken
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: '서버 오류가 발생했습니다.'
    });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        code: 'REFRESH_TOKEN_REQUIRED',
        message: '리프레시 토큰이 필요합니다.',
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.sub).select('+authorities');
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        code: 'INVALID_REFRESH_TOKEN',
        message: '유효하지 않은 리프레시 토큰입니다.',
      });
    }

    // 이전 리프레시 토큰을 블랙리스트에 추가 (토큰 회전)
    await TokenBlacklist.create({
      token: refreshToken,
      reason: 'ROTATION'
    });

    // 새로운 토큰 생성
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user._id);

    // 사용자 정보 업데이트
    user.refreshToken = newRefreshToken;
    await user.save();

    return res.status(200).json({
      code: 'SUCCESS',
      message: '토큰이 성공적으로 갱신되었습니다.',
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('토큰 갱신 에러:', error);
    if (error.code === 'REFRESH_TOKEN_EXPIRED') {
      return res.status(401).json({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: '리프레시 토큰이 만료되었습니다. 다시 로그인해주세요.',
      });
    }
    return res.status(500).json({
      code: 'SERVER_ERROR',
      message: '서버 오류가 발생했습니다.',
    });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    if (!username || !password || !nickname) {
      return res.status(400).json({
        code: 'MISSING_FIELD',
        message: '모든 필드를 입력해주세요.'
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        code: 'USERNAME_EXISTS',
        message: '이미 존재하는 사용자 이름입니다.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      nickname,
      authorities: [
        { authorityName: 'ROLE_USER' },
        { authorityName: 'ROLE_ADMIN' }
      ]
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    const responseData = {
      username: user.username,
      nickname: user.nickname,
      authorities: user.authorities,
      accessToken,
      refreshToken
    };

    res.status(201).json(responseData);
  } catch (error) {
    console.error('관리자 계정 생성 에러:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: '서버 오류가 발생했습니다.'
    });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        code: 'INVALID_TOKEN',
        message: '유효하지 않은 토큰입니다.',
      });
    }

    // 토큰을 블랙리스트에 추가
    await TokenBlacklist.create({
      token,
      reason: 'LOGOUT'
    });

    // 사용자의 리프레시 토큰 제거
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    }

    return res.status(200).json({
      code: 'SUCCESS',
      message: '로그아웃되었습니다.',
    });
  } catch (error) {
    console.error('로그아웃 에러:', error);
    return res.status(500).json({
      code: 'SERVER_ERROR',
      message: '서버 오류가 발생했습니다.',
    });
  }
};
