import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { verifyRefreshToken } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 회원가입
 *     description: 새로운 사용자를 생성합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - nickname
 *             properties:
 *               username:
 *                 type: string
 *                 description: 사용자 아이디
 *               password:
 *                 type: string
 *                 description: 사용자 비밀번호
 *               nickname:
 *                 type: string
 *                 description: 사용자 닉네임
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 nickname:
 *                   type: string
 *                 authorities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       authorityName:
 *                         type: string
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/signup", authController.signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 로그인
 *     description: 사용자 인증 및 토큰 발급
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 사용자 아이디
 *               password:
 *                 type: string
 *                 description: 사용자 비밀번호
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT 액세스 토큰
 *                 refreshToken:
 *                   type: string
 *                   description: JWT 리프레시 토큰
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: 액세스 토큰 갱신
 *     description: 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받습니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 리프레시 토큰
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: 새로 발급된 액세스 토큰
 *       401:
 *         description: 유효하지 않은 리프레시 토큰
 *       403:
 *         description: 만료된 리프레시 토큰
 */
router.post("/refresh", verifyRefreshToken, authController.refresh);

export default router;
