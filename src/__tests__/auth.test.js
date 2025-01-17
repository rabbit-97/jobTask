import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

const validUser = {
  username: 'JIN HO',
  password: '12341234',
  nickname: 'Mentos'
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth API Tests', () => {
  describe('회원가입 테스트', () => {
    it('유효한 데이터로 회원가입 성공', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty('username', validUser.username);
      expect(response.body).toHaveProperty('nickname', validUser.nickname);
      expect(response.body).toHaveProperty('authorities');
      expect(response.body.authorities[0].authorityName).toBe('ROLE_USER');
    });

    it('중복된 username으로 회원가입 실패', async () => {
      // 첫 번째 회원가입
      await request(app)
        .post('/auth/signup')
        .send(validUser);

      // 중복 회원가입 시도
      const response = await request(app)
        .post('/auth/signup')
        .send(validUser)
        .expect(409);

      expect(response.body).toHaveProperty('code', 'USERNAME_EXISTS');
      expect(response.body).toHaveProperty('message', '이미 존재하는 사용자 이름입니다.');
    });

    it('필수 필드 누락시 회원가입 실패', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('code', 'MISSING_FIELD');
      expect(response.body).toHaveProperty('message', '모든 필드를 입력해주세요.');
    });
  });

  describe('로그인 테스트', () => {
    beforeEach(async () => {
      // 테스트용 사용자 생성
      await request(app)
        .post('/auth/signup')
        .send(validUser);
    });

    it('유효한 인증정보로 로그인 성공', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: validUser.username,
          password: validUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });

    it('잘못된 비밀번호로 로그인 실패', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: validUser.username,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('code', 'INVALID_CREDENTIALS');
      expect(response.body).toHaveProperty('message', '잘못된 사용자 이름 또는 비밀번호입니다.');
    });

    it('존재하지 않는 사용자로 로그인 실패', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistentuser',
          password: validUser.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('code', 'INVALID_CREDENTIALS');
      expect(response.body).toHaveProperty('message', '잘못된 사용자 이름 또는 비밀번호입니다.');
    });
  });

  describe('토큰 갱신 테스트', () => {
    let refreshToken;

    beforeEach(async () => {
      // 회원가입
      await request(app)
        .post('/auth/signup')
        .send(validUser);

      // 로그인
      await request(app)
        .post('/auth/login')
        .send({
          username: validUser.username,
          password: validUser.password,
        });

      // DB에서 리프레시 토큰 가져오기
      const user = await User.findOne({ username: validUser.username });
      refreshToken = user.refreshToken;
    });

    it('유효한 리프레시 토큰으로 액세스 토큰 갱신 성공', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });

    it('리프레시 토큰 없이 요청시 실패', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('code', 'NO_REFRESH_TOKEN');
      expect(response.body).toHaveProperty('message', '리프레시 토큰이 필요합니다.');
    });

    it('잘못된 리프레시 토큰으로 요청시 실패', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('code', 'INVALID_REFRESH_TOKEN');
      expect(response.body).toHaveProperty('message', '유효하지 않은 리프레시 토큰입니다.');
    });
  });
}); 