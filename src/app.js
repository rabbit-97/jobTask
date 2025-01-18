import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { connectDB } from "./config/database.js";
import authRouter from "./routes/auth.js";
import { User } from "./models/User.js";
import { TokenBlacklist } from "./models/TokenBlacklist.js";
import { specs } from './config/swagger.js';

dotenv.config();

// 테스트 환경이 아닐 때만 데이터베이스 연결
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 스웨거 설정
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// 라우트 설정
app.use("/auth", authRouter);

app.get("/", (req, res) => {
  res.json({ message: "서버가 정상적으로 실행중입니다." });
});

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: "서버 오류가 발생했습니다.",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 테스트 환경이 아닐 때만 서버 시작
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행중입니다.`);
  });
}

export default app;
