import express from "express";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import authRouter from "./routes/auth.js";

dotenv.config();

const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 스웨거 설정
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "백엔드 온보딩 API",
      version: "1.0.0",
      description: "회원가입/로그인 API 문서",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 라우트 설정
app.use("/auth", authRouter);

app.get("/", (req, res) => {
  res.json({ message: "서버가 정상적으로 실행중입니다." });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행중입니다.`);
});

export default server;
