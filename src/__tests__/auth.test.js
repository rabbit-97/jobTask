import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/User.js';
import { verifyAccessToken, verifyRefreshToken } from '../utils/jwt.js';

let mongoServer;

beforeAll(async () => {
  // 기존 연결 종료
  await mongoose.disconnect();
  
  // 인메모리 MongoDB 서버 시작
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Auth API Tests', () => {
  const validUser = {
    username: 'JIN HO',
    password: '12341234',
    nickname: 'Mentos'
  };

  describe('회원가입 테스트', () => {
    it('유효한 데이터로 회원가입 성공', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty('username', validUser.username);
      expect(response.body).toHaveProperty('nickname', validUser.nickname);
      expect(response.body.authorities[0].authorityName).toBe('ROLE_USER');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('중복된 username으로 회원가입 실패', async () => {
      await request(app)
        .post('/auth/signup')
        .send(validUser);

      const response = await request(app)
        .post('/auth/signup')
        .send(validUser)
        .expect(400);

      expect(response.body).toHaveProperty('message', '이미 존재하는 사용자입니다.');
    });

    it('필수 필드 누락시 회원가입 실패', async () => {
      const invalidUser = {
        username: 'test'
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('message', '모든 필수 필드를 입력해주세요.');
    });
  });

  describe('로그인 테스트', () => {
    beforeEach(async () => {
      await request(app)
        .post('/auth/signup')
        .send(validUser);
    });

    it('유효한 인증정보로 로그인 성공', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: validUser.username,
          password: validUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // 토큰 검증
      const decodedAccess = verifyAccessToken(response.body.accessToken);
      const decodedRefresh = verifyRefreshToken(response.body.refreshToken);

      expect(decodedAccess).toBeTruthy();
      expect(decodedRefresh).toBeTruthy();
      expect(decodedAccess.username).toBe(validUser.username);
    });

    it('잘못된 비밀번호로 로그인 실패', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: validUser.username,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', '잘못된 인증 정보입니다.');
    });

    it('존재하지 않는 사용자로 로그인 실패', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: validUser.password
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', '잘못된 인증 정보입니다.');
    });
  });

  describe('토큰 갱신 테스트', () => {
    let refreshToken;
    let accessToken;

    beforeEach(async () => {
      // 회원가입
      await request(app)
        .post('/auth/signup')
        .send(validUser);

      // 로그인하여 토큰 얻기
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: validUser.username,
          password: validUser.password
        });

      refreshToken = loginResponse.body.refreshToken;
      accessToken = loginResponse.body.accessToken;
    });

    it('유효한 리프레시 토큰으로 액세스 토큰 갱신 성공', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).not.toBe(accessToken);
      expect(response.body.refreshToken).not.toBe(refreshToken);

      // 새로운 토큰 검증
      const decodedNewAccess = verifyAccessToken(response.body.accessToken);
      expect(decodedNewAccess).toBeTruthy();
      expect(decodedNewAccess.username).toBe(validUser.username);
    });

    it('리프레시 토큰 없이 요청시 실패', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', '리프레시 토큰이 필요합니다.');
    });

    it('잘못된 리프레시 토큰으로 요청시 실패', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('message', '유효하지 않은 리프레시 토큰입니다.');
    });
  });
}); 