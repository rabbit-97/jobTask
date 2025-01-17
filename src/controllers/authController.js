import bcrypt from "bcrypt";
import { generateAccessToken } from "../utils/jwt.js";

// 임시 사용자 저장소 (나중에 데이터베이스로 교체)
const users = new Map();

export const signup = async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    // 사용자 중복 확인
    if (users.has(username)) {
      return res.status(400).json({ message: "이미 존재하는 사용자입니다." });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새 사용자 생성
    const newUser = {
      id: users.size + 1,
      username,
      password: hashedPassword,
      nickname,
      authorities: [{ authorityName: "ROLE_USER" }],
    };

    users.set(username, newUser);

    // 응답에서 비밀번호 제외
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("회원가입 에러:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 사용자 찾기
    const user = users.get(username);
    if (!user) {
      return res.status(401).json({ message: "잘못된 인증 정보입니다." });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "잘못된 인증 정보입니다." });
    }

    // 토큰 생성
    const token = generateAccessToken(user);

    res.json({ token });
  } catch (error) {
    console.error("로그인 에러:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};
