import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';

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

  describe('권한 관리 테스트', () => {
    let adminToken;
    let userToken;

    beforeEach(async () => {
      // 일반 사용자 생성
      await request(app)
        .post('/auth/signup')
        .send(validUser);

      // 관리자 생성 (첫 번째 관리자)
      const adminUser = {
        username: 'admin',
        password: 'admin1234',
        nickname: 'Admin',
        authorities: [
          { authorityName: 'ROLE_USER' },
          { authorityName: 'ROLE_ADMIN' }
        ]
      };
      await User.create({
        ...adminUser,
        password: await bcrypt.hash(adminUser.password, 10)
      });

      // 관리자 로그인
      const adminLoginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: adminUser.username,
          password: adminUser.password
        });
      adminToken = adminLoginResponse.body.token;

      // 일반 사용자 로그인
      const userLoginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: validUser.username,
          password: validUser.password
        });
      userToken = userLoginResponse.body.token;
    });

    describe('관리자 계정 생성 테스트', () => {
      const newAdminUser = {
        username: 'newadmin',
        password: 'admin1234',
        nickname: 'NewAdmin'
      };

      it('관리자가 새로운 관리자 계정 생성 성공', async () => {
        const response = await request(app)
          .post('/auth/admin')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(newAdminUser)
          .expect(201);

        expect(response.body).toHaveProperty('username', newAdminUser.username);
        expect(response.body).toHaveProperty('nickname', newAdminUser.nickname);
        expect(response.body.authorities).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ authorityName: 'ROLE_USER' }),
            expect.objectContaining({ authorityName: 'ROLE_ADMIN' })
          ])
        );
      });

      it('일반 사용자가 관리자 계정 생성 시도시 실패', async () => {
        const response = await request(app)
          .post('/auth/admin')
          .set('Authorization', `Bearer ${userToken}`)
          .send(newAdminUser)
          .expect(403);

        expect(response.body).toHaveProperty('code', 'INSUFFICIENT_PERMISSIONS');
        expect(response.body).toHaveProperty('message', '접근 권한이 없습니다.');
      });

      it('인증 없이 관리자 계정 생성 시도시 실패', async () => {
        const response = await request(app)
          .post('/auth/admin')
          .send(newAdminUser)
          .expect(401);

        expect(response.body).toHaveProperty('code', 'NO_TOKEN');
        expect(response.body).toHaveProperty('message', '인증 토큰이 필요합니다.');
      });
    });
  });

  describe('로그아웃 및 토큰 블랙리스트 테스트', () => {
    let accessToken;
    let refreshToken;

    beforeEach(async () => {
      // 회원가입
      await request(app)
        .post('/auth/signup')
        .send(validUser);

      // 로그인
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: validUser.username,
          password: validUser.password,
        });
      
      accessToken = loginResponse.body.token;
      const user = await User.findOne({ username: validUser.username });
      refreshToken = user.refreshToken;
    });

    it('로그아웃 성공', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('code', 'SUCCESS');
      expect(response.body).toHaveProperty('message', '로그아웃 되었습니다.');

      // 로그아웃 후 토큰으로 접근 시도
      const protectedResponse = await request(app)
        .post('/auth/admin')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'newadmin',
          password: 'admin1234',
          nickname: 'NewAdmin'
        })
        .expect(401);

      expect(protectedResponse.body).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('로그아웃 후 리프레시 토큰 사용 실패', async () => {
      // 먼저 로그아웃
      await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 로그아웃 후 리프레시 토큰으로 새 토큰 발급 시도
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body).toHaveProperty('code', 'INVALID_REFRESH_TOKEN');
    });

    it('만료된 토큰 블랙리스트 처리', async () => {
      // 토큰 만료 시뮬레이션 (실제로는 15분 기다려야 함)
      const expiredTokenResponse = await request(app)
        .post('/auth/admin')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyM30.1234567890')
        .send({
          username: 'newadmin',
          password: 'admin1234',
          nickname: 'NewAdmin'
        })
        .expect(401);

      expect(expiredTokenResponse.body).toHaveProperty('code', 'INVALID_TOKEN');
    });
  });
}); 