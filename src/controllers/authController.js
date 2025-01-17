import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken, extractTokenFromHeader } from "../utils/jwt.js";
import User from "../models/User.js";
import TokenBlacklist from "../models/TokenBlacklist.js";

export const signup = async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    // 필수 필드 검증
    if (!username || !password || !nickname) {
      return res.status(400).json({
        code: 'MISSING_FIELD',
        message: '모든 필드를 입력해주세요.'
      });
    }

    // 기존 사용자 확인
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        code: 'USERNAME_EXISTS',
        message: '이미 존재하는 사용자 이름입니다.'
      });
    }

    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 새 사용자 생성
    const user = await User.create({
      username,
      password: hashedPassword,
      nickname,
      authorities: [{ authorityName: 'ROLE_USER' }]
    });

    // 응답 데이터 구성
    const responseData = {
      username: user.username,
      nickname: user.nickname,
      authorities: user.authorities
    };

    res.status(201).json(responseData);
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

    // 필수 필드 검증
    if (!username || !password) {
      return res.status(400).json({
        code: 'MISSING_FIELD',
        message: '사용자 이름과 비밀번호를 모두 입력해주세요.'
      });
    }

    // 사용자 찾기
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: '잘못된 사용자 이름 또는 비밀번호입니다.'
      });
    }

    // 비밀번호 검증
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: '잘못된 사용자 이름 또는 비밀번호입니다.'
      });
    }

    // 토큰 생성
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 리프레시 토큰 저장
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // 응답 데이터 구성
    res.json({
      token: accessToken
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
        code: 'NO_REFRESH_TOKEN',
        message: '리프레시 토큰이 필요합니다.' 
      });
    }

    // 토큰 검증 및 사용자 정보 가져오기
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(401).json({ 
        code: 'INVALID_REFRESH_TOKEN',
        message: '유효하지 않은 리프레시 토큰입니다.' 
      });
    }

    // 새로운 토큰 발급
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // DB에 새로운 리프레시 토큰 저장
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      token: newAccessToken
    });
  } catch (error) {
    console.error("토큰 갱신 에러:", error);
    res.status(500).json({ 
      code: 'SERVER_ERROR',
      message: "서버 오류가 발생했습니다." 
    });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    // 필수 필드 검증
    if (!username || !password || !nickname) {
      return res.status(400).json({
        code: 'MISSING_FIELD',
        message: '모든 필드를 입력해주세요.'
      });
    }

    // 기존 사용자 확인
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        code: 'USERNAME_EXISTS',
        message: '이미 존재하는 사용자 이름입니다.'
      });
    }

    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 관리자 사용자 생성
    const user = await User.create({
      username,
      password: hashedPassword,
      nickname,
      authorities: [
        { authorityName: 'ROLE_USER' },
        { authorityName: 'ROLE_ADMIN' }
      ]
    });

    // 응답 데이터 구성
    const responseData = {
      username: user.username,
      nickname: user.nickname,
      authorities: user.authorities
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
    const token = extractTokenFromHeader(req);
    if (!token) {
      return res.status(400).json({
        code: 'NO_TOKEN',
        message: '토큰이 필요합니다.'
      });
    }

    // 현재 토큰을 블랙리스트에 추가
    await TokenBlacklist.create({
      token,
      reason: 'LOGOUT'
    });

    // 사용자의 리프레시 토큰 제거
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.json({
      code: 'SUCCESS',
      message: '로그아웃 되었습니다.'
    });
  } catch (error) {
    console.error('로그아웃 에러:', error);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: '서버 오류가 발생했습니다.'
    });
  }
};
