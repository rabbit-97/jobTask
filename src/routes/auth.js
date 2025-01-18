import { Router } from 'express';
import { signup, login, refresh, createAdmin, logout } from '../controllers/authController.js';
import { verifyToken, isAdmin, verifyRefreshTokenMiddleware } from '../middleware/authMiddleware.js';
import { defaultLimiter, loginLimiter, signupLimiter, refreshLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.use(defaultLimiter);

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
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
 *                 description: 비밀번호
 *               nickname:
 *                 type: string
 *                 description: 닉네임
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
 *       409:
 *         description: 중복된 사용자 이름
 *       429:
 *         description: 너무 많은 요청
 */
router.post('/signup', signupLimiter, signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Auth]
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
 *                 description: 비밀번호
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT 토큰
 *       401:
 *         description: 인증 실패
 *       429:
 *         description: 너무 많은 요청
 */
router.post('/login', loginLimiter, login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: 토큰 갱신
 *     tags: [Auth]
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
 *                 token:
 *                   type: string
 *                   description: 새로운 JWT 토큰
 *       401:
 *         description: 인증 실패
 *       429:
 *         description: 너무 많은 요청
 */
router.post('/refresh', refreshLimiter, verifyRefreshTokenMiddleware, refresh);

/**
 * @swagger
 * /auth/admin:
 *   post:
 *     summary: 관리자 계정 생성
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
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
 *                 description: 관리자 아이디
 *               password:
 *                 type: string
 *                 description: 비밀번호
 *               nickname:
 *                 type: string
 *                 description: 닉네임
 *     responses:
 *       201:
 *         description: 관리자 계정 생성 성공
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 *       429:
 *         description: 너무 많은 요청
 */
router.post('/admin', verifyToken, isAdmin, createAdmin);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 로그아웃
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *       401:
 *         description: 인증 실패
 *       429:
 *         description: 너무 많은 요청
 */
router.post('/logout', verifyToken, logout);

export default router;
