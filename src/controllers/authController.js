import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import User from "../models/User.js";

export const signup = async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    // 필수 필드 검증
    if (!username || !password || !nickname) {
      return res.status(400).json({ 
        message: "모든 필수 필드를 입력해주세요." 
      });
    }

    // 사용자 중복 확인
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        message: "이미 존재하는 사용자입니다." 
      });
    }

    // 비밀번호 해시화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('회원가입 비밀번호 해시:', { password, hashedPassword });

    // 새 사용자 생성
    const user = new User({
      username,
      password: hashedPassword,
      nickname,
      authorities: [{ authorityName: "ROLE_USER" }]
    });

    await user.save();

    // 응답에서 비밀번호 제외
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error("회원가입 에러:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('로그인 시도:', { username });

    // 필수 필드 검증
    if (!username || !password) {
      return res.status(400).json({ 
        message: "아이디와 비밀번호를 모두 입력해주세요." 
      });
    }

    // 사용자 찾기
    const user = await User.findOne({ username });
    console.log('사용자 찾기 결과:', { found: !!user });
    
    if (!user) {
      return res.status(401).json({ message: "잘못된 인증 정보입니다." });
    }

    // 비밀번호 확인
    const isValidPassword = await user.comparePassword(password);
    console.log('비밀번호 확인 결과:', { isValidPassword });
    
    if (!isValidPassword) {
      return res.status(401).json({ message: "잘못된 인증 정보입니다." });
    }

    // 토큰 생성
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Refresh Token을 DB에 저장
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ 
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error("로그인 에러:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: '리프레시 토큰이 필요합니다.' });
    }

    // 토큰 검증 및 사용자 정보 가져오기
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(401).json({ message: '유효하지 않은 리프레시 토큰입니다.' });
    }

    // 새로운 토큰 발급
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // DB에 새로운 리프레시 토큰 저장
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error("토큰 갱신 에러:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};
